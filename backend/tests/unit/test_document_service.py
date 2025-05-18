import pytest
from unittest.mock import AsyncMock, MagicMock, patch, mock_open
from pathlib import Path

from app.services.document_service import DocumentService
from app.models.document import Document, DocumentType
from app.core.exceptions import (
    DocumentProcessingError,
    UnsupportedDocumentType,
    DocumentNotFoundError
)

pytestmark = pytest.mark.asyncio

class TestDocumentService:
    @pytest.fixture
    def document_service(self):
        return DocumentService()

    @pytest.fixture
    def mock_pdf_parser(self):
        return AsyncMock()

    @pytest.fixture
    def mock_docx_parser(self):
        return AsyncMock()

    @pytest.fixture
    def mock_pptx_parser(self):
        return AsyncMock()

    @pytest.fixture
    def sample_pdf_content(self):
        return b"%PDF-1.4\n..."  # Minimal PDF content

    @pytest.fixture
    def sample_docx_content(self):
        return b"PK\x03\x04..."  # Minimal DOCX content

    @pytest.fixture
    def sample_pptx_content(self):
        return b"PK\x03\x04..."  # Minimal PPTX content

    async def test_process_pdf_document_success(
        self,
        document_service,
        mock_pdf_parser,
        sample_pdf_content,
        db_session
    ):
        # Arrange
        filename = "test.pdf"
        expected_text = "Sample PDF content"
        mock_pdf_parser.extract_text.return_value = expected_text
        
        with patch("app.services.document_service.PDFParser") as MockPDFParser:
            MockPDFParser.return_value = mock_pdf_parser
            with patch("builtins.open", mock_open(read_data=sample_pdf_content)):
                # Act
                document = await document_service.process_document(
                    filename,
                    DocumentType.PDF,
                    db_session
                )
                
                # Assert
                assert document.filename == filename
                assert document.content == expected_text
                assert document.document_type == DocumentType.PDF
                mock_pdf_parser.extract_text.assert_called_once()

    async def test_process_docx_document_success(
        self,
        document_service,
        mock_docx_parser,
        sample_docx_content,
        db_session
    ):
        # Arrange
        filename = "test.docx"
        expected_text = "Sample DOCX content"
        mock_docx_parser.extract_text.return_value = expected_text
        
        with patch("app.services.document_service.DOCXParser") as MockDOCXParser:
            MockDOCXParser.return_value = mock_docx_parser
            with patch("builtins.open", mock_open(read_data=sample_docx_content)):
                # Act
                document = await document_service.process_document(
                    filename,
                    DocumentType.DOCX,
                    db_session
                )
                
                # Assert
                assert document.filename == filename
                assert document.content == expected_text
                assert document.document_type == DocumentType.DOCX
                mock_docx_parser.extract_text.assert_called_once()

    async def test_process_pptx_document_success(
        self,
        document_service,
        mock_pptx_parser,
        sample_pptx_content,
        db_session
    ):
        # Arrange
        filename = "test.pptx"
        expected_text = "Sample PPTX content"
        mock_pptx_parser.extract_text.return_value = expected_text
        
        with patch("app.services.document_service.PPTXParser") as MockPPTXParser:
            MockPPTXParser.return_value = mock_pptx_parser
            with patch("builtins.open", mock_open(read_data=sample_pptx_content)):
                # Act
                document = await document_service.process_document(
                    filename,
                    DocumentType.PPTX,
                    db_session
                )
                
                # Assert
                assert document.filename == filename
                assert document.content == expected_text
                assert document.document_type == DocumentType.PPTX
                mock_pptx_parser.extract_text.assert_called_once()

    async def test_process_document_unsupported_type(self, document_service, db_session):
        # Arrange
        filename = "test.txt"
        
        # Act & Assert
        with pytest.raises(UnsupportedDocumentType):
            await document_service.process_document(
                filename,
                "TXT",
                db_session
            )

    async def test_process_document_file_not_found(self, document_service, db_session):
        # Arrange
        filename = "nonexistent.pdf"
        
        # Act & Assert
        with pytest.raises(DocumentNotFoundError):
            await document_service.process_document(
                filename,
                DocumentType.PDF,
                db_session
            )

    async def test_process_document_processing_error(
        self,
        document_service,
        mock_pdf_parser,
        sample_pdf_content,
        db_session
    ):
        # Arrange
        filename = "test.pdf"
        mock_pdf_parser.extract_text.side_effect = Exception("Processing error")
        
        with patch("app.services.document_service.PDFParser") as MockPDFParser:
            MockPDFParser.return_value = mock_pdf_parser
            with patch("builtins.open", mock_open(read_data=sample_pdf_content)):
                # Act & Assert
                with pytest.raises(DocumentProcessingError):
                    await document_service.process_document(
                        filename,
                        DocumentType.PDF,
                        db_session
                    )

    async def test_get_document_by_id_success(self, document_service, db_session):
        # Arrange
        document = Document(
            filename="test.pdf",
            content="Test content",
            document_type=DocumentType.PDF
        )
        db_session.add(document)
        await db_session.commit()
        await db_session.refresh(document)
        
        # Act
        result = await document_service.get_document_by_id(document.id, db_session)
        
        # Assert
        assert result is not None
        assert result.id == document.id
        assert result.filename == document.filename
        assert result.content == document.content

    async def test_get_document_by_id_not_found(self, document_service, db_session):
        # Act & Assert
        with pytest.raises(DocumentNotFoundError):
            await document_service.get_document_by_id(999, db_session)

    async def test_get_all_documents(self, document_service, db_session):
        # Arrange
        documents = [
            Document(
                filename="test1.pdf",
                content="Test content 1",
                document_type=DocumentType.PDF
            ),
            Document(
                filename="test2.docx",
                content="Test content 2",
                document_type=DocumentType.DOCX
            )
        ]
        for doc in documents:
            db_session.add(doc)
        await db_session.commit()
        
        # Act
        results = await document_service.get_all_documents(db_session)
        
        # Assert
        assert len(results) == 2
        assert results[0].filename == "test1.pdf"
        assert results[1].filename == "test2.docx"

    async def test_delete_document_success(self, document_service, db_session):
        # Arrange
        document = Document(
            filename="test.pdf",
            content="Test content",
            document_type=DocumentType.PDF
        )
        db_session.add(document)
        await db_session.commit()
        await db_session.refresh(document)
        
        # Act
        await document_service.delete_document(document.id, db_session)
        
        # Assert
        result = await document_service.get_document_by_id(document.id, db_session)
        assert result is None

    async def test_delete_document_not_found(self, document_service, db_session):
        # Act & Assert
        with pytest.raises(DocumentNotFoundError):
            await document_service.delete_document(999, db_session) 