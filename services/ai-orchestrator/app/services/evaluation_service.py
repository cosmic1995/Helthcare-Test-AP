"""Evaluation service for assessing test quality and compliance."""

import json
from datetime import datetime
from typing import Dict, List, Optional

import structlog

from app.config import get_settings

logger = structlog.get_logger(__name__)


class EvaluationService:
    """Service for evaluating test case quality and compliance."""
    
    def __init__(self):
        self.settings = get_settings()
        self._load_evaluation_criteria()
    
    def _load_evaluation_criteria(self):
        """Load evaluation criteria for different test aspects."""
        self.quality_criteria = {
            "completeness": {
                "weight": 0.25,
                "checks": [
                    "has_clear_title",
                    "has_gherkin_scenario",
                    "has_test_steps",
                    "has_expected_results",
                    "has_preconditions",
                ],
            },
            "clarity": {
                "weight": 0.20,
                "checks": [
                    "title_descriptive",
                    "steps_clear",
                    "expectations_specific",
                    "language_professional",
                ],
            },
            "compliance": {
                "weight": 0.25,
                "checks": [
                    "has_compliance_tags",
                    "addresses_risk_class",
                    "follows_standard_format",
                    "includes_traceability",
                ],
            },
            "executability": {
                "weight": 0.20,
                "checks": [
                    "steps_actionable",
                    "results_measurable",
                    "prerequisites_clear",
                    "test_data_specified",
                ],
            },
            "coverage": {
                "weight": 0.10,
                "checks": [
                    "covers_normal_flow",
                    "covers_edge_cases",
                    "covers_error_conditions",
                ],
            },
        }
        
        self.compliance_requirements = {
            "IEC_62304": {
                "required_elements": [
                    "software_safety_class",
                    "verification_method",
                    "acceptance_criteria",
                ],
                "test_types": [
                    "unit_test",
                    "integration_test",
                    "system_test",
                ],
            },
            "ISO_13485": {
                "required_elements": [
                    "design_control_reference",
                    "risk_assessment",
                    "validation_criteria",
                ],
                "documentation": [
                    "test_protocol",
                    "test_report",
                    "deviation_handling",
                ],
            },
            "CFR_PART_11": {
                "required_elements": [
                    "system_validation",
                    "audit_trail",
                    "electronic_signature",
                ],
                "security_aspects": [
                    "access_control",
                    "data_integrity",
                    "system_security",
                ],
            },
        }
    
    async def evaluate_test_case(
        self,
        test_case: Dict,
        requirement: Dict = None,
        gemini_service=None,
    ) -> Dict:
        """Evaluate a single test case for quality and compliance."""
        try:
            evaluation_result = {
                "test_id": test_case.get("test_id"),
                "overall_score": 0.0,
                "category_scores": {},
                "issues": [],
                "recommendations": [],
                "compliance_status": {},
                "evaluated_at": datetime.utcnow().isoformat(),
            }
            
            # Evaluate each quality category
            total_weighted_score = 0.0
            
            for category, criteria in self.quality_criteria.items():
                category_score = await self._evaluate_category(
                    test_case=test_case,
                    category=category,
                    criteria=criteria,
                    requirement=requirement,
                    gemini_service=gemini_service,
                )
                
                evaluation_result["category_scores"][category] = category_score
                total_weighted_score += category_score["score"] * criteria["weight"]
            
            evaluation_result["overall_score"] = round(total_weighted_score, 2)
            
            # Evaluate compliance requirements
            if requirement and requirement.get("std_tags"):
                compliance_status = await self._evaluate_compliance(
                    test_case=test_case,
                    standards=requirement["std_tags"],
                    gemini_service=gemini_service,
                )
                evaluation_result["compliance_status"] = compliance_status
            
            # Generate recommendations
            recommendations = self._generate_recommendations(evaluation_result)
            evaluation_result["recommendations"] = recommendations
            
            logger.info(
                "Test case evaluated",
                test_id=test_case.get("test_id"),
                overall_score=evaluation_result["overall_score"],
                issues_count=len(evaluation_result["issues"]),
            )
            
            return evaluation_result
            
        except Exception as e:
            logger.error("Failed to evaluate test case", error=str(e))
            return {
                "test_id": test_case.get("test_id"),
                "overall_score": 0.0,
                "error": str(e),
            }
    
    async def _evaluate_category(
        self,
        test_case: Dict,
        category: str,
        criteria: Dict,
        requirement: Dict = None,
        gemini_service=None,
    ) -> Dict:
        """Evaluate a specific quality category."""
        try:
            category_result = {
                "score": 0.0,
                "max_score": 1.0,
                "passed_checks": [],
                "failed_checks": [],
                "details": {},
            }
            
            checks = criteria["checks"]
            passed_count = 0
            
            for check in checks:
                check_result = await self._perform_check(
                    test_case=test_case,
                    check_name=check,
                    category=category,
                    requirement=requirement,
                    gemini_service=gemini_service,
                )
                
                if check_result["passed"]:
                    category_result["passed_checks"].append(check)
                    passed_count += 1
                else:
                    category_result["failed_checks"].append(check)
                
                category_result["details"][check] = check_result
            
            # Calculate category score
            category_result["score"] = passed_count / len(checks) if checks else 0.0
            
            return category_result
            
        except Exception as e:
            logger.error(f"Failed to evaluate category {category}", error=str(e))
            return {"score": 0.0, "error": str(e)}
    
    async def _perform_check(
        self,
        test_case: Dict,
        check_name: str,
        category: str,
        requirement: Dict = None,
        gemini_service=None,
    ) -> Dict:
        """Perform a specific quality check."""
        try:
            check_result = {
                "passed": False,
                "score": 0.0,
                "message": "",
                "details": {},
            }
            
            # Completeness checks
            if check_name == "has_clear_title":
                title = test_case.get("title", "")
                check_result["passed"] = len(title.strip()) >= 10
                check_result["message"] = "Title is clear and descriptive" if check_result["passed"] else "Title is too short or missing"
            
            elif check_name == "has_gherkin_scenario":
                gherkin = test_case.get("gherkin", "").lower()
                has_given = "given" in gherkin
                has_when = "when" in gherkin
                has_then = "then" in gherkin
                check_result["passed"] = has_given and has_when and has_then
                check_result["message"] = "Valid Gherkin format" if check_result["passed"] else "Missing Given/When/Then structure"
            
            elif check_name == "has_test_steps":
                steps = test_case.get("steps", [])
                check_result["passed"] = len(steps) > 0
                check_result["message"] = f"Has {len(steps)} test steps" if check_result["passed"] else "No test steps defined"
            
            elif check_name == "has_expected_results":
                expected = test_case.get("expected_summary", "")
                check_result["passed"] = len(expected.strip()) > 0
                check_result["message"] = "Expected results defined" if check_result["passed"] else "Missing expected results"
            
            elif check_name == "has_preconditions":
                preconditions = test_case.get("preconditions", [])
                check_result["passed"] = len(preconditions) > 0
                check_result["message"] = f"Has {len(preconditions)} preconditions" if check_result["passed"] else "No preconditions defined"
            
            # Clarity checks
            elif check_name == "title_descriptive":
                title = test_case.get("title", "")
                # Use AI to evaluate title clarity if available
                if gemini_service:
                    clarity_score = await self._evaluate_with_ai(
                        text=title,
                        criteria="descriptive and clear title",
                        gemini_service=gemini_service,
                    )
                    check_result["passed"] = clarity_score >= 0.7
                    check_result["score"] = clarity_score
                else:
                    # Simple heuristic
                    check_result["passed"] = len(title.split()) >= 4
                check_result["message"] = "Title is descriptive" if check_result["passed"] else "Title could be more descriptive"
            
            elif check_name == "steps_clear":
                steps = test_case.get("steps", [])
                if steps and gemini_service:
                    steps_text = " ".join([step.get("action", "") for step in steps])
                    clarity_score = await self._evaluate_with_ai(
                        text=steps_text,
                        criteria="clear and unambiguous test steps",
                        gemini_service=gemini_service,
                    )
                    check_result["passed"] = clarity_score >= 0.7
                    check_result["score"] = clarity_score
                else:
                    check_result["passed"] = len(steps) > 0
                check_result["message"] = "Steps are clear" if check_result["passed"] else "Steps could be clearer"
            
            # Compliance checks
            elif check_name == "has_compliance_tags":
                std_tags = test_case.get("std_tags", [])
                check_result["passed"] = len(std_tags) > 0
                check_result["message"] = f"Has {len(std_tags)} compliance tags" if check_result["passed"] else "Missing compliance tags"
            
            elif check_name == "addresses_risk_class":
                if requirement:
                    risk_class = requirement.get("risk_class", "")
                    risk_refs = test_case.get("risk_refs", [])
                    check_result["passed"] = len(risk_refs) > 0 or risk_class in test_case.get("description", "")
                else:
                    check_result["passed"] = True  # Can't check without requirement
                check_result["message"] = "Addresses risk classification" if check_result["passed"] else "Missing risk classification reference"
            
            # Executability checks
            elif check_name == "steps_actionable":
                steps = test_case.get("steps", [])
                actionable_count = 0
                for step in steps:
                    action = step.get("action", "").lower()
                    if any(verb in action for verb in ["click", "enter", "select", "verify", "check", "validate", "test"]):
                        actionable_count += 1
                
                check_result["passed"] = actionable_count >= len(steps) * 0.7 if steps else False
                check_result["message"] = f"{actionable_count}/{len(steps)} steps are actionable" if steps else "No actionable steps"
            
            else:
                # Default check - assume passed
                check_result["passed"] = True
                check_result["message"] = f"Check {check_name} not implemented"
            
            return check_result
            
        except Exception as e:
            logger.error(f"Failed to perform check {check_name}", error=str(e))
            return {
                "passed": False,
                "score": 0.0,
                "message": f"Check failed: {str(e)}",
                "error": str(e),
            }
    
    async def _evaluate_with_ai(
        self,
        text: str,
        criteria: str,
        gemini_service,
    ) -> float:
        """Use AI to evaluate text against specific criteria."""
        try:
            prompt = f"""
            Evaluate the following text against the criteria: "{criteria}"
            
            Text to evaluate:
            {text}
            
            Provide a score from 0.0 to 1.0 where:
            - 1.0 = Excellent, fully meets criteria
            - 0.8 = Good, mostly meets criteria
            - 0.6 = Acceptable, partially meets criteria
            - 0.4 = Poor, barely meets criteria
            - 0.2 = Very poor, does not meet criteria
            - 0.0 = Completely fails to meet criteria
            
            Respond with only the numeric score (e.g., 0.8).
            """
            
            result = await gemini_service.generate_text(
                prompt=prompt,
                temperature=0.1,
            )
            
            if result:
                try:
                    score = float(result.strip())
                    return max(0.0, min(1.0, score))  # Clamp to [0, 1]
                except ValueError:
                    pass
            
            return 0.5  # Default neutral score
            
        except Exception as e:
            logger.error("Failed to evaluate with AI", error=str(e))
            return 0.5
    
    async def _evaluate_compliance(
        self,
        test_case: Dict,
        standards: List[str],
        gemini_service=None,
    ) -> Dict:
        """Evaluate compliance with specific standards."""
        try:
            compliance_status = {}
            
            for standard in standards:
                if standard in self.compliance_requirements:
                    requirements = self.compliance_requirements[standard]
                    
                    status = {
                        "compliant": False,
                        "score": 0.0,
                        "missing_elements": [],
                        "present_elements": [],
                    }
                    
                    required_elements = requirements.get("required_elements", [])
                    present_count = 0
                    
                    for element in required_elements:
                        # Check if element is present in test case
                        if self._check_compliance_element(test_case, element):
                            status["present_elements"].append(element)
                            present_count += 1
                        else:
                            status["missing_elements"].append(element)
                    
                    status["score"] = present_count / len(required_elements) if required_elements else 1.0
                    status["compliant"] = status["score"] >= 0.8
                    
                    compliance_status[standard] = status
            
            return compliance_status
            
        except Exception as e:
            logger.error("Failed to evaluate compliance", error=str(e))
            return {}
    
    def _check_compliance_element(self, test_case: Dict, element: str) -> bool:
        """Check if a compliance element is present in the test case."""
        # Simple keyword-based checking
        # In production, this would be more sophisticated
        
        text_fields = [
            test_case.get("description", ""),
            test_case.get("gherkin", ""),
            test_case.get("expected_summary", ""),
        ]
        
        combined_text = " ".join(text_fields).lower()
        
        element_keywords = {
            "software_safety_class": ["safety", "class", "classification"],
            "verification_method": ["verification", "method", "verify"],
            "acceptance_criteria": ["acceptance", "criteria", "accept"],
            "design_control_reference": ["design", "control", "reference"],
            "risk_assessment": ["risk", "assessment", "analyze"],
            "validation_criteria": ["validation", "criteria", "validate"],
            "system_validation": ["system", "validation", "validate"],
            "audit_trail": ["audit", "trail", "log"],
            "electronic_signature": ["signature", "electronic", "sign"],
            "access_control": ["access", "control", "permission"],
            "data_integrity": ["data", "integrity", "consistent"],
            "system_security": ["security", "secure", "protection"],
        }
        
        keywords = element_keywords.get(element, [element.replace("_", " ")])
        
        return any(keyword in combined_text for keyword in keywords)
    
    def _generate_recommendations(self, evaluation_result: Dict) -> List[str]:
        """Generate improvement recommendations based on evaluation results."""
        recommendations = []
        
        # Overall score recommendations
        overall_score = evaluation_result.get("overall_score", 0.0)
        
        if overall_score < 0.5:
            recommendations.append("Test case needs significant improvement across multiple areas")
        elif overall_score < 0.7:
            recommendations.append("Test case has room for improvement in several areas")
        
        # Category-specific recommendations
        category_scores = evaluation_result.get("category_scores", {})
        
        for category, score_data in category_scores.items():
            score = score_data.get("score", 0.0)
            
            if score < 0.6:
                if category == "completeness":
                    recommendations.append("Add missing test elements (steps, preconditions, expected results)")
                elif category == "clarity":
                    recommendations.append("Improve clarity of test description and steps")
                elif category == "compliance":
                    recommendations.append("Add compliance tags and regulatory references")
                elif category == "executability":
                    recommendations.append("Make test steps more specific and actionable")
                elif category == "coverage":
                    recommendations.append("Expand test coverage to include edge cases and error conditions")
        
        # Compliance recommendations
        compliance_status = evaluation_result.get("compliance_status", {})
        
        for standard, status in compliance_status.items():
            if not status.get("compliant", False):
                missing = status.get("missing_elements", [])
                if missing:
                    recommendations.append(f"Add {standard} compliance elements: {', '.join(missing)}")
        
        return recommendations
    
    async def evaluate_test_batch(
        self,
        test_cases: List[Dict],
        requirements: List[Dict] = None,
        gemini_service=None,
    ) -> Dict:
        """Evaluate multiple test cases in batch."""
        try:
            batch_result = {
                "total_tests": len(test_cases),
                "evaluated_tests": 0,
                "average_score": 0.0,
                "score_distribution": {
                    "excellent": 0,  # >= 0.9
                    "good": 0,       # >= 0.7
                    "acceptable": 0, # >= 0.5
                    "poor": 0,       # < 0.5
                },
                "evaluations": [],
                "summary": {},
            }
            
            # Create requirement lookup
            req_lookup = {}
            if requirements:
                req_lookup = {req["req_id"]: req for req in requirements}
            
            total_score = 0.0
            
            for test_case in test_cases:
                try:
                    requirement = req_lookup.get(test_case.get("req_id"))
                    
                    evaluation = await self.evaluate_test_case(
                        test_case=test_case,
                        requirement=requirement,
                        gemini_service=gemini_service,
                    )
                    
                    batch_result["evaluations"].append(evaluation)
                    batch_result["evaluated_tests"] += 1
                    
                    score = evaluation.get("overall_score", 0.0)
                    total_score += score
                    
                    # Update score distribution
                    if score >= 0.9:
                        batch_result["score_distribution"]["excellent"] += 1
                    elif score >= 0.7:
                        batch_result["score_distribution"]["good"] += 1
                    elif score >= 0.5:
                        batch_result["score_distribution"]["acceptable"] += 1
                    else:
                        batch_result["score_distribution"]["poor"] += 1
                
                except Exception as e:
                    logger.error("Failed to evaluate test in batch", error=str(e))
            
            # Calculate average score
            if batch_result["evaluated_tests"] > 0:
                batch_result["average_score"] = round(
                    total_score / batch_result["evaluated_tests"], 2
                )
            
            logger.info(
                "Batch evaluation completed",
                total_tests=batch_result["total_tests"],
                evaluated_tests=batch_result["evaluated_tests"],
                average_score=batch_result["average_score"],
            )
            
            return batch_result
            
        except Exception as e:
            logger.error("Failed to evaluate test batch", error=str(e))
            return {
                "total_tests": len(test_cases),
                "evaluated_tests": 0,
                "error": str(e),
            }
