from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
import time
import psutil
import asyncio
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

from parsers import parse_pdf, parse_docx, parse_pptx
from exceptions import ParsingError, DocumentTypeError, DocumentSizeError
from monitoring import (
    record_document_processed,
    record_processing_time,
    record_document_size,
    record_error,
    update_resource_metrics
)

# Configure logging
logger.add(
    "logs/parsing_service.log",
    rotation="500 MB",
    retention="10 days",
    level="INFO",
    backtrace=True,
    diagnose=True
)

app = FastAPI(title="Document Parsing Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Background task for resource metrics
async def update_resource_metrics_task():
    while True:
        process = psutil.Process()
        memory = process.memory_info().rss
        cpu = process.cpu_percent()
        update_resource_metrics(memory, cpu)
        await asyncio.sleep(15)  # Update every 15 seconds

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(update_resource_metrics_task())

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.post("/parse")
async def parse_document(file: UploadFile):
    start_time = time.time()
    doc_type = None
    
    try:
        # Determine document type
        content_type = file.content_type.lower()
        if "pdf" in content_type:
            doc_type = "pdf"
            parser = parse_pdf
        elif "wordprocessingml" in content_type or "docx" in content_type:
            doc_type = "docx"
            parser = parse_docx
        elif "presentationml" in content_type or "pptx" in content_type:
            doc_type = "pptx"
            parser = parse_pptx
        else:
            raise DocumentTypeError(f"Unsupported document type: {content_type}")

        # Read file content
        content = await file.read()
        file_size = len(content)
        
        # Record metrics
        record_document_size(doc_type, file_size)
        
        # Size validation (50MB limit)
        if file_size > 50 * 1024 * 1024:  # 50MB
            raise DocumentSizeError(
                "Document exceeds size limit of 50MB",
                document_type=doc_type,
                details={"size": file_size}
            )

        # Parse document
        logger.info(f"Starting parsing of {file.filename} ({doc_type})")
        result = await parser(content)
        
        # Record success metrics
        processing_time = time.time() - start_time
        record_processing_time(doc_type, processing_time)
        record_document_processed(doc_type, "success")
        
        logger.info(f"Successfully parsed {file.filename}")
        return result

    except ParsingError as e:
        logger.error(f"Parsing error: {str(e)}", exc_info=True)
        record_error(doc_type or "unknown", e.__class__.__name__)
        record_document_processed(doc_type or "unknown", "error")
        raise HTTPException(
            status_code=400,
            detail={
                "error": str(e),
                "type": e.__class__.__name__,
                "document_type": e.document_type,
                "details": e.details
            }
        )
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        record_error(doc_type or "unknown", "unexpected")
        record_document_processed(doc_type or "unknown", "error")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "An unexpected error occurred",
                "type": "UnexpectedError",
                "document_type": doc_type
            }
        )
    finally:
        await file.close() 