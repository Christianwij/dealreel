describe('Authentication Flow', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'testPassword123!',
    name: 'Test User'
  }

  beforeEach(() => {
    // Reset any previous state
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  it('should allow a user to sign up', () => {
    cy.visit('/signup')
    
    // Fill out the signup form
    cy.get('[data-testid=name-input]').type(testUser.name)
    cy.get('[data-testid=email-input]').type(testUser.email)
    cy.get('[data-testid=password-input]').type(testUser.password)
    cy.get('[data-testid=confirm-password-input]').type(testUser.password)
    
    // Submit the form
    cy.get('[data-testid=signup-button]').click()
    
    // Should be redirected to the dashboard
    cy.url().should('include', '/dashboard')
    
    // Verify user menu shows the correct name
    cy.get('[data-testid=user-menu]').should('contain', testUser.name)
  })

  it('should allow a user to log in', () => {
    cy.visit('/login')
    
    // Fill out the login form
    cy.get('[data-testid=email-input]').type(testUser.email)
    cy.get('[data-testid=password-input]').type(testUser.password)
    
    // Submit the form
    cy.get('[data-testid=login-button]').click()
    
    // Should be redirected to the dashboard
    cy.url().should('include', '/dashboard')
    
    // Verify user menu shows the correct name
    cy.get('[data-testid=user-menu]').should('contain', testUser.name)
  })

  it('should allow a user to log out', () => {
    // First log in
    cy.login(testUser.email, testUser.password)
    
    // Then log out using our custom command
    cy.logout()
    
    // Verify we're back at the login page
    cy.url().should('include', '/login')
    
    // Verify user menu is no longer visible
    cy.get('[data-testid=user-menu]').should('not.exist')
  })

  it('should show error messages for invalid login attempts', () => {
    cy.visit('/login')
    
    // Try to log in with invalid credentials
    cy.get('[data-testid=email-input]').type('wrong@example.com')
    cy.get('[data-testid=password-input]').type('wrongpassword')
    cy.get('[data-testid=login-button]').click()
    
    // Should show error message
    cy.get('[data-testid=error-message]')
      .should('be.visible')
      .and('contain', 'Invalid email or password')
    
    // Should still be on login page
    cy.url().should('include', '/login')
  })
}) 