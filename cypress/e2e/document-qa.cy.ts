describe('Document Upload and QA Flow', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'testPassword123!'
  }

  beforeEach(() => {
    // Reset state and log in
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.login(testUser.email, testUser.password)
    cy.visit('/dashboard')
  })

  it('should allow uploading a document and asking questions', () => {
    // Upload a test document
    cy.fixture('test-document.pdf', 'base64').then(fileContent => {
      cy.get('[data-testid=file-upload]').attachFile({
        fileContent,
        fileName: 'test-document.pdf',
        mimeType: 'application/pdf'
      })
    })

    // Wait for upload and processing
    cy.get('[data-testid=upload-progress]').should('exist')
    cy.get('[data-testid=upload-success]', { timeout: 10000 }).should('be.visible')

    // Verify document appears in the list
    cy.get('[data-testid=document-list]')
      .should('contain', 'test-document.pdf')

    // Click on the document to open it
    cy.get('[data-testid=document-item]').first().click()

    // Ask a test question
    const testQuestion = 'What is the main topic of this document?'
    cy.get('[data-testid=question-input]')
      .type(testQuestion)
    cy.get('[data-testid=ask-button]').click()

    // Verify question appears in history
    cy.get('[data-testid=qa-history]')
      .should('contain', testQuestion)

    // Wait for and verify answer
    cy.get('[data-testid=answer-display]', { timeout: 15000 })
      .should('be.visible')
      .and('not.be.empty')

    // Test follow-up question
    const followUpQuestion = 'Can you provide more details about that?'
    cy.get('[data-testid=question-input]')
      .type(followUpQuestion)
    cy.get('[data-testid=ask-button]').click()

    // Verify follow-up appears and is answered
    cy.get('[data-testid=qa-history]')
      .should('contain', followUpQuestion)
    cy.get('[data-testid=answer-display]', { timeout: 15000 })
      .should('be.visible')
      .and('not.be.empty')
  })

  it('should handle document processing errors gracefully', () => {
    // Try to upload an invalid file
    cy.fixture('invalid-file.txt', 'base64').then(fileContent => {
      cy.get('[data-testid=file-upload]').attachFile({
        fileContent,
        fileName: 'invalid-file.txt',
        mimeType: 'text/plain'
      })
    })

    // Should show error message
    cy.get('[data-testid=upload-error]')
      .should('be.visible')
      .and('contain', 'Invalid file type')
  })

  it('should allow downloading processed documents', () => {
    // Upload a document first
    cy.uploadDocument('test-document.pdf')

    // Click download button
    cy.get('[data-testid=download-button]').first().click()

    // Verify download started (this is a basic check since Cypress can't fully verify downloads)
    cy.get('[data-testid=download-success]')
      .should('be.visible')
      .and('contain', 'Download started')
  })

  it('should show document processing status', () => {
    // Upload a document
    cy.uploadDocument('test-document.pdf')

    // Verify processing status indicators
    cy.get('[data-testid=processing-status]')
      .should('be.visible')
      .and('contain', 'Processing')

    // Wait for processing to complete
    cy.get('[data-testid=processing-status]', { timeout: 20000 })
      .should('contain', 'Ready')

    // Verify QA interface is enabled
    cy.get('[data-testid=question-input]')
      .should('be.enabled')
  })
}) 