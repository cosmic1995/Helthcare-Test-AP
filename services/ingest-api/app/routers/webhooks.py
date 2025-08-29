"""Webhook endpoints for Pub/Sub event handling."""

import json
from datetime import datetime
from typing import Dict

import structlog
from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import JSONResponse

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.post("/file-uploaded")
async def handle_file_uploaded(request: Request):
    """Handle file uploaded webhook from Pub/Sub."""
    try:
        # Parse Pub/Sub message
        body = await request.body()
        pubsub_service = request.app.state.pubsub_service
        message = await pubsub_service.parse_pubsub_message(body)
        
        if not message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Pub/Sub message",
            )
        
        data = message["data"]
        file_path = data.get("file_path")
        project_id = data.get("project_id")
        user_id = data.get("user_id")
        file_info = data.get("file_info", {})
        
        logger.info(
            "Processing file uploaded event",
            file_path=file_path,
            project_id=project_id,
            user_id=user_id,
        )
        
        # Process the document with Document AI
        document_ai_service = request.app.state.document_ai_service
        parsed_data = await document_ai_service.process_document(
            file_path=file_path,
            bucket_name=request.app.state.storage_service.settings.incoming_bucket,
            project_id=project_id,
        )
        
        if not parsed_data:
            logger.error("Failed to parse document", file_path=file_path)
            return JSONResponse(
                content={"status": "error", "message": "Document parsing failed"},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        
        # Store requirements in BigQuery
        bigquery_service = request.app.state.bigquery_service
        storage_service = request.app.state.storage_service
        
        # Calculate file hash
        file_hash = await storage_service.calculate_file_hash(file_path)
        
        # Prepare requirements for insertion
        requirements = []
        for req in parsed_data.get("requirements", []):
            requirement_data = {
                "project_id": project_id,
                "source_uri": f"gs://{request.app.state.storage_service.settings.incoming_bucket}/{file_path}",
                "section_path": req["section_path"],
                "text": req["text"],
                "normative": req["normative"],
                "risk_class": req["risk_class"],
                "std_tags": req["std_tags"],
                "ingest_hash": file_hash,
                "confidence": req["confidence"],
            }
            requirements.append(requirement_data)
        
        # Insert requirements in batch
        if requirements:
            success = await bigquery_service.insert_requirements_batch(requirements)
            if not success:
                logger.error("Failed to store requirements", file_path=file_path)
                return JSONResponse(
                    content={"status": "error", "message": "Failed to store requirements"},
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        
        # Move file to processed bucket
        processed_path = file_path.replace("incoming/", "processed/")
        await storage_service.move_file(
            source_path=file_path,
            dest_path=processed_path,
            source_bucket=request.app.state.storage_service.settings.incoming_bucket,
            dest_bucket=request.app.state.storage_service.settings.processed_bucket,
        )
        
        # Publish document parsed event
        await pubsub_service.publish_document_parsed(
            file_path=processed_path,
            project_id=project_id,
            parsed_data=parsed_data,
            requirements_count=len(requirements),
        )
        
        # Start DLP processing if enabled
        dlp_service = request.app.state.dlp_service
        if request.app.state.storage_service.settings.enable_dlp:
            deidentified_path = processed_path.replace("processed/", "deidentified/")
            dlp_summary = await dlp_service.de_identify_document(
                source_file_path=processed_path,
                source_bucket=request.app.state.storage_service.settings.processed_bucket,
                dest_file_path=deidentified_path,
                dest_bucket=request.app.state.storage_service.settings.deidentified_bucket,
            )
            
            if dlp_summary:
                await pubsub_service.publish_dlp_completed(
                    source_file_path=processed_path,
                    dest_file_path=deidentified_path,
                    project_id=project_id,
                    dlp_summary=dlp_summary,
                )
        
        # Log audit event
        await bigquery_service.insert_audit_record({
            "user_id": user_id,
            "entity_id": file_path,
            "entity_type": "file",
            "action": "file_processed",
            "details": {
                "file_path": file_path,
                "processed_path": processed_path,
                "project_id": project_id,
                "requirements_count": len(requirements),
                "dlp_enabled": request.app.state.storage_service.settings.enable_dlp,
            },
            "ip_address": "pubsub",
            "user_agent": "pubsub-webhook",
        })
        
        logger.info(
            "File processed successfully",
            file_path=file_path,
            project_id=project_id,
            requirements_count=len(requirements),
        )
        
        return JSONResponse(
            content={
                "status": "success",
                "message": "File processed successfully",
                "requirements_count": len(requirements),
            },
            status_code=status.HTTP_200_OK,
        )
        
    except Exception as e:
        logger.error("Failed to process file uploaded event", error=str(e), exc_info=True)
        return JSONResponse(
            content={"status": "error", "message": str(e)},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.post("/document-parsed")
async def handle_document_parsed(request: Request):
    """Handle document parsed webhook from Pub/Sub."""
    try:
        # Parse Pub/Sub message
        body = await request.body()
        pubsub_service = request.app.state.pubsub_service
        message = await pubsub_service.parse_pubsub_message(body)
        
        if not message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Pub/Sub message",
            )
        
        data = message["data"]
        file_path = data.get("file_path")
        project_id = data.get("project_id")
        requirements_count = data.get("requirements_count", 0)
        
        logger.info(
            "Document parsed event received",
            file_path=file_path,
            project_id=project_id,
            requirements_count=requirements_count,
        )
        
        # This webhook is primarily for logging and monitoring
        # The actual processing is done in the file-uploaded webhook
        # Here we could trigger additional processing like:
        # - Generating embeddings for vector search
        # - Triggering AI test generation
        # - Sending notifications
        
        return JSONResponse(
            content={"status": "acknowledged"},
            status_code=status.HTTP_200_OK,
        )
        
    except Exception as e:
        logger.error("Failed to process document parsed event", error=str(e))
        return JSONResponse(
            content={"status": "error", "message": str(e)},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.post("/dlp-completed")
async def handle_dlp_completed(request: Request):
    """Handle DLP processing completed webhook from Pub/Sub."""
    try:
        # Parse Pub/Sub message
        body = await request.body()
        pubsub_service = request.app.state.pubsub_service
        message = await pubsub_service.parse_pubsub_message(body)
        
        if not message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Pub/Sub message",
            )
        
        data = message["data"]
        source_file_path = data.get("source_file_path")
        dest_file_path = data.get("dest_file_path")
        project_id = data.get("project_id")
        dlp_summary = data.get("dlp_summary", {})
        
        logger.info(
            "DLP processing completed",
            source_file_path=source_file_path,
            dest_file_path=dest_file_path,
            project_id=project_id,
            transformations=dlp_summary.get("transformations_applied", 0),
        )
        
        # Update file metadata to indicate DLP processing is complete
        # This could trigger the next stage of processing
        
        return JSONResponse(
            content={"status": "acknowledged"},
            status_code=status.HTTP_200_OK,
        )
        
    except Exception as e:
        logger.error("Failed to process DLP completed event", error=str(e))
        return JSONResponse(
            content={"status": "error", "message": str(e)},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
