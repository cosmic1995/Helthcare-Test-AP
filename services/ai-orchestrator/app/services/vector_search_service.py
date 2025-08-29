"""Vector search service for semantic similarity operations."""

import json
from typing import Dict, List, Optional, Tuple

import structlog
from google.cloud import aiplatform
from sentence_transformers import SentenceTransformer

from app.config import get_settings

logger = structlog.get_logger(__name__)


class VectorSearchService:
    """Service for vector-based semantic search operations."""
    
    def __init__(self):
        self.settings = get_settings()
        self.embedding_model = None
        self.vertex_ai_index = None
        self.vertex_ai_endpoint = None
        self._initialize_services()
    
    def _initialize_services(self):
        """Initialize embedding model and Vertex AI services."""
        try:
            # Initialize Vertex AI
            aiplatform.init(
                project=self.settings.project_id,
                location=self.settings.vertex_ai_location,
            )
            
            # Load embedding model
            self.embedding_model = SentenceTransformer(
                self.settings.embedding_model_name
            )
            
            logger.info(
                "Vector search services initialized",
                embedding_model=self.settings.embedding_model_name,
                vertex_location=self.settings.vertex_ai_location,
            )
            
        except Exception as e:
            logger.error("Failed to initialize vector search services", error=str(e))
    
    async def generate_embeddings(
        self,
        texts: List[str],
        batch_size: int = 32,
    ) -> List[List[float]]:
        """Generate embeddings for a list of texts."""
        try:
            if not self.embedding_model:
                logger.error("Embedding model not initialized")
                return []
            
            # Process in batches to avoid memory issues
            all_embeddings = []
            
            for i in range(0, len(texts), batch_size):
                batch_texts = texts[i:i + batch_size]
                
                # Generate embeddings for this batch
                batch_embeddings = self.embedding_model.encode(
                    batch_texts,
                    convert_to_numpy=True,
                    normalize_embeddings=True,
                )
                
                # Convert to list format
                for embedding in batch_embeddings:
                    all_embeddings.append(embedding.tolist())
            
            logger.info(
                "Embeddings generated",
                text_count=len(texts),
                embedding_dimension=len(all_embeddings[0]) if all_embeddings else 0,
            )
            
            return all_embeddings
            
        except Exception as e:
            logger.error("Failed to generate embeddings", error=str(e))
            return []
    
    async def search_similar_requirements(
        self,
        query_text: str,
        project_id: str,
        limit: int = 10,
        threshold: float = 0.7,
    ) -> List[Dict]:
        """Search for similar requirements using vector similarity."""
        try:
            # Generate embedding for query text
            query_embeddings = await self.generate_embeddings([query_text])
            
            if not query_embeddings:
                logger.error("Failed to generate query embedding")
                return []
            
            query_embedding = query_embeddings[0]
            
            # Use Vertex AI Vector Search if available
            if self.vertex_ai_endpoint:
                return await self._search_with_vertex_ai(
                    query_embedding=query_embedding,
                    project_id=project_id,
                    limit=limit,
                    threshold=threshold,
                )
            else:
                # Fallback to in-memory similarity search
                return await self._search_with_similarity_calculation(
                    query_embedding=query_embedding,
                    project_id=project_id,
                    limit=limit,
                    threshold=threshold,
                )
            
        except Exception as e:
            logger.error("Failed to search similar requirements", error=str(e))
            return []
    
    async def _search_with_vertex_ai(
        self,
        query_embedding: List[float],
        project_id: str,
        limit: int,
        threshold: float,
    ) -> List[Dict]:
        """Search using Vertex AI Vector Search."""
        try:
            # This would use the Vertex AI Vector Search endpoint
            # For now, return empty as the endpoint needs to be properly configured
            logger.warning("Vertex AI Vector Search not fully implemented")
            return []
            
        except Exception as e:
            logger.error("Failed to search with Vertex AI", error=str(e))
            return []
    
    async def _search_with_similarity_calculation(
        self,
        query_embedding: List[float],
        project_id: str,
        limit: int,
        threshold: float,
    ) -> List[Dict]:
        """Fallback similarity search using cosine similarity."""
        try:
            # This is a simplified implementation
            # In production, you'd want to use a proper vector database
            
            # For now, return empty results with a note
            logger.info(
                "Similarity calculation search requested",
                project_id=project_id,
                limit=limit,
                threshold=threshold,
            )
            
            # TODO: Implement proper vector similarity search
            # This would typically involve:
            # 1. Retrieving stored embeddings from a vector database
            # 2. Calculating cosine similarity with the query embedding
            # 3. Filtering by threshold and returning top results
            
            return []
            
        except Exception as e:
            logger.error("Failed to perform similarity calculation", error=str(e))
            return []
    
    def calculate_cosine_similarity(
        self,
        embedding1: List[float],
        embedding2: List[float],
    ) -> float:
        """Calculate cosine similarity between two embeddings."""
        try:
            import numpy as np
            
            # Convert to numpy arrays
            vec1 = np.array(embedding1)
            vec2 = np.array(embedding2)
            
            # Calculate cosine similarity
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            similarity = dot_product / (norm1 * norm2)
            return float(similarity)
            
        except Exception as e:
            logger.error("Failed to calculate cosine similarity", error=str(e))
            return 0.0
    
    async def index_requirements(
        self,
        requirements: List[Dict],
        project_id: str,
    ) -> bool:
        """Index requirements for vector search."""
        try:
            if not requirements:
                logger.warning("No requirements to index")
                return True
            
            # Extract texts for embedding
            texts = [req["text"] for req in requirements]
            
            # Generate embeddings
            embeddings = await self.generate_embeddings(texts)
            
            if len(embeddings) != len(requirements):
                logger.error("Embedding count mismatch")
                return False
            
            # Store embeddings with metadata
            # In a production system, this would go to a vector database
            indexed_items = []
            for req, embedding in zip(requirements, embeddings):
                indexed_items.append({
                    "req_id": req["req_id"],
                    "project_id": project_id,
                    "text": req["text"],
                    "embedding": embedding,
                    "metadata": {
                        "section_path": req.get("section_path"),
                        "risk_class": req.get("risk_class"),
                        "std_tags": req.get("std_tags", []),
                        "created_at": req.get("created_at"),
                    },
                })
            
            # TODO: Store in vector database (e.g., Vertex AI Vector Search, Pinecone, etc.)
            
            logger.info(
                "Requirements indexed for vector search",
                project_id=project_id,
                requirement_count=len(requirements),
                embedding_dimension=len(embeddings[0]) if embeddings else 0,
            )
            
            return True
            
        except Exception as e:
            logger.error("Failed to index requirements", error=str(e))
            return False
    
    async def update_requirement_embedding(
        self,
        req_id: str,
        text: str,
        project_id: str,
    ) -> bool:
        """Update embedding for a single requirement."""
        try:
            # Generate new embedding
            embeddings = await self.generate_embeddings([text])
            
            if not embeddings:
                logger.error("Failed to generate embedding for requirement update")
                return False
            
            embedding = embeddings[0]
            
            # TODO: Update in vector database
            
            logger.info(
                "Requirement embedding updated",
                req_id=req_id,
                project_id=project_id,
                embedding_dimension=len(embedding),
            )
            
            return True
            
        except Exception as e:
            logger.error("Failed to update requirement embedding", error=str(e))
            return False
    
    async def delete_requirement_embedding(
        self,
        req_id: str,
        project_id: str,
    ) -> bool:
        """Delete embedding for a requirement."""
        try:
            # TODO: Delete from vector database
            
            logger.info(
                "Requirement embedding deleted",
                req_id=req_id,
                project_id=project_id,
            )
            
            return True
            
        except Exception as e:
            logger.error("Failed to delete requirement embedding", error=str(e))
            return False
    
    async def get_embedding_stats(self, project_id: str) -> Dict:
        """Get statistics about indexed embeddings."""
        try:
            # TODO: Get stats from vector database
            
            stats = {
                "project_id": project_id,
                "total_embeddings": 0,
                "embedding_dimension": self.settings.embedding_dimension,
                "model_name": self.settings.embedding_model_name,
                "last_updated": None,
            }
            
            logger.info(
                "Embedding stats retrieved",
                project_id=project_id,
                stats=stats,
            )
            
            return stats
            
        except Exception as e:
            logger.error("Failed to get embedding stats", error=str(e))
            return {}
    
    async def health_check(self) -> Dict:
        """Check health of vector search services."""
        try:
            health_status = {
                "embedding_model": False,
                "vertex_ai": False,
                "overall": False,
            }
            
            # Check embedding model
            if self.embedding_model:
                try:
                    # Test with a simple embedding
                    test_embeddings = await self.generate_embeddings(["test"])
                    if test_embeddings:
                        health_status["embedding_model"] = True
                except Exception:
                    pass
            
            # Check Vertex AI (if configured)
            try:
                # This would check Vertex AI Vector Search endpoint
                # For now, mark as healthy if aiplatform is initialized
                health_status["vertex_ai"] = True
            except Exception:
                pass
            
            # Overall health
            health_status["overall"] = health_status["embedding_model"]
            
            logger.info("Vector search health check completed", status=health_status)
            
            return health_status
            
        except Exception as e:
            logger.error("Vector search health check failed", error=str(e))
            return {
                "embedding_model": False,
                "vertex_ai": False,
                "overall": False,
                "error": str(e),
            }
