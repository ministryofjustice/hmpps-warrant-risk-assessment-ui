context('Confirm delete Page', () => {
  it('renders the delete confirmation screen correctly', () => {
    cy.visit(`/confirm-delete/90f1d8ab-3e6c-4b72-9a51-2d8e4f7c1b63`)
    cy.contains('Are you sure you wish to delete this document?').should('exist')
    cy.get('#confirm-button').should('exist').and('contain.text', 'Confirm')
    cy.get('#cancel-button').should('exist').and('contain.text', 'Cancel')
  })

  it('cancel button redirects back to check your answers page without performing a delete', () => {
    cy.visit(`/confirm-delete/2be7c94f-6a31-4d85-bf20-9c1e7a5d3f48`)
    cy.get('#cancel-button').click()
    cy.url().should('include', `/check-your-answers/2be7c94f-6a31-4d85-bf20-9c1e7a5d3f48`)
  })

  it('confirm button redirects back to recipients list', () => {
    cy.visit(`/confirm-delete/7d3a1e6c-5f92-4b84-9c10-2e7f4a8d6b31`)
    cy.get('#confirm-button').click()
    cy.url().should('include', `/form-deleted/7d3a1e6c-5f92-4b84-9c10-2e7f4a8d6b31`)
  })
})
