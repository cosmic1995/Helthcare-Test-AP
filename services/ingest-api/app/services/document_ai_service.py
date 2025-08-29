"""Document AI service for parsing uploaded documents."""

import json
from typing import Dict, List, Optional

import structlog
from google.cloud import documentai
from google.cloud import storage

from app.config import get_settings

logger = structlog.get_logger(__name__)


class DocumentAIService:
    """Service for Document AI operations."""
    
    def __init__(self):
        self.settings = get_settings()
        self.client = documentai.DocumentProcessorServiceClient()
        self.storage_client = storage.Client()
    
    async def process_document(
        self,
        file_path: str,
        bucket_name: str,
        project_id: str,
    ) -> Optional[Dict]:
        """Process a document using Document AI."""
        try:
            # Get the document from storage
            bucket = self.storage_client.bucket(bucket_name)
            blob = bucket.blob(file_path)
            
            if not blob.exists():
                logger.error("Document not found", file_path=file_path)
                return None
            
            # Download document content
            document_content = blob.download_as_bytes()
            
            # Determine MIME type
            mime_type = blob.content_type or "application/pdf"
            
            # Create the document object
            raw_document = documentai.RawDocument(
                content=document_content,
                mime_type=mime_type,
            )
            
            # Configure the process request
            request = documentai.ProcessRequest(
                name=self.settings.document_ai_processor,
                raw_document=raw_document,
            )
            
            # Process the document
            result = self.client.process_document(request=request)
            document = result.document
            
            # Extract structured data
            parsed_data = await self._extract_structured_data(document, project_id)
            
            logger.info(
                "Document processed successfully",
                file_path=file_path,
                pages=len(document.pages),
                entities=len(document.entities),
            )
            
            return parsed_data
            
        except Exception as e:
            logger.error("Failed to process document", file_path=file_path, error=str(e))
            return None
    
    async def _extract_structured_data(
        self,
        document: documentai.Document,
        project_id: str,
    ) -> Dict:
        """Extract structured data from processed document."""
        try:
            # Extract text content
            full_text = document.text
            
            # Extract pages
            pages = []
            for page in document.pages:
                page_data = {
                    "page_number": len(pages) + 1,
                    "width": page.dimension.width if page.dimension else 0,
                    "height": page.dimension.height if page.dimension else 0,
                    "blocks": [],
                    "paragraphs": [],
                }
                
                # Extract blocks
                for block in page.blocks:
                    block_text = self._get_text_from_layout(block.layout, full_text)
                    if block_text.strip():
                        page_data["blocks"].append({
                            "text": block_text,
                            "confidence": block.layout.confidence if block.layout else 0.0,
                        })
                
                # Extract paragraphs
                for paragraph in page.paragraphs:
                    para_text = self._get_text_from_layout(paragraph.layout, full_text)
                    if para_text.strip():
                        page_data["paragraphs"].append({
                            "text": para_text,
                            "confidence": paragraph.layout.confidence if paragraph.layout else 0.0,
                        })
                
                pages.append(page_data)
            
            # Extract entities (if any)
            entities = []
            for entity in document.entities:
                entities.append({
                    "type": entity.type_,
                    "mention_text": entity.mention_text,
                    "confidence": entity.confidence,
                    "normalized_value": entity.normalized_value.text if entity.normalized_value else None,
                })
            
            # Extract requirements using heuristics
            requirements = await self._extract_requirements(pages, project_id)
            
            return {
                "full_text": full_text,
                "pages": pages,
                "entities": entities,
                "requirements": requirements,
                "metadata": {
                    "total_pages": len(pages),
                    "total_entities": len(entities),
                    "total_requirements": len(requirements),
                },
            }
            
        except Exception as e:
            logger.error("Failed to extract structured data", error=str(e))
            return {}
    
    def _get_text_from_layout(self, layout: documentai.Document.Page.Layout, full_text: str) -> str:
        """Extract text from layout object."""
        if not layout or not layout.text_anchor:
            return ""
        
        text_segments = []
        for segment in layout.text_anchor.text_segments:
            start_index = int(segment.start_index) if segment.start_index else 0
            end_index = int(segment.end_index) if segment.end_index else len(full_text)
            text_segments.append(full_text[start_index:end_index])
        
        return "".join(text_segments)
    
    async def _extract_requirements(self, pages: List[Dict], project_id: str) -> List[Dict]:
        """Extract requirements from document pages using heuristics."""
        requirements = []
        
        try:
            for page_num, page in enumerate(pages, 1):
                # Look for requirement patterns in paragraphs
                for para_idx, paragraph in enumerate(page["paragraphs"]):
                    text = paragraph["text"].strip()
                    
                    # Skip very short text
                    if len(text) < 20:
                        continue
                    
                    # Heuristics for identifying requirements
                    is_requirement = (
                        self._contains_requirement_keywords(text) or
                        self._has_requirement_structure(text) or
                        self._is_normative_statement(text)
                    )
                    
                    if is_requirement:
                        # Determine section path
                        section_path = f"page_{page_num}_para_{para_idx + 1}"
                        
                        # Classify risk level
                        risk_class = self._classify_risk_level(text)
                        
                        # Identify compliance standards
                        std_tags = self._identify_compliance_standards(text)
                        
                        # Determine if normative
                        normative = self._is_normative_statement(text)
                        
                        requirement = {
                            "text": text,
                            "section_path": section_path,
                            "page_number": page_num,
                            "paragraph_index": para_idx,
                            "confidence": paragraph.get("confidence", 0.0),
                            "risk_class": risk_class,
                            "std_tags": std_tags,
                            "normative": normative,
                        }
                        
                        requirements.append(requirement)
            
            logger.info(
                "Requirements extracted",
                project_id=project_id,
                total_requirements=len(requirements),
            )
            
            return requirements
            
        except Exception as e:
            logger.error("Failed to extract requirements", error=str(e))
            return []
    
    def _contains_requirement_keywords(self, text: str) -> bool:
        """Check if text contains requirement keywords."""
        keywords = [
            "shall", "must", "should", "may", "will",
            "required", "mandatory", "optional", "recommended",
            "specification", "requirement", "constraint",
            "compliance", "standard", "regulation",
        ]
        
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in keywords)
    
    def _has_requirement_structure(self, text: str) -> bool:
        """Check if text has typical requirement structure."""
        # Look for numbered sections, bullet points, etc.
        import re
        
        patterns = [
            r'^\d+\.\d+',  # 1.1, 2.3, etc.
            r'^\d+\)',     # 1), 2), etc.
            r'^[a-z]\)',   # a), b), etc.
            r'^[A-Z]\)',   # A), B), etc.
            r'^\*\s',      # Bullet points
            r'^-\s',       # Dash bullets
        ]
        
        return any(re.match(pattern, text.strip()) for pattern in patterns)
    
    def _is_normative_statement(self, text: str) -> bool:
        """Determine if text is a normative statement."""
        normative_indicators = [
            "shall", "must", "required", "mandatory",
            "will", "is required to", "needs to",
        ]
        
        text_lower = text.lower()
        return any(indicator in text_lower for indicator in normative_indicators)
    
    def _classify_risk_level(self, text: str) -> str:
        """Classify risk level based on text content."""
        text_lower = text.lower()
        
        # High risk indicators
        if any(keyword in text_lower for keyword in [
            "safety", "critical", "hazard", "risk", "harm",
            "patient", "life", "death", "injury", "adverse",
        ]):
            return "A"  # High risk
        
        # Medium risk indicators
        if any(keyword in text_lower for keyword in [
            "performance", "effectiveness", "accuracy",
            "reliability", "availability", "security",
        ]):
            return "B"  # Medium risk
        
        # Default to low risk
        return "C"
    
    def _identify_compliance_standards(self, text: str) -> List[str]:
        """Identify compliance standards mentioned in text."""
        standards = []
        text_lower = text.lower()
        
        standard_mappings = {
            "iso 13485": "ISO_13485",
            "iso13485": "ISO_13485",
            "iec 62304": "IEC_62304",
            "iec62304": "IEC_62304",
            "fda": "FDA_QMSR",
            "qmsr": "FDA_QMSR",
            "510k": "FDA_QMSR",
            "iso 27001": "ISO_27001",
            "iso27001": "ISO_27001",
            "part 11": "CFR_PART_11",
            "21 cfr": "CFR_PART_11",
            "gdpr": "GDPR",
            "hipaa": "HIPAA",
        }
        
        for keyword, standard in standard_mappings.items():
            if keyword in text_lower and standard not in standards:
                standards.append(standard)
        
        return standards
