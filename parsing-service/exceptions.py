class ParsingError(Exception):
    """Base exception for all parsing related errors."""
    def __init__(self, message: str, document_type: str = None, details: dict = None):
        self.message = message
        self.document_type = document_type
        self.details = details or {}
        super().__init__(self.message)

class DocumentTypeError(ParsingError):
    """Raised when document type is unsupported or cannot be determined."""
    pass

class DocumentSizeError(ParsingError):
    """Raised when document size exceeds limits."""
    pass

class DocumentCorruptedError(ParsingError):
    """Raised when document content is corrupted or unreadable."""
    pass

class TableExtractionError(ParsingError):
    """Raised when table extraction fails."""
    pass

class TextExtractionError(ParsingError):
    """Raised when text extraction fails."""
    pass

class MetadataExtractionError(ParsingError):
    """Raised when metadata extraction fails."""
    pass

class NormalizationError(ParsingError):
    """Raised when content normalization fails."""
    pass 