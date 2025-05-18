from prometheus_client import Counter, Histogram, Gauge, Summary
from typing import Dict, Any

# Document processing metrics
DOCUMENTS_PROCESSED = Counter(
    'documents_processed_total',
    'Total number of documents processed',
    ['document_type', 'status']
)

PROCESSING_TIME = Histogram(
    'document_processing_seconds',
    'Time spent processing documents',
    ['document_type'],
    buckets=(0.1, 0.5, 1.0, 2.5, 5.0, 7.5, 10.0, 15.0, 30.0, 60.0)
)

DOCUMENT_SIZE = Histogram(
    'document_size_bytes',
    'Size of processed documents in bytes',
    ['document_type'],
    buckets=(1e5, 1e6, 5e6, 1e7, 2.5e7, 5e7)  # 100KB to 50MB
)

# Resource utilization metrics
MEMORY_USAGE = Gauge(
    'parsing_service_memory_bytes',
    'Current memory usage of the parsing service'
)

CPU_USAGE = Gauge(
    'parsing_service_cpu_percent',
    'Current CPU usage percentage of the parsing service'
)

# Error tracking metrics
PARSING_ERRORS = Counter(
    'parsing_errors_total',
    'Total number of parsing errors',
    ['document_type', 'error_type']
)

# Content extraction metrics
TABLES_EXTRACTED = Counter(
    'tables_extracted_total',
    'Number of tables extracted from documents',
    ['document_type']
)

TEXT_CHUNKS_EXTRACTED = Counter(
    'text_chunks_extracted_total',
    'Number of text chunks extracted from documents',
    ['document_type']
)

IMAGES_EXTRACTED = Counter(
    'images_extracted_total',
    'Number of images extracted from documents',
    ['document_type']
)

# Performance metrics
EXTRACTION_TIME = Summary(
    'content_extraction_seconds',
    'Time spent on content extraction',
    ['content_type', 'document_type']
)

def record_document_processed(doc_type: str, status: str = "success"):
    """Record a document processing attempt."""
    DOCUMENTS_PROCESSED.labels(document_type=doc_type, status=status).inc()

def record_processing_time(doc_type: str, duration: float):
    """Record the time taken to process a document."""
    PROCESSING_TIME.labels(document_type=doc_type).observe(duration)

def record_document_size(doc_type: str, size: int):
    """Record the size of a processed document."""
    DOCUMENT_SIZE.labels(document_type=doc_type).observe(size)

def record_error(doc_type: str, error_type: str):
    """Record a parsing error."""
    PARSING_ERRORS.labels(document_type=doc_type, error_type=error_type).inc()

def record_extraction_metric(metric_type: str, doc_type: str, count: int = 1):
    """Record content extraction metrics."""
    if metric_type == "tables":
        TABLES_EXTRACTED.labels(document_type=doc_type).inc(count)
    elif metric_type == "text_chunks":
        TEXT_CHUNKS_EXTRACTED.labels(document_type=doc_type).inc(count)
    elif metric_type == "images":
        IMAGES_EXTRACTED.labels(document_type=doc_type).inc(count)

def record_extraction_time(content_type: str, doc_type: str, duration: float):
    """Record time spent on specific content extraction."""
    EXTRACTION_TIME.labels(content_type=content_type, document_type=doc_type).observe(duration)

def update_resource_metrics(memory_bytes: float, cpu_percent: float):
    """Update resource utilization metrics."""
    MEMORY_USAGE.set(memory_bytes)
    CPU_USAGE.set(cpu_percent) 