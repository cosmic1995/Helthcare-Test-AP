"""Pub/Sub service for event-driven messaging."""

import json
from typing import Dict, Optional

import structlog
from google.cloud import pubsub_v1
from google.cloud.pubsub_v1.types import PubsubMessage

from app.config import get_settings

logger = structlog.get_logger(__name__)


class PubSubService:
    """Service for Google Cloud Pub/Sub operations."""
    
    def __init__(self):
        self.settings = get_settings()
        self.publisher = pubsub_v1.PublisherClient()
        self.subscriber = pubsub_v1.SubscriberClient()
        
        # Topic paths
        self.file_uploaded_topic = self.publisher.topic_path(
            self.settings.project_id,
            self.settings.pubsub_file_uploaded_topic
        )
        self.document_parsed_topic = self.publisher.topic_path(
            self.settings.project_id,
            self.settings.pubsub_document_parsed_topic
        )
        self.dlp_completed_topic = self.publisher.topic_path(
            self.settings.project_id,
            self.settings.pubsub_dlp_completed_topic
        )
    
    async def health_check(self) -> bool:
        """Check if Pub/Sub service is healthy."""
        try:
            # Test topic access
            self.publisher.get_topic(request={"topic": self.file_uploaded_topic})
            return True
        except Exception as e:
            logger.error("Pub/Sub health check failed", error=str(e))
            return False
    
    async def publish_file_uploaded(
        self,
        file_path: str,
        project_id: str,
        user_id: str,
        file_info: Dict,
    ) -> bool:
        """Publish file uploaded event."""
        try:
            message_data = {
                "event_type": "file_uploaded",
                "file_path": file_path,
                "project_id": project_id,
                "user_id": user_id,
                "file_info": file_info,
                "timestamp": file_info.get("created"),
            }
            
            # Convert to JSON bytes
            data = json.dumps(message_data).encode("utf-8")
            
            # Publish message
            future = self.publisher.publish(
                self.file_uploaded_topic,
                data,
                event_type="file_uploaded",
                project_id=project_id,
                user_id=user_id,
            )
            
            message_id = future.result()
            
            logger.info(
                "File uploaded event published",
                message_id=message_id,
                file_path=file_path,
                project_id=project_id,
            )
            
            return True
            
        except Exception as e:
            logger.error("Failed to publish file uploaded event", error=str(e))
            return False
    
    async def publish_document_parsed(
        self,
        file_path: str,
        project_id: str,
        parsed_data: Dict,
        requirements_count: int,
    ) -> bool:
        """Publish document parsed event."""
        try:
            message_data = {
                "event_type": "document_parsed",
                "file_path": file_path,
                "project_id": project_id,
                "requirements_count": requirements_count,
                "parsed_data_summary": {
                    "total_pages": parsed_data.get("metadata", {}).get("total_pages", 0),
                    "total_entities": parsed_data.get("metadata", {}).get("total_entities", 0),
                    "total_requirements": parsed_data.get("metadata", {}).get("total_requirements", 0),
                },
                "timestamp": parsed_data.get("metadata", {}).get("processed_at"),
            }
            
            # Convert to JSON bytes
            data = json.dumps(message_data).encode("utf-8")
            
            # Publish message
            future = self.publisher.publish(
                self.document_parsed_topic,
                data,
                event_type="document_parsed",
                project_id=project_id,
                requirements_count=str(requirements_count),
            )
            
            message_id = future.result()
            
            logger.info(
                "Document parsed event published",
                message_id=message_id,
                file_path=file_path,
                project_id=project_id,
                requirements_count=requirements_count,
            )
            
            return True
            
        except Exception as e:
            logger.error("Failed to publish document parsed event", error=str(e))
            return False
    
    async def publish_dlp_completed(
        self,
        source_file_path: str,
        dest_file_path: str,
        project_id: str,
        dlp_summary: Dict,
    ) -> bool:
        """Publish DLP processing completed event."""
        try:
            message_data = {
                "event_type": "dlp_completed",
                "source_file_path": source_file_path,
                "dest_file_path": dest_file_path,
                "project_id": project_id,
                "dlp_summary": dlp_summary,
                "timestamp": dlp_summary.get("processed_at"),
            }
            
            # Convert to JSON bytes
            data = json.dumps(message_data).encode("utf-8")
            
            # Publish message
            future = self.publisher.publish(
                self.dlp_completed_topic,
                data,
                event_type="dlp_completed",
                project_id=project_id,
                transformations=str(dlp_summary.get("transformations_applied", 0)),
            )
            
            message_id = future.result()
            
            logger.info(
                "DLP completed event published",
                message_id=message_id,
                source_file_path=source_file_path,
                dest_file_path=dest_file_path,
                project_id=project_id,
            )
            
            return True
            
        except Exception as e:
            logger.error("Failed to publish DLP completed event", error=str(e))
            return False
    
    async def parse_pubsub_message(self, request_data: bytes) -> Optional[Dict]:
        """Parse incoming Pub/Sub message."""
        try:
            # Decode the message
            message_data = json.loads(request_data.decode("utf-8"))
            
            # Extract message content
            if "message" in message_data:
                message = message_data["message"]
                
                # Decode data
                if "data" in message:
                    import base64
                    decoded_data = base64.b64decode(message["data"]).decode("utf-8")
                    data = json.loads(decoded_data)
                else:
                    data = {}
                
                # Extract attributes
                attributes = message.get("attributes", {})
                
                return {
                    "data": data,
                    "attributes": attributes,
                    "message_id": message.get("messageId"),
                    "publish_time": message.get("publishTime"),
                }
            
            return None
            
        except Exception as e:
            logger.error("Failed to parse Pub/Sub message", error=str(e))
            return None
    
    async def acknowledge_message(self, ack_id: str) -> bool:
        """Acknowledge a Pub/Sub message."""
        try:
            # In push subscriptions, messages are automatically acknowledged
            # when the endpoint returns a 200 status code
            logger.info("Message acknowledged", ack_id=ack_id)
            return True
            
        except Exception as e:
            logger.error("Failed to acknowledge message", ack_id=ack_id, error=str(e))
            return False
    
    async def create_subscription(
        self,
        subscription_name: str,
        topic_name: str,
        push_endpoint: str,
    ) -> bool:
        """Create a push subscription."""
        try:
            subscription_path = self.subscriber.subscription_path(
                self.settings.project_id,
                subscription_name
            )
            topic_path = self.publisher.topic_path(
                self.settings.project_id,
                topic_name
            )
            
            push_config = pubsub_v1.PushConfig(push_endpoint=push_endpoint)
            
            self.subscriber.create_subscription(
                request={
                    "name": subscription_path,
                    "topic": topic_path,
                    "push_config": push_config,
                    "ack_deadline_seconds": 600,
                }
            )
            
            logger.info(
                "Subscription created",
                subscription_name=subscription_name,
                topic_name=topic_name,
                push_endpoint=push_endpoint,
            )
            
            return True
            
        except Exception as e:
            logger.error("Failed to create subscription", error=str(e))
            return False
    
    async def delete_subscription(self, subscription_name: str) -> bool:
        """Delete a subscription."""
        try:
            subscription_path = self.subscriber.subscription_path(
                self.settings.project_id,
                subscription_name
            )
            
            self.subscriber.delete_subscription(
                request={"subscription": subscription_path}
            )
            
            logger.info("Subscription deleted", subscription_name=subscription_name)
            return True
            
        except Exception as e:
            logger.error("Failed to delete subscription", error=str(e))
            return False
