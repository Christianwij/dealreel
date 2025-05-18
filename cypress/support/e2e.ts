import '@cypress/code-coverage/support'
import '@testing-library/cypress/add-commands'
import 'cypress-file-upload'

// Prevent TypeScript errors when accessing cy.* commands
declare global {
  namespace Cypress {
    interface Chainable {
      // Add custom command types here
      login(email: string, password: string): Chainable<void>
      logout(): Chainable<void>
      uploadDocument(filePath: string): Chainable<void>
      attachFile(filePath: string): Chainable<void>
    }
  }
}

// Custom command for login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('[data-testid=email-input]').type(email)
  cy.get('[data-testid=password-input]').type(password)
  cy.get('[data-testid=login-button]').click()
  cy.url().should('not.include', '/login')
})

// Custom command for logout
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid=user-menu]').click()
  cy.get('[data-testid=logout-button]').click()
  cy.url().should('include', '/login')
})

// Custom command for document upload
Cypress.Commands.add('uploadDocument', (filePath: string) => {
  cy.get('[data-testid=file-upload]').attachFile(filePath)
  cy.get('[data-testid=upload-progress]').should('exist')
  cy.get('[data-testid=upload-success]', { timeout: 10000 }).should('be.visible')
}) 