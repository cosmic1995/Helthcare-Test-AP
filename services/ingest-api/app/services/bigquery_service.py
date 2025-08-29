"""BigQuery service for data storage and querying."""

import uuid
from datetime import datetime
from typing import Dict, List, Optional

import structlog
from google.cloud import bigquery
from google.cloud.exceptions import NotFound

from app.config import get_settings

logger = structlog.get_logger(__name__)


class BigQueryService:
    """Service for BigQuery operations."""
    
    def __init__(self):
        self.settings = get_settings()
        self.client = bigquery.Client()
        self.dataset_id = self.settings.bigquery_dataset
        self.dataset_ref = self.client.dataset(self.dataset_id)
    
    async def health_check(self) -> bool:
        """Check if BigQuery service is healthy."""
        try:
            # Test dataset access
            self.client.get_dataset(self.dataset_ref)
            return True
        except Exception as e:
            logger.error("BigQuery health check failed", error=str(e))
            return False
    
    async def insert_requirement(self, requirement_data: Dict) -> bool:
        """Insert a requirement record into BigQuery."""
        try:
            table_ref = self.dataset_ref.table("requirements")
            table = self.client.get_table(table_ref)
            
            # Prepare row data
            row = {
                "req_id": requirement_data.get("req_id", str(uuid.uuid4())),
                "project_id": requirement_data["project_id"],
                "source_uri": requirement_data["source_uri"],
                "section_path": requirement_data["section_path"],
                "text": requirement_data["text"],
                "normative": requirement_data.get("normative", True),
                "risk_class": requirement_data.get("risk_class", "C"),
                "std_tags": requirement_data.get("std_tags", []),
                "ingest_hash": requirement_data["ingest_hash"],
                "confidence": requirement_data.get("confidence", 0.0),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
            
            # Insert row
            errors = self.client.insert_rows_json(table, [row])
            
            if errors:
                logger.error("Failed to insert requirement", errors=errors)
                return False
            
            logger.info(
                "Requirement inserted successfully",
                req_id=row["req_id"],
                project_id=row["project_id"],
            )
            
            return True
            
        except Exception as e:
            logger.error("Failed to insert requirement", error=str(e))
            return False
    
    async def insert_requirements_batch(self, requirements: List[Dict]) -> bool:
        """Insert multiple requirements in batch."""
        try:
            table_ref = self.dataset_ref.table("requirements")
            table = self.client.get_table(table_ref)
            
            # Prepare rows
            rows = []
            for req_data in requirements:
                row = {
                    "req_id": req_data.get("req_id", str(uuid.uuid4())),
                    "project_id": req_data["project_id"],
                    "source_uri": req_data["source_uri"],
                    "section_path": req_data["section_path"],
                    "text": req_data["text"],
                    "normative": req_data.get("normative", True),
                    "risk_class": req_data.get("risk_class", "C"),
                    "std_tags": req_data.get("std_tags", []),
                    "ingest_hash": req_data["ingest_hash"],
                    "confidence": req_data.get("confidence", 0.0),
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                }
                rows.append(row)
            
            # Insert rows in batches of 1000
            batch_size = 1000
            for i in range(0, len(rows), batch_size):
                batch = rows[i:i + batch_size]
                errors = self.client.insert_rows_json(table, batch)
                
                if errors:
                    logger.error("Failed to insert requirements batch", errors=errors)
                    return False
            
            logger.info(
                "Requirements batch inserted successfully",
                count=len(rows),
            )
            
            return True
            
        except Exception as e:
            logger.error("Failed to insert requirements batch", error=str(e))
            return False
    
    async def get_requirements(
        self,
        project_id: str,
        limit: int = 100,
        offset: int = 0,
        filters: Optional[Dict] = None,
    ) -> List[Dict]:
        """Get requirements with optional filters."""
        try:
            # Build query
            query = f"""
            SELECT *
            FROM `{self.settings.project_id}.{self.dataset_id}.requirements`
            WHERE project_id = @project_id
            """
            
            query_params = [
                bigquery.ScalarQueryParameter("project_id", "STRING", project_id)
            ]
            
            # Add filters
            if filters:
                if "risk_class" in filters:
                    query += " AND risk_class = @risk_class"
                    query_params.append(
                        bigquery.ScalarQueryParameter("risk_class", "STRING", filters["risk_class"])
                    )
                
                if "std_tags" in filters:
                    query += " AND @std_tag IN UNNEST(std_tags)"
                    query_params.append(
                        bigquery.ScalarQueryParameter("std_tag", "STRING", filters["std_tags"])
                    )
            
            query += f" ORDER BY created_at DESC LIMIT {limit} OFFSET {offset}"
            
            # Execute query
            job_config = bigquery.QueryJobConfig(query_parameters=query_params)
            query_job = self.client.query(query, job_config=job_config)
            
            results = []
            for row in query_job:
                results.append(dict(row))
            
            logger.info(
                "Retrieved requirements",
                project_id=project_id,
                count=len(results),
                filters=filters,
            )
            
            return results
            
        except Exception as e:
            logger.error("Failed to get requirements", error=str(e))
            return []
    
    async def insert_audit_record(self, audit_data: Dict) -> bool:
        """Insert an audit trail record."""
        try:
            table_ref = self.dataset_ref.table("audit_trail")
            table = self.client.get_table(table_ref)
            
            # Prepare audit record
            row = {
                "audit_id": str(uuid.uuid4()),
                "user_id": audit_data["user_id"],
                "entity_id": audit_data["entity_id"],
                "entity_type": audit_data["entity_type"],
                "action": audit_data["action"],
                "details": audit_data.get("details"),
                "ip_address": audit_data.get("ip_address"),
                "user_agent": audit_data.get("user_agent"),
                "signature_hash": audit_data.get("signature_hash"),
                "timestamp": datetime.utcnow(),
            }
            
            # Insert row
            errors = self.client.insert_rows_json(table, [row])
            
            if errors:
                logger.error("Failed to insert audit record", errors=errors)
                return False
            
            logger.info(
                "Audit record inserted",
                audit_id=row["audit_id"],
                user_id=row["user_id"],
                action=row["action"],
            )
            
            return True
            
        except Exception as e:
            logger.error("Failed to insert audit record", error=str(e))
            return False
    
    async def check_duplicate_file(self, ingest_hash: str, project_id: str) -> Optional[str]:
        """Check if a file with the same hash has already been processed."""
        try:
            query = f"""
            SELECT req_id
            FROM `{self.settings.project_id}.{self.dataset_id}.requirements`
            WHERE ingest_hash = @ingest_hash AND project_id = @project_id
            LIMIT 1
            """
            
            job_config = bigquery.QueryJobConfig(
                query_parameters=[
                    bigquery.ScalarQueryParameter("ingest_hash", "STRING", ingest_hash),
                    bigquery.ScalarQueryParameter("project_id", "STRING", project_id),
                ]
            )
            
            query_job = self.client.query(query, job_config=job_config)
            
            for row in query_job:
                logger.info(
                    "Duplicate file detected",
                    ingest_hash=ingest_hash,
                    existing_req_id=row["req_id"],
                )
                return row["req_id"]
            
            return None
            
        except Exception as e:
            logger.error("Failed to check duplicate file", error=str(e))
            return None
    
    async def get_project_stats(self, project_id: str) -> Dict:
        """Get statistics for a project."""
        try:
            query = f"""
            SELECT
                COUNT(*) as total_requirements,
                COUNT(DISTINCT risk_class) as risk_classes,
                ARRAY_AGG(DISTINCT std_tag) as std_tags
            FROM `{self.settings.project_id}.{self.dataset_id}.requirements`,
            UNNEST(std_tags) as std_tag
            WHERE project_id = @project_id
            """
            
            job_config = bigquery.QueryJobConfig(
                query_parameters=[
                    bigquery.ScalarQueryParameter("project_id", "STRING", project_id)
                ]
            )
            
            query_job = self.client.query(query, job_config=job_config)
            
            for row in query_job:
                return {
                    "total_requirements": row["total_requirements"],
                    "risk_classes": row["risk_classes"],
                    "std_tags": row["std_tags"],
                }
            
            return {"total_requirements": 0, "risk_classes": 0, "std_tags": []}
            
        except Exception as e:
            logger.error("Failed to get project stats", error=str(e))
            return {"total_requirements": 0, "risk_classes": 0, "std_tags": []}
    
    async def execute_query(self, query: str, parameters: Optional[List] = None) -> List[Dict]:
        """Execute a custom query."""
        try:
            job_config = bigquery.QueryJobConfig()
            if parameters:
                job_config.query_parameters = parameters
            
            query_job = self.client.query(query, job_config=job_config)
            
            results = []
            for row in query_job:
                results.append(dict(row))
            
            return results
            
        except Exception as e:
            logger.error("Failed to execute query", error=str(e))
            return []
