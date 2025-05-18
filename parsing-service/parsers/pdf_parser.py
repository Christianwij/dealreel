import fitz  # PyMuPDF
from loguru import logger
import io
import time
from typing import List, Dict, Any

from exceptions import (
    DocumentCorruptedError,
    TextExtractionError,
    TableExtractionError,
    MetadataExtractionError
)
from monitoring import record_extraction_metric, record_extraction_time

async def parse_pdf(file_content: bytes) -> dict:
    """Parse PDF file content and return structured data."""
    try:
        # Create PDF document from bytes
        pdf_stream = io.BytesIO(file_content)
        doc = fitz.open(stream=pdf_stream, filetype="pdf")
        
        # Extract metadata
        metadata_start = time.time()
        try:
            metadata = doc.metadata
            record_extraction_time("metadata", "pdf", time.time() - metadata_start)
        except Exception as e:
            logger.error(f"Failed to extract PDF metadata: {str(e)}")
            raise MetadataExtractionError(
                "Failed to extract PDF metadata",
                document_type="pdf",
                details={"error": str(e)}
            )
        
        # Extract text and images
        text_content = []
        images = []
        tables = []
        
        text_start = time.time()
        try:
            for page_num in range(len(doc)):
                page = doc[page_num]
                
                # Extract text
                text = page.get_text()
                if text.strip():
                    text_content.append(text)
                    record_extraction_metric("text_chunks", "pdf")
                
                # Extract tables (using text blocks with position analysis)
                blocks = page.get_text("blocks")
                potential_tables = [b for b in blocks if len(b) > 4 and isinstance(b[4], str) and "\t" in b[4]]
                if potential_tables:
                    for table_block in potential_tables:
                        table_data = [
                            [cell.strip() for cell in row.split("\t")]
                            for row in table_block[4].split("\n")
                            if row.strip()
                        ]
                        if len(table_data) > 1:  # At least header and one row
                            tables.append(table_data)
                            record_extraction_metric("tables", "pdf")
                
                # Extract images
                for img_index, img in enumerate(page.get_images()):
                    try:
                        xref = img[0]
                        base_image = doc.extract_image(xref)
                        if base_image:
                            image_info = {
                                "page": page_num + 1,
                                "index": img_index + 1,
                                "width": base_image["width"],
                                "height": base_image["height"],
                                "format": base_image["ext"]
                            }
                            images.append(image_info)
                            record_extraction_metric("images", "pdf")
                    except Exception as e:
                        logger.warning(f"Failed to extract image {img_index} from page {page_num + 1}: {str(e)}")
            
            record_extraction_time("text", "pdf", time.time() - text_start)
            
        except Exception as e:
            logger.error(f"Failed to extract PDF content: {str(e)}")
            raise TextExtractionError(
                "Failed to extract PDF content",
                document_type="pdf",
                details={"error": str(e)}
            )
        
        return {
            "content_type": "pdf",
            "metadata": metadata,
            "text": "\n".join(text_content),
            "tables": tables,
            "images": images,
            "pages": len(doc)
        }
        
    except (TextExtractionError, MetadataExtractionError) as e:
        raise e
    except Exception as e:
        logger.error(f"Failed to parse PDF: {str(e)}")
        raise DocumentCorruptedError(
            "Failed to parse PDF document",
            document_type="pdf",
            details={"error": str(e)}
        )
    finally:
        if 'doc' in locals():
            doc.close()
        if 'pdf_stream' in locals():
            pdf_stream.close() 