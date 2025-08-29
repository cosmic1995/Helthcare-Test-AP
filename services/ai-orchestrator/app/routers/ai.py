"""AI orchestration API routes."""

import json
from typing import Dict, List, Optional

import structlog
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.config import get_settings
from app.middleware import get_current_user
from app.services.evaluation_service import EvaluationService
from app.services.gemini_service import GeminiService
from app.services.rag_service import RAGService
from app.services.test_generation_service import TestGenerationService
from app.services.vector_search_service import VectorSearchService

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/ai", tags=["AI Orchestration"])

# Pydantic models for request/response
class TestGenerationRequest(BaseModel):
    req_ids: List[str] = Field(..., description="List of requirement IDs to generate tests for")
    project_id: str = Field(..., description="Project ID")
    max_tests_per_req: Optional[int] = Field(3, description="Maximum tests per requirement")
    use_rag: Optional[bool] = Field(True, description="Use RAG for context")
    enhance_tests: Optional[bool] = Field(False, description="Enhance tests with examples")

class TestEvaluationRequest(BaseModel):
    test_ids: List[str] = Field(..., description="List of test IDs to evaluate")
    project_id: str = Field(..., description="Project ID")
    include_recommendations: Optional[bool] = Field(True, description="Include improvement recommendations")

class ComplianceMappingRequest(BaseModel):
    requirement_text: str = Field(..., description="Requirement text to analyze")
    standards: List[str] = Field(..., description="Compliance standards to map against")

class RequirementAnalysisRequest(BaseModel):
    req_ids: List[str] = Field(..., description="List of requirement IDs to analyze")
    project_id: str = Field(..., description="Project ID")
    analysis_type: str = Field("complexity", description="Type of analysis: complexity, risk, coverage")

class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: float
    result: Optional[Dict] = None
    error: Optional[str] = None
    created_at: str
    updated_at: str

# Service dependencies
async def get_gemini_service():
    return GeminiService()

async def get_test_generation_service():
    return TestGenerationService()

async def get_evaluation_service():
    return EvaluationService()

async def get_rag_service():
    return RAGService()

async def get_vector_search_service():
    return VectorSearchService()

# In-memory job tracking (in production, use Redis or database)
job_store = {}

@router.post("/generate-tests")
async def generate_tests(
    request: TestGenerationRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict = Depends(get_current_user),
    gemini_service: GeminiService = Depends(get_gemini_service),
    test_gen_service: TestGenerationService = Depends(get_test_generation_service),
    rag_service: RAGService = Depends(get_rag_service),
):
    """Generate test cases for requirements using AI."""
    try:
        # Validate user has access to project
        # This would typically check project permissions
        
        # Create job ID and start background task
        import uuid
        job_id = str(uuid.uuid4())
        
        job_store[job_id] = {
            "job_id": job_id,
            "status": "started",
            "progress": 0.0,
            "result": None,
            "error": None,
            "created_at": "2024-01-01T00:00:00Z",  # Would use datetime.utcnow()
            "updated_at": "2024-01-01T00:00:00Z",
        }
        
        # Start background task
        background_tasks.add_task(
            _generate_tests_background,
            job_id=job_id,
            request=request,
            gemini_service=gemini_service,
            test_gen_service=test_gen_service,
            rag_service=rag_service if request.use_rag else None,
        )
        
        logger.info(
            "Test generation job started",
            job_id=job_id,
            user_id=current_user.get("uid"),
            project_id=request.project_id,
            req_count=len(request.req_ids),
        )
        
        return {
            "job_id": job_id,
            "status": "started",
            "message": f"Started generating tests for {len(request.req_ids)} requirements",
        }
        
    except Exception as e:
        logger.error("Failed to start test generation", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start test generation: {str(e)}",
        )

async def _generate_tests_background(
    job_id: str,
    request: TestGenerationRequest,
    gemini_service: GeminiService,
    test_gen_service: TestGenerationService,
    rag_service: RAGService = None,
):
    """Background task for test generation."""
    try:
        # Update job status
        job_store[job_id]["status"] = "running"
        job_store[job_id]["progress"] = 0.1
        
        # Get requirements from BigQuery (simplified)
        # In production, this would use the BigQuery service
        requirements = []  # Placeholder
        
        job_store[job_id]["progress"] = 0.3
        
        # Generate tests
        result = await test_gen_service.generate_tests_batch(
            requirements=requirements,
            gemini_service=gemini_service,
            rag_service=rag_service,
        )
        
        job_store[job_id]["progress"] = 0.9
        
        # Store results (in production, save to BigQuery)
        job_store[job_id]["result"] = result
        job_store[job_id]["status"] = "completed"
        job_store[job_id]["progress"] = 1.0
        
        logger.info(
            "Test generation completed",
            job_id=job_id,
            tests_generated=result.get("total_tests_generated", 0),
        )
        
    except Exception as e:
        logger.error("Test generation failed", job_id=job_id, error=str(e))
        job_store[job_id]["status"] = "failed"
        job_store[job_id]["error"] = str(e)

@router.post("/evaluate-tests")
async def evaluate_tests(
    request: TestEvaluationRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict = Depends(get_current_user),
    evaluation_service: EvaluationService = Depends(get_evaluation_service),
    gemini_service: GeminiService = Depends(get_gemini_service),
):
    """Evaluate test cases for quality and compliance."""
    try:
        import uuid
        job_id = str(uuid.uuid4())
        
        job_store[job_id] = {
            "job_id": job_id,
            "status": "started",
            "progress": 0.0,
            "result": None,
            "error": None,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z",
        }
        
        background_tasks.add_task(
            _evaluate_tests_background,
            job_id=job_id,
            request=request,
            evaluation_service=evaluation_service,
            gemini_service=gemini_service,
        )
        
        logger.info(
            "Test evaluation job started",
            job_id=job_id,
            user_id=current_user.get("uid"),
            test_count=len(request.test_ids),
        )
        
        return {
            "job_id": job_id,
            "status": "started",
            "message": f"Started evaluating {len(request.test_ids)} test cases",
        }
        
    except Exception as e:
        logger.error("Failed to start test evaluation", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start test evaluation: {str(e)}",
        )

async def _evaluate_tests_background(
    job_id: str,
    request: TestEvaluationRequest,
    evaluation_service: EvaluationService,
    gemini_service: GeminiService,
):
    """Background task for test evaluation."""
    try:
        job_store[job_id]["status"] = "running"
        job_store[job_id]["progress"] = 0.1
        
        # Get test cases and requirements (simplified)
        test_cases = []  # Placeholder
        requirements = []  # Placeholder
        
        job_store[job_id]["progress"] = 0.3
        
        # Evaluate tests
        result = await evaluation_service.evaluate_test_batch(
            test_cases=test_cases,
            requirements=requirements,
            gemini_service=gemini_service,
        )
        
        job_store[job_id]["result"] = result
        job_store[job_id]["status"] = "completed"
        job_store[job_id]["progress"] = 1.0
        
        logger.info(
            "Test evaluation completed",
            job_id=job_id,
            tests_evaluated=result.get("evaluated_tests", 0),
            average_score=result.get("average_score", 0.0),
        )
        
    except Exception as e:
        logger.error("Test evaluation failed", job_id=job_id, error=str(e))
        job_store[job_id]["status"] = "failed"
        job_store[job_id]["error"] = str(e)

@router.post("/compliance-mapping")
async def generate_compliance_mapping(
    request: ComplianceMappingRequest,
    current_user: Dict = Depends(get_current_user),
    gemini_service: GeminiService = Depends(get_gemini_service),
):
    """Generate compliance mapping for a requirement."""
    try:
        mapping = await gemini_service.generate_compliance_mapping(
            requirement_text=request.requirement_text,
            standards=request.standards,
        )
        
        logger.info(
            "Compliance mapping generated",
            user_id=current_user.get("uid"),
            standards=request.standards,
            mappings_count=len(mapping.get("mappings", [])),
        )
        
        return mapping
        
    except Exception as e:
        logger.error("Failed to generate compliance mapping", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate compliance mapping: {str(e)}",
        )

@router.post("/analyze-requirements")
async def analyze_requirements(
    request: RequirementAnalysisRequest,
    current_user: Dict = Depends(get_current_user),
    gemini_service: GeminiService = Depends(get_gemini_service),
    rag_service: RAGService = Depends(get_rag_service),
):
    """Analyze requirements for complexity, risk, or coverage."""
    try:
        # Get requirements (simplified)
        requirements = []  # Placeholder
        
        results = []
        
        for requirement in requirements:
            if request.analysis_type == "complexity":
                analysis = await gemini_service.analyze_requirement_complexity(
                    requirement["text"]
                )
            elif request.analysis_type == "risk":
                # Risk analysis would be implemented
                analysis = {"risk_level": "medium", "risk_factors": []}
            elif request.analysis_type == "coverage":
                analysis = await rag_service.analyze_requirement_coverage(
                    project_id=request.project_id,
                    requirement_ids=[requirement["req_id"]],
                )
            else:
                analysis = {"error": "Unknown analysis type"}
            
            results.append({
                "req_id": requirement["req_id"],
                "analysis": analysis,
            })
        
        logger.info(
            "Requirements analyzed",
            user_id=current_user.get("uid"),
            project_id=request.project_id,
            analysis_type=request.analysis_type,
            req_count=len(request.req_ids),
        )
        
        return {
            "analysis_type": request.analysis_type,
            "results": results,
        }
        
    except Exception as e:
        logger.error("Failed to analyze requirements", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze requirements: {str(e)}",
        )

@router.get("/jobs/{job_id}/status")
async def get_job_status(
    job_id: str,
    current_user: Dict = Depends(get_current_user),
):
    """Get the status of an AI job."""
    try:
        if job_id not in job_store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )
        
        job_data = job_store[job_id]
        
        return JobStatusResponse(**job_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get job status", job_id=job_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get job status: {str(e)}",
        )

@router.delete("/jobs/{job_id}")
async def cancel_job(
    job_id: str,
    current_user: Dict = Depends(get_current_user),
):
    """Cancel an AI job."""
    try:
        if job_id not in job_store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )
        
        job_data = job_store[job_id]
        
        if job_data["status"] in ["completed", "failed", "cancelled"]:
            return {"message": f"Job already {job_data['status']}"}
        
        job_store[job_id]["status"] = "cancelled"
        
        logger.info(
            "Job cancelled",
            job_id=job_id,
            user_id=current_user.get("uid"),
        )
        
        return {"message": "Job cancelled successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to cancel job", job_id=job_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel job: {str(e)}",
        )

@router.get("/models/status")
async def get_models_status(
    current_user: Dict = Depends(get_current_user),
    gemini_service: GeminiService = Depends(get_gemini_service),
    vector_search_service: VectorSearchService = Depends(get_vector_search_service),
):
    """Get the status of AI models and services."""
    try:
        settings = get_settings()
        
        # Check Gemini service
        gemini_health = await gemini_service.health_check()
        
        # Check vector search service
        vector_health = await vector_search_service.health_check()
        
        status_info = {
            "gemini_service": {
                "model": settings.gemini_model,
                "location": settings.vertex_ai_location,
                "healthy": gemini_health.get("overall", False),
                "details": gemini_health,
            },
            "vector_search": {
                "embedding_model": settings.embedding_model_name,
                "healthy": vector_health.get("overall", False),
                "details": vector_health,
            },
            "overall_healthy": (
                gemini_health.get("overall", False) and
                vector_health.get("overall", False)
            ),
        }
        
        logger.info(
            "AI models status checked",
            user_id=current_user.get("uid"),
            overall_healthy=status_info["overall_healthy"],
        )
        
        return status_info
        
    except Exception as e:
        logger.error("Failed to get models status", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get models status: {str(e)}",
        )
