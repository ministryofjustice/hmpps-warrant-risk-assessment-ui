context('Basic Details page', () => {
  it('can see readonly fields', () => {
    cy.visit('/basic-details/00000000-0000-0000-0000-000000000001')
    cy.get('#page-title').should('contain.text', 'Warrant Risk Assessment - Basic Details')
    cy.get('#crn').should('contain.text', 'X000001')
  })

})
