context('Form deleted Page', () => {
  it('renders the form deleted screen correctly', () => {
    cy.visit(`/form-deleted/00000000-0000-0000-0000-000000000001`)
    cy.contains('Assessment Deleted').should('exist')
    cy.contains('This assessment has been permanently deleted and cannot be recovered').should('exist')
  })
})
