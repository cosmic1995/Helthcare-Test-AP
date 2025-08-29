"""Data Loss Prevention service for de-identifying sensitive data."""

import json
from typing import Dict, List, Optional

import structlog
from google.cloud import dlp_v2
from google.cloud import storage

from app.config import get_settings

logger = structlog.get_logger(__name__)


class DLPService:
    """Service for Data Loss Prevention operations."""
    
    def __init__(self):
        self.settings = get_settings()
        self.client = dlp_v2.DlpServiceClient()
        self.storage_client = storage.Client()
        self.parent = f"projects/{self.settings.project_id}"
    
    async def de_identify_document(
        self,
        source_file_path: str,
        source_bucket: str,
        dest_file_path: str,
        dest_bucket: str,
    ) -> Optional[Dict]:
        """De-identify a document and store the result."""
        try:
            # Get the source document
            source_bucket_obj = self.storage_client.bucket(source_bucket)
            source_blob = source_bucket_obj.blob(source_file_path)
            
            if not source_blob.exists():
                logger.error("Source document not found", file_path=source_file_path)
                return None
            
            # Download document content
            document_content = source_blob.download_as_bytes()
            
            # Create DLP request
            inspect_config = self._create_inspect_config()
            deidentify_config = self._create_deidentify_config()
            
            # Create the item to de-identify
            item = dlp_v2.ContentItem(
                byte_item=dlp_v2.ByteContentItem(
                    type_=dlp_v2.ByteContentItem.BytesType.TEXT_UTF8,
                    data=document_content,
                )
            )
            
            # Call the API
            request = dlp_v2.DeidentifyContentRequest(
                parent=self.parent,
                inspect_config=inspect_config,
                deidentify_config=deidentify_config,
                item=item,
            )
            
            response = self.client.deidentify_content(request=request)
            
            # Store de-identified content
            dest_bucket_obj = self.storage_client.bucket(dest_bucket)
            dest_blob = dest_bucket_obj.blob(dest_file_path)
            
            dest_blob.upload_from_string(
                response.item.byte_item.data,
                content_type=source_blob.content_type,
            )
            
            # Copy metadata
            dest_blob.metadata = source_blob.metadata.copy() if source_blob.metadata else {}
            dest_blob.metadata["dlp_processed"] = "true"
            dest_blob.metadata["dlp_timestamp"] = str(response.overview.transformation_summaries[0].transformation.primitive_transformation)
            dest_blob.patch()
            
            # Create summary
            summary = {
                "source_path": source_file_path,
                "dest_path": dest_file_path,
                "transformations_applied": len(response.overview.transformation_summaries),
                "info_types_found": [
                    summary.info_type.name
                    for summary in response.overview.transformation_summaries
                ],
            }
            
            logger.info(
                "Document de-identified successfully",
                source_path=source_file_path,
                dest_path=dest_file_path,
                transformations=summary["transformations_applied"],
            )
            
            return summary
            
        except Exception as e:
            logger.error("Failed to de-identify document", error=str(e))
            return None
    
    async def inspect_document(
        self,
        file_path: str,
        bucket_name: str,
    ) -> Optional[Dict]:
        """Inspect a document for sensitive information."""
        try:
            # Get the document
            bucket = self.storage_client.bucket(bucket_name)
            blob = bucket.blob(file_path)
            
            if not blob.exists():
                logger.error("Document not found", file_path=file_path)
                return None
            
            # Download document content
            document_content = blob.download_as_bytes()
            
            # Create inspect config
            inspect_config = self._create_inspect_config()
            
            # Create the item to inspect
            item = dlp_v2.ContentItem(
                byte_item=dlp_v2.ByteContentItem(
                    type_=dlp_v2.ByteContentItem.BytesType.TEXT_UTF8,
                    data=document_content,
                )
            )
            
            # Call the API
            request = dlp_v2.InspectContentRequest(
                parent=self.parent,
                inspect_config=inspect_config,
                item=item,
            )
            
            response = self.client.inspect_content(request=request)
            
            # Process findings
            findings = []
            for finding in response.result.findings:
                findings.append({
                    "info_type": finding.info_type.name,
                    "likelihood": finding.likelihood.name,
                    "quote": finding.quote,
                    "location": {
                        "byte_range": {
                            "start": finding.location.byte_range.start,
                            "end": finding.location.byte_range.end,
                        }
                    }
                })
            
            summary = {
                "file_path": file_path,
                "total_findings": len(findings),
                "findings": findings,
                "info_types_found": list(set(f["info_type"] for f in findings)),
            }
            
            logger.info(
                "Document inspected",
                file_path=file_path,
                findings_count=len(findings),
                info_types=summary["info_types_found"],
            )
            
            return summary
            
        except Exception as e:
            logger.error("Failed to inspect document", error=str(e))
            return None
    
    def _create_inspect_config(self) -> dlp_v2.InspectConfig:
        """Create DLP inspect configuration."""
        # Define info types to look for
        info_types = [
            dlp_v2.InfoType(name="PERSON_NAME"),
            dlp_v2.InfoType(name="EMAIL_ADDRESS"),
            dlp_v2.InfoType(name="PHONE_NUMBER"),
            dlp_v2.InfoType(name="SSN"),
            dlp_v2.InfoType(name="DATE_OF_BIRTH"),
            dlp_v2.InfoType(name="MEDICAL_RECORD_NUMBER"),
            dlp_v2.InfoType(name="US_HEALTHCARE_NPI"),
            dlp_v2.InfoType(name="CREDIT_CARD_NUMBER"),
            dlp_v2.InfoType(name="IBAN_CODE"),
            dlp_v2.InfoType(name="IP_ADDRESS"),
        ]
        
        # Custom info types for healthcare
        custom_info_types = [
            dlp_v2.CustomInfoType(
                info_type=dlp_v2.InfoType(name="PATIENT_ID"),
                regex=dlp_v2.CustomInfoType.Regex(pattern=r"PAT-\d{6,8}"),
                likelihood=dlp_v2.Likelihood.LIKELY,
            ),
            dlp_v2.CustomInfoType(
                info_type=dlp_v2.InfoType(name="DEVICE_SERIAL"),
                regex=dlp_v2.CustomInfoType.Regex(pattern=r"DEV-[A-Z0-9]{8,12}"),
                likelihood=dlp_v2.Likelihood.POSSIBLE,
            ),
        ]
        
        return dlp_v2.InspectConfig(
            info_types=info_types,
            custom_info_types=custom_info_types,
            min_likelihood=dlp_v2.Likelihood.POSSIBLE,
            include_quote=True,
            limits=dlp_v2.InspectConfig.FindingLimits(
                max_findings_per_info_type=100,
                max_findings_per_request=1000,
            ),
        )
    
    def _create_deidentify_config(self) -> dlp_v2.DeidentifyConfig:
        """Create DLP de-identify configuration."""
        # Define transformation for different info types
        transformations = []
        
        # Replace names with generic placeholders
        name_transformation = dlp_v2.InfoTypeTransformations.InfoTypeTransformation(
            info_types=[dlp_v2.InfoType(name="PERSON_NAME")],
            primitive_transformation=dlp_v2.PrimitiveTransformation(
                replace_config=dlp_v2.ReplaceValueConfig(
                    new_value=dlp_v2.Value(string_value="[PERSON_NAME]")
                )
            ),
        )
        transformations.append(name_transformation)
        
        # Mask email addresses
        email_transformation = dlp_v2.InfoTypeTransformations.InfoTypeTransformation(
            info_types=[dlp_v2.InfoType(name="EMAIL_ADDRESS")],
            primitive_transformation=dlp_v2.PrimitiveTransformation(
                character_mask_config=dlp_v2.CharacterMaskConfig(
                    masking_character="*",
                    number_to_mask=5,
                )
            ),
        )
        transformations.append(email_transformation)
        
        # Replace phone numbers
        phone_transformation = dlp_v2.InfoTypeTransformations.InfoTypeTransformation(
            info_types=[dlp_v2.InfoType(name="PHONE_NUMBER")],
            primitive_transformation=dlp_v2.PrimitiveTransformation(
                replace_config=dlp_v2.ReplaceValueConfig(
                    new_value=dlp_v2.Value(string_value="[PHONE_NUMBER]")
                )
            ),
        )
        transformations.append(phone_transformation)
        
        # Replace SSN
        ssn_transformation = dlp_v2.InfoTypeTransformations.InfoTypeTransformation(
            info_types=[dlp_v2.InfoType(name="SSN")],
            primitive_transformation=dlp_v2.PrimitiveTransformation(
                replace_config=dlp_v2.ReplaceValueConfig(
                    new_value=dlp_v2.Value(string_value="[SSN]")
                )
            ),
        )
        transformations.append(ssn_transformation)
        
        # Date shifting for dates
        date_transformation = dlp_v2.InfoTypeTransformations.InfoTypeTransformation(
            info_types=[dlp_v2.InfoType(name="DATE_OF_BIRTH")],
            primitive_transformation=dlp_v2.PrimitiveTransformation(
                date_shift_config=dlp_v2.DateShiftConfig(
                    upper_bound_days=30,
                    lower_bound_days=-30,
                )
            ),
        )
        transformations.append(date_transformation)
        
        return dlp_v2.DeidentifyConfig(
            info_type_transformations=dlp_v2.InfoTypeTransformations(
                transformations=transformations
            )
        )
    
    async def create_dlp_job(
        self,
        source_bucket: str,
        source_path: str,
        dest_bucket: str,
        dest_path: str,
    ) -> Optional[str]:
        """Create a DLP job for batch processing."""
        try:
            # Configure storage input
            storage_config = dlp_v2.StorageConfig(
                cloud_storage_options=dlp_v2.CloudStorageOptions(
                    file_set=dlp_v2.CloudStorageOptions.FileSet(
                        url=f"gs://{source_bucket}/{source_path}"
                    ),
                    bytes_limit_per_file=50 * 1024 * 1024,  # 50MB limit
                )
            )
            
            # Configure output
            output_config = dlp_v2.OutputStorageConfig(
                table=dlp_v2.BigQueryTable(
                    project_id=self.settings.project_id,
                    dataset_id=self.settings.bigquery_dataset,
                    table_id="dlp_findings",
                )
            )
            
            # Create inspect job config
            inspect_job = dlp_v2.InspectJobConfig(
                inspect_config=self._create_inspect_config(),
                storage_config=storage_config,
                actions=[
                    dlp_v2.Action(
                        save_findings=dlp_v2.Action.SaveFindings(
                            output_config=output_config
                        )
                    )
                ],
            )
            
            # Create the job
            request = dlp_v2.CreateDlpJobRequest(
                parent=self.parent,
                inspect_job=inspect_job,
            )
            
            response = self.client.create_dlp_job(request=request)
            
            logger.info(
                "DLP job created",
                job_name=response.name,
                source_path=f"gs://{source_bucket}/{source_path}",
            )
            
            return response.name
            
        except Exception as e:
            logger.error("Failed to create DLP job", error=str(e))
            return None
    
    async def get_dlp_job_status(self, job_name: str) -> Optional[Dict]:
        """Get the status of a DLP job."""
        try:
            request = dlp_v2.GetDlpJobRequest(name=job_name)
            response = self.client.get_dlp_job(request=request)
            
            return {
                "name": response.name,
                "state": response.state.name,
                "create_time": response.create_time.timestamp() if response.create_time else None,
                "start_time": response.start_time.timestamp() if response.start_time else None,
                "end_time": response.end_time.timestamp() if response.end_time else None,
                "errors": [error.details for error in response.errors],
            }
            
        except Exception as e:
            logger.error("Failed to get DLP job status", job_name=job_name, error=str(e))
            return None
