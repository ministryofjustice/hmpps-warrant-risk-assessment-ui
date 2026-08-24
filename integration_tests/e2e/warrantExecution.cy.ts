context('Warrant Execution Page', () => {
  it('Warrant Execution with no signature shows correct buttons', () => {
    cy.visit('/warrant-execution/11111111-1111-4111-8111-111111111111')
    cy.url().should('include', '/warrant-execution')
    cy.get('#page-title').should('contain.text', 'Warrant Execution')
    cy.get('#sign-button').should('exist').should('contain.text', 'Click here to sign now')
    cy.get('#continue-button').should('exist').should('contain.text', 'Continue')
    cy.get('#close-button').should('exist').should('contain.text', 'Save Progress and Close')
    cy.get('#clear-signature-button').should('not.exist')
  })

  it('Warrant Execution with completed signature shows correct buttons', () => {
    cy.visit('/warrant-execution/22222222-2222-4222-8222-222222222222')
    cy.url().should('include', '/warrant-execution')
    cy.get('#page-title').should('contain.text', 'Warrant Execution')
    cy.get('#signature').should('contain.text', 'UserSignForename UserSignMiddle UserSignSurname')
    cy.get('#clear-signature-button').should('exist').should('contain.text', 'Clear Signature')
    cy.get('#sign-button').should('not.exist')
    cy.get('#whoIsSendingTheForm').should('not.exist')
  })

  it('Form buttons should display correctly', () => {
    cy.visit('/warrant-execution/33333333-3333-4333-8333-333333333333')
    cy.get('#continue-button').should('contain.text', 'Continue')
    cy.get('#close-button').should('contain.text', 'Save Progress and Close')
    cy.get('#sign-button').should('contain.text', 'Click here to sign now')
  })

  it('Read only fields should display correctly', () => {
    cy.visit('/warrant-execution/44444444-4444-4444-8444-444444444444')
    cy.get('h2').contains('Warrant to be executed by')
    cy.contains('Enforcement Officer').should('exist')
    cy.contains('Full name of Responsible Officer').should('exist')
    cy.contains('NotSo Nice Officer').should('exist')
    cy.contains('Provider').should('exist')
    cy.contains('Northumbria').should('exist')
    cy.contains('Phone Number').should('exist')
    cy.contains('07707123456').should('exist')
  })

  it('Can See and Select who is sending this document fields', () => {
    cy.visit('/warrant-execution/55555555-5555-4555-8555-555555555555')
    cy.get('#whoIsSendingTheForm').should('exist')
    cy.get('input[name="whoIsSendingTheForm"][value="responsibleOfficer"]').should('exist')
    cy.get('input[name="whoIsSendingTheForm"][value="userOnBehalf"]').should('exist')
    cy.get('input[name="whoIsSendingTheForm"][value="responsibleOfficer"]').check()
    cy.get('#sign-button').click()
    cy.url().should('include', '/warrant-execution/55555555-5555-4555-8555-555555555555')
  })

  it('Cant See Who is sending this document radio buttons when document is signed', () => {
    cy.visit('/warrant-execution/66666666-6666-4666-8666-666666666666')
    cy.get('#signature').should('exist')
    cy.get('#whoIsSendingTheForm').should('not.exist')
  })

  it('should display default address when one is returned from the API', () => {
    cy.visit('/warrant-execution/77777777-7777-4777-8777-777777777777')
    cy.get('#workAddress').should('contain.text', 'Default Work Location')
    cy.get('#workAddress').should('contain.text', 'Default Building')
    cy.get('#workAddress').should('contain.text', 'Default Street')
    cy.get('#workAddress').should('contain.text', 'Default Town')
    cy.get('#workAddress').should('contain.text', 'Default District')
    cy.get('#workAddress').should('contain.text', 'Default County')
    cy.get('#workAddress').should('contain.text', 'DF1 1AA')
    cy.get('input[name="offenderAddressSelectOne"][value="Yes"]').should('be.checked')
    cy.get('#alternate-address').should('not.be.visible')
  })

  it('should show radio button to use selected address when no default address is returned from the API and matching address stored', () => {
    cy.visit('/warrant-execution/88888888-8888-4888-8888-888888888888')
    cy.get('#workAddress').should('contain.text', 'Main Work Location')
    cy.get('#workAddress').should('contain.text', 'Main Building')
    cy.get('#workAddress').should('contain.text', '2789 Main Street')
    cy.get('#offenderAddressSelectOne').should('exist')
    cy.get('input[name="offenderAddressSelectOne"][value="Yes"]').should('be.checked')
    cy.get('input[name="offenderAddressSelectOne"][value="No"]').should('exist')
  })

  it('shows only alternate address dropdown when no default address exists', () => {
    cy.visit('/warrant-execution/99999999-9999-4999-8999-999999999999')
    cy.get('#alternate-address-text').should('be.visible')
    cy.get('#alternate-address-dropdown').should('exist')
    cy.get('#alternate-address').should('exist')
    cy.get('#offenderAddressSelectOne').should('not.exist')
    cy.get('#workAddress').should('not.exist')
  })

  it('warning when previously selected address is no longer available', () => {
    cy.visit('/warrant-execution/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
    cy.get('.govuk-error-summary__title').should('contain.text', 'There is a problem')
    cy.contains('The previously selected address is no longer available. Please select an alternative.').should('exist')
  })

  it('should display add address button when no addresses are returned from the API and none stored in DB', () => {
    cy.visit('/warrant-execution/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
    cy.get('#AddAddressMessage').should('contain.text', 'No reply address can be found for this Responsible Officer')
    cy.get('#add-address-button').should('exist').should('contain.text', 'Add Address')
    cy.get('#update-address-button').should('not.exist')
  })

  it('should display update address button when current address has a null delius address id', () => {
    cy.visit('/warrant-execution/cccccccc-cccc-4ccc-8ccc-cccccccccccc')
    cy.get('#workAddress').should('contain.text', 'Manual Work Location')
    cy.get('#update-address-button').should('exist').should('contain.text', 'Update Address')
    cy.get('#add-address-button').should('not.exist')
  })

  it('Continue button saves and navigates to check your answers', () => {
    cy.intercept('POST', '/warrant-execution/**').as('formSubmit')
    cy.visit('/warrant-execution/dddddddd-dddd-4ddd-8ddd-dddddddddddd')
    cy.get('#continue-button').click()
    cy.wait('@formSubmit')
    cy.url().should('include', '/check-your-answers/dddddddd-dddd-4ddd-8ddd-dddddddddddd')
  })

  it('Save Progress and Close button saves and closes the tab', () => {
    cy.intercept('POST', '/warrant-execution/**').as('saveAndCloseRequest')
    cy.visit('/warrant-execution/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')
    cy.get('#close-button').click()
    cy.wait('@saveAndCloseRequest').then(({ request }) => {
      const body = new URLSearchParams(request.body)
      expect(body.get('action')).to.equal('saveProgressAndClose')
    })
    cy.contains('You can now safely close this window').should('be.visible')
  })

  it('should return to check your answers if came from check your answers', () => {
    cy.intercept('POST', '/warrant-execution/**').as('formSubmit')
    cy.visit('/warrant-execution/ffffffff-ffff-4fff-8fff-ffffffffffff?returnTo=check-your-answers')
    cy.get('#continue-button').click()
    cy.wait('@formSubmit')
    cy.url().should('include', '/check-your-answers/ffffffff-ffff-4fff-8fff-ffffffffffff')
  })

  it('Clicking sign button should refresh page with no error', () => {
    cy.intercept('POST', '/warrant-execution/**').as('signRequest')
    cy.visit('/warrant-execution/12121212-1212-4121-8121-121212121212')
    cy.get('input[name="whoIsSendingTheForm"][value="responsibleOfficer"]').check()
    cy.get('#sign-button').click()
    cy.wait('@signRequest')
    cy.url().should('include', '/warrant-execution')
    cy.get('#page-title').should('contain.text', 'Warrant Execution')
  })

  it('Clicking clear signature button should refresh page with no error', () => {
    cy.intercept('POST', '/warrant-execution/**').as('clearSignatureRequest')
    cy.visit('/warrant-execution/34343434-3434-4343-8343-343434343434')
    cy.get('#signature')
      .should('be.visible')
      .should('contain.text', 'UserSignForename UserSignMiddle UserSignSurname 21/08/2026 (Responsible Officer)')
    cy.get('#clear-signature-button').click()
    cy.wait('@clearSignatureRequest')
    cy.url().should('include', '/warrant-execution')
    cy.get('#page-title').should('contain.text', 'Warrant Execution')
  })

  it('Clicking sign button when who is sending this document radio selection is empty should trigger validation', () => {
    cy.visit('/warrant-execution/56565656-5656-4565-8565-565656565656')
    cy.get('#sign-button').click()
    cy.get('.govuk-error-summary__title').should('contain.text', 'There is a problem')
    cy.contains('Please select who is sending this document before pressing "Sign Now"').should('exist')
    cy.get('#whoIsSendingTheForm').should('exist')
    cy.get('#sign-button').should('exist')
  })

  it('should stay on page and show NDelius error message if 500 thrown from NDelius integration service', () => {
    cy.visit('/warrant-execution/78787878-7878-4787-8787-787878787878')
    cy.get('.govuk-error-summary__title').should('contain.text', 'There is a problem')
    cy.contains('There has been a problem fetching information from NDelius. Please try again later.').should('exist')
  })

  it('should stay on page and show Service error message if 500 thrown from WRA Service', () => {
    cy.visit('/warrant-execution/bdbdbdbd-bdbd-4bdb-8bdb-bdbdbdbdbdbd')
    cy.get('.govuk-error-summary__title').should('contain.text', 'There is a problem')
    cy.contains(
      'There has been a problem fetching information from the Warrant Risk Assessment Service. Please try again later.',
    ).should('exist')
  })

  it('should show error page with message if 400 error returned from integrations crn not existing', () => {
    cy.visit('/warrant-execution/abababab-abab-4aba-8aba-abababababab')
    cy.get('.govuk-error-summary__title').should('contain.text', 'There is a problem')
    cy.contains(
      'An unexpected 400 type error has occurred. Please contact the service desk and report this error.',
    ).should('exist')
  })
})
