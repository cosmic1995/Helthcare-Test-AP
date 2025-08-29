"""Gemini AI service for text generation and analysis."""

import json
from typing import Dict, List, Optional

import structlog
import vertexai
from vertexai.generative_models import GenerativeModel, Part, SafetySetting, HarmCategory

from app.config import get_settings

logger = structlog.get_logger(__name__)


class GeminiService:
    """Service for Gemini AI operations."""
    
    def __init__(self):
        self.settings = get_settings()
        
        # Initialize Vertex AI
        vertexai.init(
            project=self.settings.project_id,
            location=self.settings.vertex_ai_location,
        )
        
        # Initialize Gemini model
        self.model = GenerativeModel(
            model_name=self.settings.gemini_model,
            safety_settings=[
                SafetySetting(
                    category=HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold=SafetySetting.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                ),
                SafetySetting(
                    category=HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold=SafetySetting.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                ),
                SafetySetting(
                    category=HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold=SafetySetting.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                ),
                SafetySetting(
                    category=HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold=SafetySetting.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                ),
            ],
        )
        
        # Initialize evaluation model
        self.evaluation_model = GenerativeModel(
            model_name=self.settings.evaluation_model,
        )
    
    async def health_check(self) -> bool:
        """Check if Gemini service is healthy."""
        try:
            # Test with a simple prompt
            response = await self.generate_text(
                prompt="Hello, this is a health check.",
                max_tokens=10,
            )
            return response is not None
        except Exception as e:
            logger.error("Gemini health check failed", error=str(e))
            return False
    
    async def generate_text(
        self,
        prompt: str,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        system_instruction: Optional[str] = None,
    ) -> Optional[str]:
        """Generate text using Gemini."""
        try:
            # Set generation config
            generation_config = {
                "max_output_tokens": max_tokens or self.settings.max_tokens,
                "temperature": temperature or self.settings.temperature,
                "top_p": 0.95,
                "top_k": 40,
            }
            
            # Create model with system instruction if provided
            if system_instruction:
                model = GenerativeModel(
                    model_name=self.settings.gemini_model,
                    system_instruction=system_instruction,
                )
            else:
                model = self.model
            
            # Generate response
            response = model.generate_content(
                prompt,
                generation_config=generation_config,
            )
            
            if response.text:
                logger.info(
                    "Text generated successfully",
                    prompt_length=len(prompt),
                    response_length=len(response.text),
                )
                return response.text
            else:
                logger.warning("Empty response from Gemini")
                return None
                
        except Exception as e:
            logger.error("Failed to generate text", error=str(e))
            return None
    
    async def generate_structured_output(
        self,
        prompt: str,
        schema: Dict,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> Optional[Dict]:
        """Generate structured output using Gemini with JSON schema."""
        try:
            # Add schema instruction to prompt
            schema_prompt = f"""
            {prompt}
            
            Please respond with valid JSON that matches this schema:
            {json.dumps(schema, indent=2)}
            
            Respond only with the JSON, no additional text.
            """
            
            response = await self.generate_text(
                prompt=schema_prompt,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            
            if response:
                try:
                    # Parse JSON response
                    structured_data = json.loads(response.strip())
                    logger.info("Structured output generated successfully")
                    return structured_data
                except json.JSONDecodeError as e:
                    logger.error("Failed to parse JSON response", error=str(e))
                    return None
            
            return None
            
        except Exception as e:
            logger.error("Failed to generate structured output", error=str(e))
            return None
    
    async def evaluate_test_quality(
        self,
        requirement: str,
        test_case: Dict,
        context: Optional[str] = None,
    ) -> Optional[Dict]:
        """Evaluate the quality of a generated test case."""
        try:
            evaluation_prompt = f"""
            You are an expert in healthcare compliance testing and quality assurance.
            
            Evaluate the following test case for the given requirement:
            
            REQUIREMENT:
            {requirement}
            
            TEST CASE:
            Title: {test_case.get('title', '')}
            Gherkin: {test_case.get('gherkin', '')}
            Steps: {json.dumps(test_case.get('steps', []), indent=2)}
            Expected Summary: {test_case.get('expected_summary', '')}
            
            {f"ADDITIONAL CONTEXT: {context}" if context else ""}
            
            Evaluate the test case on these criteria:
            1. Completeness: Does it fully test the requirement?
            2. Clarity: Is it clear and unambiguous?
            3. Traceability: Is it clearly linked to the requirement?
            4. Compliance: Does it address relevant compliance standards?
            5. Executability: Can it be executed by a tester?
            
            Provide scores (0.0-1.0) for each criterion and an overall quality score.
            Also provide specific feedback and suggestions for improvement.
            """
            
            schema = {
                "type": "object",
                "properties": {
                    "completeness_score": {"type": "number", "minimum": 0, "maximum": 1},
                    "clarity_score": {"type": "number", "minimum": 0, "maximum": 1},
                    "traceability_score": {"type": "number", "minimum": 0, "maximum": 1},
                    "compliance_score": {"type": "number", "minimum": 0, "maximum": 1},
                    "executability_score": {"type": "number", "minimum": 0, "maximum": 1},
                    "overall_quality_score": {"type": "number", "minimum": 0, "maximum": 1},
                    "feedback": {"type": "string"},
                    "suggestions": {"type": "array", "items": {"type": "string"}},
                    "compliance_gaps": {"type": "array", "items": {"type": "string"}},
                },
                "required": [
                    "completeness_score", "clarity_score", "traceability_score",
                    "compliance_score", "executability_score", "overall_quality_score",
                    "feedback", "suggestions", "compliance_gaps"
                ]
            }
            
            evaluation = await self.generate_structured_output(
                prompt=evaluation_prompt,
                schema=schema,
                temperature=0.1,
            )
            
            if evaluation:
                logger.info(
                    "Test quality evaluated",
                    overall_score=evaluation.get("overall_quality_score"),
                )
            
            return evaluation
            
        except Exception as e:
            logger.error("Failed to evaluate test quality", error=str(e))
            return None
    
    async def analyze_requirement_complexity(
        self,
        requirement: str,
        context: Optional[str] = None,
    ) -> Optional[Dict]:
        """Analyze the complexity and characteristics of a requirement."""
        try:
            analysis_prompt = f"""
            You are an expert in healthcare compliance and requirements analysis.
            
            Analyze the following requirement:
            
            REQUIREMENT:
            {requirement}
            
            {f"CONTEXT: {context}" if context else ""}
            
            Provide a comprehensive analysis including:
            1. Complexity level (low, medium, high)
            2. Risk classification (A, B, C, D)
            3. Compliance standards that apply
            4. Key testing areas to focus on
            5. Potential edge cases or challenges
            6. Recommended number of test cases
            """
            
            schema = {
                "type": "object",
                "properties": {
                    "complexity_level": {"type": "string", "enum": ["low", "medium", "high"]},
                    "risk_class": {"type": "string", "enum": ["A", "B", "C", "D"]},
                    "applicable_standards": {"type": "array", "items": {"type": "string"}},
                    "key_testing_areas": {"type": "array", "items": {"type": "string"}},
                    "edge_cases": {"type": "array", "items": {"type": "string"}},
                    "recommended_test_count": {"type": "integer", "minimum": 1, "maximum": 10},
                    "rationale": {"type": "string"},
                },
                "required": [
                    "complexity_level", "risk_class", "applicable_standards",
                    "key_testing_areas", "edge_cases", "recommended_test_count", "rationale"
                ]
            }
            
            analysis = await self.generate_structured_output(
                prompt=analysis_prompt,
                schema=schema,
                temperature=0.1,
            )
            
            if analysis:
                logger.info(
                    "Requirement analyzed",
                    complexity=analysis.get("complexity_level"),
                    risk_class=analysis.get("risk_class"),
                )
            
            return analysis
            
        except Exception as e:
            logger.error("Failed to analyze requirement", error=str(e))
            return None
    
    async def generate_compliance_mapping(
        self,
        requirement: str,
        standards: List[str],
    ) -> Optional[Dict]:
        """Generate compliance mapping for a requirement."""
        try:
            mapping_prompt = f"""
            You are an expert in healthcare compliance standards.
            
            Map the following requirement to specific clauses in the given standards:
            
            REQUIREMENT:
            {requirement}
            
            STANDARDS TO MAP TO:
            {', '.join(standards)}
            
            For each applicable standard, identify:
            1. Specific clauses/sections that apply
            2. Compliance obligations
            3. Testing requirements
            4. Documentation needs
            """
            
            schema = {
                "type": "object",
                "properties": {
                    "mappings": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "standard": {"type": "string"},
                                "clauses": {"type": "array", "items": {"type": "string"}},
                                "obligations": {"type": "array", "items": {"type": "string"}},
                                "testing_requirements": {"type": "array", "items": {"type": "string"}},
                                "documentation_needs": {"type": "array", "items": {"type": "string"}},
                            },
                            "required": ["standard", "clauses", "obligations", "testing_requirements", "documentation_needs"]
                        }
                    },
                    "overall_compliance_level": {"type": "string", "enum": ["low", "medium", "high"]},
                    "critical_gaps": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["mappings", "overall_compliance_level", "critical_gaps"]
            }
            
            mapping = await self.generate_structured_output(
                prompt=mapping_prompt,
                schema=schema,
                temperature=0.1,
            )
            
            if mapping:
                logger.info(
                    "Compliance mapping generated",
                    standards_mapped=len(mapping.get("mappings", [])),
                )
            
            return mapping
            
        except Exception as e:
            logger.error("Failed to generate compliance mapping", error=str(e))
            return None
