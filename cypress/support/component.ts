import '@cypress/code-coverage/support'
import '@testing-library/cypress/add-commands'
import { mount } from 'cypress/react'
import 'cypress-file-upload'

// Augment the Cypress namespace to include type definitions for
// your custom command.
declare global {
  namespace Cypress {
    interface Chainable {
      // Add custom command types here
      mount: typeof mount
    }
  }
}

Cypress.Commands.add('mount', mount)

// Example of how to create a reusable custom command for component testing
Cypress.Commands.add('getByTestId', (selector) => {
  return cy.get(`[data-testid=${selector}]`)
}) 