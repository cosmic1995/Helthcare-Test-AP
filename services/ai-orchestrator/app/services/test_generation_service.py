"""Test generation service using RAG and Gemini."""

import json
import uuid
from datetime import datetime
from typing import Dict, List, Optional

import structlog
from jinja2 import Template

from app.config import get_settings

logger = structlog.get_logger(__name__)


class TestGenerationService:
    """Service for generating test cases from requirements."""
    
    def __init__(self):
        self.settings = get_settings()
        self._load_prompt_templates()
    
    def _load_prompt_templates(self):
        """Load prompt templates for test generation."""
        self.test_generation_template = Template("""
You are an expert healthcare compliance test engineer specializing in medical device software testing.

Generate comprehensive test cases for the following requirement:

REQUIREMENT:
{{ requirement.text }}

REQUIREMENT CONTEXT:
- Section: {{ requirement.section_path }}
- Risk Class: {{ requirement.risk_class }}
- Compliance Standards: {{ requirement.std_tags | join(', ') }}
- Normative: {{ requirement.normative }}

{% if context_requirements %}
RELATED REQUIREMENTS FOR CONTEXT:
{% for ctx_req in context_requirements %}
- {{ ctx_req.text[:200] }}...
{% endfor %}
{% endif %}

{% if compliance_mapping %}
COMPLIANCE MAPPING:
{% for mapping in compliance_mapping.mappings %}
{{ mapping.standard }}:
- Clauses: {{ mapping.clauses | join(', ') }}
- Testing Requirements: {{ mapping.testing_requirements | join('; ') }}
{% endfor %}
{% endif %}

INSTRUCTIONS:
1. Generate {{ max_tests }} test cases that thoroughly validate this requirement
2. Each test case must include:
   - Clear, descriptive title
   - Gherkin scenario (Given/When/Then format)
   - Detailed test steps with expected results
   - Preconditions and setup requirements
   - Risk references and compliance tags
3. Focus on edge cases, error conditions, and compliance validation
4. Ensure tests are executable and verifiable
5. Include appropriate compliance standard references

COMPLIANCE FOCUS AREAS:
- Data integrity and traceability (21 CFR Part 11)
- Risk management (ISO 14971)
- Software lifecycle processes (IEC 62304)
- Quality management (ISO 13485)
- Security and privacy (GDPR, HIPAA)

Generate tests that cover:
- Normal operation scenarios
- Boundary conditions
- Error handling
- Security requirements
- Performance requirements
- Usability requirements
- Regulatory compliance validation
""")

        self.gherkin_template = Template("""
Feature: {{ feature_name }}

Background:
  Given the healthcare compliance system is operational
  And user authentication is configured
  And audit logging is enabled

Scenario: {{ scenario_title }}
  Given {{ given_conditions | join('\n  And ') }}
  When {{ when_actions | join('\n  And ') }}
  Then {{ then_expectations | join('\n  And ') }}
  
  Examples:
  | parameter | value | expected_result |
{% for example in examples %}
  | {{ example.parameter }} | {{ example.value }} | {{ example.expected_result }} |
{% endfor %}
""")

    async def generate_tests_for_requirement(
        self,
        requirement: Dict,
        context_requirements: Optional[List[Dict]] = None,
        compliance_mapping: Optional[Dict] = None,
        gemini_service=None,
    ) -> List[Dict]:
        """Generate test cases for a single requirement."""
        try:
            max_tests = min(
                self.settings.max_tests_per_requirement,
                self._determine_test_count(requirement),
            )
            
            # Render the prompt template
            prompt = self.test_generation_template.render(
                requirement=requirement,
                context_requirements=context_requirements or [],
                compliance_mapping=compliance_mapping,
                max_tests=max_tests,
            )
            
            # Define the expected JSON schema for test cases
            test_schema = {
                "type": "object",
                "properties": {
                    "tests": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "title": {"type": "string"},
                                "description": {"type": "string"},
                                "gherkin": {"type": "string"},
                                "preconditions": {"type": "array", "items": {"type": "string"}},
                                "steps": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "action": {"type": "string"},
                                            "expected": {"type": "string"}
                                        },
                                        "required": ["action", "expected"]
                                    }
                                },
                                "expected_summary": {"type": "string"},
                                "risk_refs": {"type": "array", "items": {"type": "string"}},
                                "std_tags": {"type": "array", "items": {"type": "string"}},
                                "test_type": {"type": "string"},
                                "priority": {"type": "string", "enum": ["high", "medium", "low"]},
                                "estimated_duration": {"type": "string"},
                            },
                            "required": [
                                "title", "description", "gherkin", "preconditions",
                                "steps", "expected_summary", "risk_refs", "std_tags",
                                "test_type", "priority"
                            ]
                        }
                    }
                },
                "required": ["tests"]
            }
            
            # Generate structured output using Gemini
            if not gemini_service:
                logger.error("Gemini service not provided")
                return []
            
            result = await gemini_service.generate_structured_output(
                prompt=prompt,
                schema=test_schema,
                temperature=0.2,  # Lower temperature for more consistent output
            )
            
            if not result or "tests" not in result:
                logger.error("Failed to generate tests or invalid response format")
                return []
            
            # Process and validate generated tests
            generated_tests = []
            for test_data in result["tests"]:
                try:
                    # Create test case with additional metadata
                    test_case = {
                        "test_id": str(uuid.uuid4()),
                        "req_id": requirement.get("req_id"),
                        "project_id": requirement.get("project_id"),
                        "title": test_data["title"],
                        "description": test_data.get("description", ""),
                        "gherkin": test_data["gherkin"],
                        "preconditions": test_data["preconditions"],
                        "steps": test_data["steps"],
                        "expected_summary": test_data["expected_summary"],
                        "risk_refs": test_data["risk_refs"],
                        "std_tags": test_data["std_tags"],
                        "test_type": test_data.get("test_type", "functional"),
                        "priority": test_data.get("priority", "medium"),
                        "estimated_duration": test_data.get("estimated_duration", "30 minutes"),
                        "generated_by_model": self.settings.gemini_model,
                        "quality_score": 0.0,  # Will be calculated later
                        "review_status": "pending",
                        "created_at": datetime.utcnow().isoformat(),
                        "updated_at": datetime.utcnow().isoformat(),
                    }
                    
                    # Validate test case
                    if self._validate_test_case(test_case):
                        generated_tests.append(test_case)
                    else:
                        logger.warning("Invalid test case generated", title=test_data.get("title"))
                
                except Exception as e:
                    logger.error("Error processing generated test", error=str(e))
                    continue
            
            logger.info(
                "Tests generated for requirement",
                req_id=requirement.get("req_id"),
                generated_count=len(generated_tests),
                requested_count=max_tests,
            )
            
            return generated_tests
            
        except Exception as e:
            logger.error("Failed to generate tests for requirement", error=str(e))
            return []
    
    async def generate_tests_batch(
        self,
        requirements: List[Dict],
        gemini_service=None,
        rag_service=None,
    ) -> Dict:
        """Generate test cases for multiple requirements in batch."""
        try:
            results = {
                "total_requirements": len(requirements),
                "successful_generations": 0,
                "failed_generations": 0,
                "total_tests_generated": 0,
                "tests": [],
                "errors": [],
            }
            
            for requirement in requirements:
                try:
                    # Get context from RAG if available
                    context_requirements = None
                    compliance_mapping = None
                    
                    if rag_service:
                        context_requirements = await rag_service.get_related_requirements(
                            requirement["text"],
                            requirement.get("project_id"),
                            limit=5,
                        )
                    
                    if gemini_service:
                        compliance_mapping = await gemini_service.generate_compliance_mapping(
                            requirement["text"],
                            requirement.get("std_tags", []),
                        )
                    
                    # Generate tests for this requirement
                    generated_tests = await self.generate_tests_for_requirement(
                        requirement=requirement,
                        context_requirements=context_requirements,
                        compliance_mapping=compliance_mapping,
                        gemini_service=gemini_service,
                    )
                    
                    if generated_tests:
                        results["successful_generations"] += 1
                        results["total_tests_generated"] += len(generated_tests)
                        results["tests"].extend(generated_tests)
                    else:
                        results["failed_generations"] += 1
                        results["errors"].append({
                            "req_id": requirement.get("req_id"),
                            "error": "No tests generated",
                        })
                
                except Exception as e:
                    results["failed_generations"] += 1
                    results["errors"].append({
                        "req_id": requirement.get("req_id"),
                        "error": str(e),
                    })
                    logger.error(
                        "Failed to generate tests for requirement",
                        req_id=requirement.get("req_id"),
                        error=str(e),
                    )
            
            logger.info(
                "Batch test generation completed",
                total_requirements=results["total_requirements"],
                successful=results["successful_generations"],
                failed=results["failed_generations"],
                total_tests=results["total_tests_generated"],
            )
            
            return results
            
        except Exception as e:
            logger.error("Failed to generate tests in batch", error=str(e))
            return {
                "total_requirements": len(requirements),
                "successful_generations": 0,
                "failed_generations": len(requirements),
                "total_tests_generated": 0,
                "tests": [],
                "errors": [{"error": str(e)}],
            }
    
    def _determine_test_count(self, requirement: Dict) -> int:
        """Determine the number of tests to generate based on requirement complexity."""
        risk_class = requirement.get("risk_class", "C")
        text_length = len(requirement.get("text", ""))
        std_tags_count = len(requirement.get("std_tags", []))
        
        # Base test count
        base_count = 1
        
        # Adjust based on risk class
        risk_multiplier = {"A": 3, "B": 2, "C": 1, "D": 1}
        base_count *= risk_multiplier.get(risk_class, 1)
        
        # Adjust based on text complexity
        if text_length > 500:
            base_count += 1
        if text_length > 1000:
            base_count += 1
        
        # Adjust based on compliance standards
        if std_tags_count > 2:
            base_count += 1
        
        # Ensure within limits
        return min(base_count, self.settings.max_tests_per_requirement)
    
    def _validate_test_case(self, test_case: Dict) -> bool:
        """Validate a generated test case."""
        required_fields = [
            "title", "gherkin", "steps", "expected_summary"
        ]
        
        # Check required fields
        for field in required_fields:
            if not test_case.get(field):
                logger.warning(f"Missing required field: {field}")
                return False
        
        # Validate title length
        if len(test_case["title"]) < 10 or len(test_case["title"]) > 200:
            logger.warning("Invalid title length")
            return False
        
        # Validate Gherkin format
        gherkin = test_case["gherkin"].lower()
        if not ("given" in gherkin and "when" in gherkin and "then" in gherkin):
            logger.warning("Invalid Gherkin format")
            return False
        
        # Validate steps
        steps = test_case["steps"]
        if not isinstance(steps, list) or len(steps) == 0:
            logger.warning("Invalid or empty steps")
            return False
        
        for step in steps:
            if not isinstance(step, dict) or "action" not in step or "expected" not in step:
                logger.warning("Invalid step format")
                return False
        
        return True
    
    async def enhance_test_with_examples(
        self,
        test_case: Dict,
        gemini_service=None,
    ) -> Dict:
        """Enhance a test case with concrete examples and test data."""
        try:
            if not gemini_service:
                return test_case
            
            enhancement_prompt = f"""
            Enhance the following test case with concrete examples and test data:
            
            TEST CASE:
            Title: {test_case['title']}
            Gherkin: {test_case['gherkin']}
            
            Add:
            1. Specific test data examples
            2. Boundary value test cases
            3. Error condition examples
            4. Performance criteria where applicable
            
            Maintain the original structure but add concrete, realistic examples.
            """
            
            enhanced_gherkin = await gemini_service.generate_text(
                prompt=enhancement_prompt,
                temperature=0.3,
            )
            
            if enhanced_gherkin:
                test_case["gherkin"] = enhanced_gherkin
                test_case["enhanced"] = True
            
            return test_case
            
        except Exception as e:
            logger.error("Failed to enhance test case", error=str(e))
            return test_case
