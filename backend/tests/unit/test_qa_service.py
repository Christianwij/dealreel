import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.qa_service import QAService
from app.models.qa import Question, Answer
from app.core.config import settings

pytestmark = pytest.mark.asyncio

class TestQAService:
    @pytest.fixture
    def qa_service(self):
        return QAService()

    @pytest.fixture
    def mock_llm(self):
        return AsyncMock()

    @pytest.fixture
    def mock_embeddings(self):
        return MagicMock()

    async def test_ask_question_success(self, qa_service, mock_llm, mock_embeddings):
        # Arrange
        question_text = "What is the capital of France?"
        expected_answer = "The capital of France is Paris."
        mock_llm.agenerate.return_value = [MagicMock(text=expected_answer)]
        
        with patch("app.services.qa_service.LLMChain") as mock_chain:
            mock_chain.return_value = mock_llm
            with patch("app.services.qa_service.HuggingFaceEmbeddings") as mock_hf:
                mock_hf.return_value = mock_embeddings
                
                # Act
                result = await qa_service.ask_question(question_text)
                
                # Assert
                assert result.answer == expected_answer
                assert result.confidence > 0
                mock_llm.agenerate.assert_called_once()

    async def test_ask_question_with_context(self, qa_service, mock_llm, mock_embeddings, db_session):
        # Arrange
        question_text = "What are our investment criteria?"
        context = "We invest in early-stage startups with strong technical teams."
        expected_answer = "The investment criteria focus on early-stage startups with strong technical teams."
        
        # Create a question with context in the database
        db_question = Question(
            text=question_text,
            context=context
        )
        db_session.add(db_question)
        await db_session.commit()
        
        mock_llm.agenerate.return_value = [MagicMock(text=expected_answer)]
        
        with patch("app.services.qa_service.LLMChain") as mock_chain:
            mock_chain.return_value = mock_llm
            with patch("app.services.qa_service.HuggingFaceEmbeddings") as mock_hf:
                mock_hf.return_value = mock_embeddings
                
                # Act
                result = await qa_service.ask_question(question_text)
                
                # Assert
                assert result.answer == expected_answer
                assert result.context == context
                mock_llm.agenerate.assert_called_once()

    async def test_ask_question_cache_hit(self, qa_service, db_session):
        # Arrange
        question_text = "What is our mission?"
        cached_answer = "Our mission is to revolutionize deal flow."
        
        # Create a cached QA pair
        db_question = Question(
            text=question_text,
            answer=Answer(text=cached_answer, confidence=0.95)
        )
        db_session.add(db_question)
        await db_session.commit()
        
        # Act
        result = await qa_service.ask_question(question_text)
        
        # Assert
        assert result.answer == cached_answer
        assert result.confidence == 0.95
        assert result.from_cache is True

    async def test_ask_question_error_handling(self, qa_service, mock_llm):
        # Arrange
        question_text = "What is the meaning of life?"
        mock_llm.agenerate.side_effect = Exception("LLM Error")
        
        with patch("app.services.qa_service.LLMChain") as mock_chain:
            mock_chain.return_value = mock_llm
            
            # Act & Assert
            with pytest.raises(Exception) as exc_info:
                await qa_service.ask_question(question_text)
            assert str(exc_info.value) == "LLM Error"

    async def test_get_answer_history(self, qa_service, db_session):
        # Arrange
        questions = [
            Question(text="Question 1", answer=Answer(text="Answer 1", confidence=0.9)),
            Question(text="Question 2", answer=Answer(text="Answer 2", confidence=0.8))
        ]
        for q in questions:
            db_session.add(q)
        await db_session.commit()
        
        # Act
        history = await qa_service.get_answer_history()
        
        # Assert
        assert len(history) == 2
        assert history[0].text == "Question 1"
        assert history[0].answer.text == "Answer 1"
        assert history[1].text == "Question 2"
        assert history[1].answer.text == "Answer 2"

    async def test_delete_answer_history(self, qa_service, db_session):
        # Arrange
        questions = [
            Question(text="Question 1", answer=Answer(text="Answer 1", confidence=0.9)),
            Question(text="Question 2", answer=Answer(text="Answer 2", confidence=0.8))
        ]
        for q in questions:
            db_session.add(q)
        await db_session.commit()
        
        # Act
        await qa_service.delete_answer_history()
        
        # Assert
        history = await qa_service.get_answer_history()
        assert len(history) == 0

    async def test_get_performance_metrics(self, qa_service, db_session):
        # Arrange
        questions = [
            Question(
                text="Question 1",
                answer=Answer(text="Answer 1", confidence=0.9),
                response_time=1.2,
                token_count=100
            ),
            Question(
                text="Question 2",
                answer=Answer(text="Answer 2", confidence=0.8),
                response_time=0.8,
                token_count=80
            )
        ]
        for q in questions:
            db_session.add(q)
        await db_session.commit()
        
        # Act
        metrics = await qa_service.get_performance_metrics()
        
        # Assert
        assert metrics.total_questions == 2
        assert metrics.average_response_time == 1.0  # (1.2 + 0.8) / 2
        assert metrics.average_token_count == 90  # (100 + 80) / 2
        assert metrics.cache_hit_rate == 0  # No cache hits in this test data 