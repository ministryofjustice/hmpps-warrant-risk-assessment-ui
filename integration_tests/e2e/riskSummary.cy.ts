context('Risk Summary page', () => {
  it('can see fields and radio buttons as blank on first visit', () => {
    cy.visit('/risk-summary/91cce5d0-1b63-49c2-8f95-0e2f3560ac11')
    cy.url().should('include', '/risk-summary')
    cy.get('#page-title').should('contain.text', 'Risk Summary')
    cy.get('#publicDetails .govuk-details__summary-text')
      .should('be.visible')
      .should('contain.text', 'Information about risk to public')
    cy.get('#publicDetails .govuk-details__summary-text').click()
    cy.get('#publicDetails .govuk-details__text')
      .cleanText()
      .should('include', 'Risk to Children: HIGH')
      .and('include', 'Risk to Known Adult: HIGH')
      .and('include', 'Risk to Prisoners: LOW')
      .and('include', 'Risk to Staff: MEDIUM')
      .and('include', 'Risk to Public: HIGH')
    cy.get('#officerDetails .govuk-details__summary-text')
      .should('be.visible')
      .should('contain.text', 'Information about risk to staff')
    cy.get('#officerDetails .govuk-details__summary-text').click()
    cy.get('#officerDetails .govuk-details__text')
      .cleanText()
      .should('include', 'Risk to Known Adult: HIGH')
      .and('include', 'Risk to Prisoners: LOW')
      .and('include', 'Risk to Staff: MEDIUM')
    cy.get('#policeDetails .govuk-details__summary-text')
      .should('be.visible')
      .should('contain.text', 'Information about risk to staff')
    cy.get('#policeDetails .govuk-details__summary-text').click()
    cy.get('#policeDetails .govuk-details__text')
      .cleanText()
      .should('include', 'Risk to Known Adult: HIGH')
      .and('include', 'Risk to Prisoners: LOW')
      .and('include', 'Risk to Staff: MEDIUM')
    cy.get('input[name="publicRadio"][value="Low"]').should('not.be.checked')
    cy.get('input[name="publicRadio"][value="Medium"]').should('not.be.checked')
    cy.get('input[name="publicRadio"][value="High"]').should('not.be.checked')
    cy.get('input[name="officerRadio"][value="Low"]').should('not.be.checked')
    cy.get('input[name="officerRadio"][value="Medium"]').should('not.be.checked')
    cy.get('input[name="officerRadio"][value="High"]').should('not.be.checked')
    cy.get('input[name="policeRadio"][value="Low"]').should('not.be.checked')
    cy.get('input[name="policeRadio"][value="Medium"]').should('not.be.checked')
    cy.get('input[name="policeRadio"][value="High"]').should('not.be.checked')
  })

  it('can see buttons', () => {
    cy.visit('/risk-summary/7a5d6c2f-43ab-4bf0-a95b-a93dbf13a8e4')
    cy.url().should('include', '/risk-summary')
    cy.get('#page-title').should('contain.text', 'Risk Summary')
    cy.get('#continue-button').should('contain.text', 'Continue')
    cy.get('#close-button').should('contain.text', 'Save Progress and Close')
  })

  it('Information dropdowns should show None found when no information returned', () => {
    cy.visit('/risk-summary/c3f2d8a9-6f7c-4b13-9e82-5d8e72ab641a')
    cy.url().should('include', '/risk-summary')
    cy.get('#page-title').should('contain.text', 'Risk Summary')
    cy.get('#publicDetails .govuk-details__summary-text').click()
    cy.get('#publicDetails .govuk-details__text').should('contain.text', 'None Found')
    cy.get('#officerDetails .govuk-details__summary-text').click()
    cy.get('#officerDetails .govuk-details__text').should('contain.text', 'None Found')
    cy.get('#policeDetails .govuk-details__summary-text').click()
    cy.get('#policeDetails .govuk-details__text').should('contain.text', 'None Found')
  })

  it('Radio buttons should always default to selection stored in DB', () => {
    cy.visit('/risk-summary/5f9a1d44-2c6e-4f87-9b12-0d53e4ac7f39')
    cy.url().should('include', '/risk-summary')
    cy.get('#page-title').should('contain.text', 'Risk Summary')
    cy.get('input[name="publicRadio"][value="Low"]').should('not.be.checked')
    cy.get('input[name="publicRadio"][value="Medium"]').should('be.checked')
    cy.get('input[name="publicRadio"][value="High"]').should('not.be.checked')
    cy.get('input[name="officerRadio"][value="Low"]').should('not.be.checked')
    cy.get('input[name="officerRadio"][value="Medium"]').should('not.be.checked')
    cy.get('input[name="officerRadio"][value="High"]').should('be.checked')
    cy.get('input[name="policeRadio"][value="Low"]').should('be.checked')
    cy.get('input[name="policeRadio"][value="Medium"]').should('not.be.checked')
    cy.get('input[name="policeRadio"][value="High"]').should('not.be.checked')
  })

  it('close button performs a post request and displays message', () => {
    cy.intercept('POST', '/risk-summary/**').as('saveAndCloseRequest')
    cy.visit('/risk-summary/e8b7410d-3d25-4eec-97af-11dc9ab4e2b6')
    cy.url().should('include', '/risk-summary')
    cy.get('#page-title').should('contain.text', 'Risk Summary')
    cy.get('#close-button').click()
    cy.wait('@saveAndCloseRequest').then(({ request }) => {
      const body = new URLSearchParams(request.body)
      expect(body.get('action')).to.equal('saveProgressAndClose')
    })
    cy.contains('You can now safely close this window').should('be.visible')
    cy.get('#page-title').should('not.exist')
  })

  it('continue button performs a post and redirects to warrant execution page', () => {
    cy.intercept('POST', '/risk-summary/**').as('formSubmit')
    cy.visit('/risk-summary/2ac0e93f-8b14-4d67-85ef-f2c0a1d9be73')
    cy.url().should('include', '/risk-summary')
    cy.get('#page-title').should('contain.text', 'Risk Summary')
    cy.get('#continue-button').click()
    cy.wait('@formSubmit')
    cy.url().should('include', '/warrant-execution/2ac0e93f-8b14-4d67-85ef-f2c0a1d9be73')
  })

  it('should return to check your answers if came from check your answers', () => {
    cy.intercept('POST', '/risk-summary/**').as('formSubmit')
    cy.visit('/risk-summary/b4d82761-0f6a-4c52-bf8e-3a1d65e9c074?returnTo=check-your-answers')
    cy.url().should('include', '/risk-summary')
    cy.get('#page-title').should('contain.text', 'Risk Summary')
    cy.get('#continue-button').click()
    cy.wait('@formSubmit')
    cy.url().should('include', '/check-your-answers/b4d82761-0f6a-4c52-bf8e-3a1d65e9c074')
  })

  it('should stay on page and show ARNS error message if 500 thrown from ARNS service', () => {
    cy.visit('/risk-summary/18b6c0f7-2d41-4a8e-9c73-6f50ab2de194')
    cy.get('.govuk-error-summary__title').should('exist').should('contain.text', 'There is a problem')
    cy.contains(
      'There has been a problem fetching information from Assess Risk and Needs Service. Please try again later.',
    ).should('exist')
  })

  it('should stay on page and show Service error message if 500 thrown from WRA Service', () => {
    cy.visit('/risk-summary/f2a90b37-5eec-46b2-84d1-c76a95e3bf08')
    cy.get('.govuk-error-summary__title').should('exist').should('contain.text', 'There is a problem')
    cy.contains(
      'There has been a problem fetching information from the Warrant Risk Assessment Service. Please try again later.',
    ).should('exist')
  })

  it('should show error page with message if 400 error returned from ARNS service from crn not existing', () => {
    cy.visit('/risk-summary/6e4bc5a1-9a30-4f6d-8b7e-12d9c4ef5073')
    cy.get('.govuk-error-summary__title').should('exist').should('contain.text', 'There is a problem')
    cy.contains(
      'An unexpected 400 type error has occurred. Please contact the service desk and report this error.',
    ).should('exist')
  })
})
