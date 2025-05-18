import { useState, FormEvent } from 'react'
import * as Sentry from '@sentry/nextjs'
import { toast } from 'react-hot-toast'

interface QuestionInputProps {
  onSubmit: (question: string) => Promise<void>
  isLoading?: boolean
}

export default function QuestionInput({ onSubmit, isLoading = false }: QuestionInputProps) {
  const [question, setQuestion] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!question.trim() || isLoading) return

    // Start Sentry transaction
    const transaction = Sentry.startTransaction({
      name: 'question_answer',
      op: 'qa'
    })

    try {
      // Add question metadata
      transaction.setData('question', question)
      transaction.setData('questionLength', question.length)

      const startTime = performance.now()
      await onSubmit(question)
      const duration = performance.now() - startTime

      // Add performance data
      transaction.setData('duration', duration)
      transaction.setData('success', true)
    } catch (error) {
      // Capture error with context
      Sentry.withScope(scope => {
        scope.setExtra('question', question)
        Sentry.captureException(error)
      })

      toast.error('Failed to get answer')
      console.error('QA error:', error)

      // Add error data to transaction
      transaction.setData('success', false)
      transaction.setData('error', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      transaction.finish()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about your documents..."
          disabled={isLoading}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!question.trim() || isLoading}
          className={`px-6 py-2 text-white bg-blue-600 rounded-lg 
            ${!question.trim() || isLoading 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-blue-700'}`}
        >
          {isLoading ? 'Thinking...' : 'Ask'}
        </button>
      </div>
    </form>
  )
} 