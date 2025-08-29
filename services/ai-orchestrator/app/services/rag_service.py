"""RAG (Retrieval-Augmented Generation) service for context-aware AI operations."""

import json
from typing import Dict, List, Optional, Tuple

import structlog
from google.cloud import bigquery

from app.config import get_settings

logger = structlog.get_logger(__name__)


class RAGService:
    """Service for Retrieval-Augmented Generation operations."""
    
    def __init__(self):
        self.settings = get_settings()
        self.bigquery_client = bigquery.Client()
    
    async def get_related_requirements(
        self,
        query_text: str,
        project_id: str,
        limit: int = 10,
        similarity_threshold: float = None,
        vector_search_service=None,
    ) -> List[Dict]:
        """Get requirements related to the query text using vector search."""
        try:
            if not vector_search_service:
                logger.warning("Vector search service not available, using text-based search")
                return await self._get_related_requirements_text_search(
                    query_text, project_id, limit
                )
            
            # Use vector search to find similar requirements
            similar_requirements = await vector_search_service.search_similar_requirements(
                query_text=query_text,
                project_id=project_id,
                limit=limit,
                threshold=similarity_threshold or self.settings.similarity_threshold,
            )
            
            if not similar_requirements:
                logger.info("No similar requirements found via vector search")
                return []
            
            # Get full requirement details from BigQuery
            req_ids = [req["req_id"] for req in similar_requirements]
            requirements = await self._get_requirements_by_ids(req_ids, project_id)
            
            # Add similarity scores
            score_map = {req["req_id"]: req["similarity_score"] for req in similar_requirements}
            for req in requirements:
                req["similarity_score"] = score_map.get(req["req_id"], 0.0)
            
            # Sort by similarity score
            requirements.sort(key=lambda x: x.get("similarity_score", 0.0), reverse=True)
            
            logger.info(
                "Related requirements retrieved via vector search",
                query_length=len(query_text),
                results_count=len(requirements),
                project_id=project_id,
            )
            
            return requirements
            
        except Exception as e:
            logger.error("Failed to get related requirements", error=str(e))
            return []
    
    async def _get_related_requirements_text_search(
        self,
        query_text: str,
        project_id: str,
        limit: int,
    ) -> List[Dict]:
        """Fallback text-based search for related requirements."""
        try:
            # Extract key terms from query
            key_terms = self._extract_key_terms(query_text)
            
            if not key_terms:
                return []
            
            # Build BigQuery search query
            search_conditions = []
            query_params = [
                bigquery.ScalarQueryParameter("project_id", "STRING", project_id),
                bigquery.ScalarQueryParameter("limit", "INT64", limit),
            ]
            
            for i, term in enumerate(key_terms[:5]):  # Limit to 5 terms
                param_name = f"term_{i}"
                search_conditions.append(f"LOWER(text) LIKE CONCAT('%', LOWER(@{param_name}), '%')")
                query_params.append(
                    bigquery.ScalarQueryParameter(param_name, "STRING", term)
                )
            
            query = f"""
            SELECT *,
                   (CASE 
                    {' + '.join([f"WHEN LOWER(text) LIKE CONCAT('%', LOWER(@term_{i}), '%') THEN 1" for i in range(len(key_terms[:5]))])}
                    ELSE 0 END) as relevance_score
            FROM `{self.settings.project_id}.{self.settings.bigquery_dataset}.requirements`
            WHERE project_id = @project_id
              AND ({' OR '.join(search_conditions)})
            ORDER BY relevance_score DESC, created_at DESC
            LIMIT @limit
            """
            
            job_config = bigquery.QueryJobConfig(query_parameters=query_params)
            query_job = self.bigquery_client.query(query, job_config=job_config)
            
            results = []
            for row in query_job:
                req_dict = dict(row)
                req_dict["similarity_score"] = row["relevance_score"] / len(key_terms[:5])
                results.append(req_dict)
            
            logger.info(
                "Related requirements retrieved via text search",
                query_length=len(query_text),
                results_count=len(results),
                key_terms=key_terms[:5],
            )
            
            return results
            
        except Exception as e:
            logger.error("Failed to perform text-based search", error=str(e))
            return []
    
    async def _get_requirements_by_ids(
        self,
        req_ids: List[str],
        project_id: str,
    ) -> List[Dict]:
        """Get requirements by their IDs."""
        try:
            if not req_ids:
                return []
            
            # Build query with parameterized req_ids
            placeholders = ", ".join([f"@req_id_{i}" for i in range(len(req_ids))])
            query = f"""
            SELECT *
            FROM `{self.settings.project_id}.{self.settings.bigquery_dataset}.requirements`
            WHERE project_id = @project_id
              AND req_id IN ({placeholders})
            """
            
            query_params = [
                bigquery.ScalarQueryParameter("project_id", "STRING", project_id)
            ]
            
            for i, req_id in enumerate(req_ids):
                query_params.append(
                    bigquery.ScalarQueryParameter(f"req_id_{i}", "STRING", req_id)
                )
            
            job_config = bigquery.QueryJobConfig(query_parameters=query_params)
            query_job = self.bigquery_client.query(query, job_config=job_config)
            
            results = []
            for row in query_job:
                results.append(dict(row))
            
            return results
            
        except Exception as e:
            logger.error("Failed to get requirements by IDs", error=str(e))
            return []
    
    def _extract_key_terms(self, text: str) -> List[str]:
        """Extract key terms from text for search."""
        import re
        
        # Remove common stop words
        stop_words = {
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
            "of", "with", "by", "is", "are", "was", "were", "be", "been", "have",
            "has", "had", "do", "does", "did", "will", "would", "could", "should",
            "may", "might", "can", "must", "shall", "this", "that", "these", "those",
        }
        
        # Extract words (alphanumeric sequences)
        words = re.findall(r'\b[a-zA-Z][a-zA-Z0-9]*\b', text.lower())
        
        # Filter out stop words and short words
        key_terms = [
            word for word in words
            if len(word) >= 3 and word not in stop_words
        ]
        
        # Remove duplicates while preserving order
        seen = set()
        unique_terms = []
        for term in key_terms:
            if term not in seen:
                seen.add(term)
                unique_terms.append(term)
        
        return unique_terms
    
    async def build_context_for_generation(
        self,
        requirement: Dict,
        related_requirements: List[Dict],
        compliance_standards: List[str],
    ) -> str:
        """Build context string for AI generation."""
        try:
            context_parts = []
            
            # Add requirement context
            context_parts.append("=== PRIMARY REQUIREMENT ===")
            context_parts.append(f"Text: {requirement['text']}")
            context_parts.append(f"Section: {requirement.get('section_path', 'N/A')}")
            context_parts.append(f"Risk Class: {requirement.get('risk_class', 'N/A')}")
            context_parts.append(f"Standards: {', '.join(requirement.get('std_tags', []))}")
            context_parts.append("")
            
            # Add related requirements
            if related_requirements:
                context_parts.append("=== RELATED REQUIREMENTS ===")
                for i, related_req in enumerate(related_requirements[:5], 1):
                    similarity = related_req.get("similarity_score", 0.0)
                    context_parts.append(f"{i}. (Similarity: {similarity:.2f})")
                    context_parts.append(f"   Text: {related_req['text'][:300]}...")
                    context_parts.append(f"   Section: {related_req.get('section_path', 'N/A')}")
                    context_parts.append("")
            
            # Add compliance context
            if compliance_standards:
                context_parts.append("=== COMPLIANCE STANDARDS ===")
                for standard in compliance_standards:
                    context_parts.append(f"- {standard}")
                context_parts.append("")
            
            # Add general healthcare compliance context
            context_parts.append("=== HEALTHCARE COMPLIANCE CONTEXT ===")
            context_parts.append("- Medical device software must comply with IEC 62304")
            context_parts.append("- Quality management per ISO 13485")
            context_parts.append("- Risk management per ISO 14971")
            context_parts.append("- Electronic records per 21 CFR Part 11")
            context_parts.append("- Data protection per GDPR/HIPAA")
            
            return "\n".join(context_parts)
            
        except Exception as e:
            logger.error("Failed to build context", error=str(e))
            return ""
    
    async def get_compliance_knowledge(
        self,
        standards: List[str],
        topic: str = None,
    ) -> Dict:
        """Get compliance knowledge for specific standards."""
        try:
            # This would typically query a knowledge base
            # For now, return structured compliance information
            
            compliance_knowledge = {
                "ISO_13485": {
                    "description": "Quality management systems for medical devices",
                    "key_clauses": ["4.2", "7.3", "8.2", "8.5"],
                    "testing_focus": [
                        "Design controls",
                        "Risk management",
                        "Validation and verification",
                        "Post-market surveillance",
                    ],
                },
                "IEC_62304": {
                    "description": "Medical device software lifecycle processes",
                    "key_clauses": ["5.1", "5.2", "5.3", "5.4", "5.5"],
                    "testing_focus": [
                        "Software safety classification",
                        "Software development planning",
                        "Software requirements analysis",
                        "Software integration testing",
                        "Software system testing",
                    ],
                },
                "FDA_QMSR": {
                    "description": "Quality System Regulation for medical devices",
                    "key_clauses": ["820.30", "820.70", "820.75"],
                    "testing_focus": [
                        "Design controls",
                        "Production and process controls",
                        "Validation",
                    ],
                },
                "CFR_PART_11": {
                    "description": "Electronic records and electronic signatures",
                    "key_clauses": ["11.10", "11.30", "11.50", "11.70"],
                    "testing_focus": [
                        "System validation",
                        "Audit trails",
                        "Electronic signatures",
                        "System security",
                    ],
                },
                "GDPR": {
                    "description": "General Data Protection Regulation",
                    "key_clauses": ["Art. 25", "Art. 32", "Art. 35"],
                    "testing_focus": [
                        "Data protection by design",
                        "Security of processing",
                        "Data protection impact assessment",
                    ],
                },
            }
            
            result = {}
            for standard in standards:
                if standard in compliance_knowledge:
                    result[standard] = compliance_knowledge[standard]
            
            logger.info(
                "Compliance knowledge retrieved",
                standards=standards,
                topic=topic,
                knowledge_items=len(result),
            )
            
            return result
            
        except Exception as e:
            logger.error("Failed to get compliance knowledge", error=str(e))
            return {}
    
    async def analyze_requirement_coverage(
        self,
        project_id: str,
        requirement_ids: List[str] = None,
    ) -> Dict:
        """Analyze test coverage for requirements."""
        try:
            # Build query to get coverage statistics
            if requirement_ids:
                req_filter = f"AND r.req_id IN ({', '.join(['@req_' + str(i) for i in range(len(requirement_ids))])})"
                query_params = [
                    bigquery.ScalarQueryParameter("project_id", "STRING", project_id)
                ]
                for i, req_id in enumerate(requirement_ids):
                    query_params.append(
                        bigquery.ScalarQueryParameter(f"req_{i}", "STRING", req_id)
                    )
            else:
                req_filter = ""
                query_params = [
                    bigquery.ScalarQueryParameter("project_id", "STRING", project_id)
                ]
            
            query = f"""
            SELECT 
                r.req_id,
                r.text,
                r.risk_class,
                r.std_tags,
                COUNT(t.test_id) as test_count,
                COUNT(CASE WHEN t.review_status = 'approved' THEN 1 END) as approved_test_count,
                AVG(t.quality_score) as avg_quality_score
            FROM `{self.settings.project_id}.{self.settings.bigquery_dataset}.requirements` r
            LEFT JOIN `{self.settings.project_id}.{self.settings.bigquery_dataset}.tests` t
                ON r.req_id = t.req_id
            WHERE r.project_id = @project_id
            {req_filter}
            GROUP BY r.req_id, r.text, r.risk_class, r.std_tags
            ORDER BY test_count ASC, r.risk_class ASC
            """
            
            job_config = bigquery.QueryJobConfig(query_parameters=query_params)
            query_job = self.bigquery_client.query(query, job_config=job_config)
            
            coverage_data = []
            total_requirements = 0
            covered_requirements = 0
            
            for row in query_job:
                total_requirements += 1
                test_count = row["test_count"] or 0
                
                if test_count > 0:
                    covered_requirements += 1
                
                coverage_data.append({
                    "req_id": row["req_id"],
                    "text": row["text"][:200] + "..." if len(row["text"]) > 200 else row["text"],
                    "risk_class": row["risk_class"],
                    "std_tags": row["std_tags"],
                    "test_count": test_count,
                    "approved_test_count": row["approved_test_count"] or 0,
                    "avg_quality_score": float(row["avg_quality_score"]) if row["avg_quality_score"] else 0.0,
                    "coverage_status": "covered" if test_count > 0 else "uncovered",
                })
            
            coverage_percentage = (covered_requirements / total_requirements * 100) if total_requirements > 0 else 0
            
            result = {
                "project_id": project_id,
                "total_requirements": total_requirements,
                "covered_requirements": covered_requirements,
                "uncovered_requirements": total_requirements - covered_requirements,
                "coverage_percentage": round(coverage_percentage, 2),
                "requirements": coverage_data,
            }
            
            logger.info(
                "Requirement coverage analyzed",
                project_id=project_id,
                total_requirements=total_requirements,
                coverage_percentage=coverage_percentage,
            )
            
            return result
            
        except Exception as e:
            logger.error("Failed to analyze requirement coverage", error=str(e))
            return {}
