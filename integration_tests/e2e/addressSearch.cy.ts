context('Address Search page', () => {
  it('can see buttons', () => {
    cy.visit('/address-search/1c7bf7ec-9e8d-4f99-8fd8-bf43b7f5ad11')
    cy.url().should('include', '/address-search')
    cy.get('#page-title').should('contain.text', 'Search for a DWP Signing on Office')
    cy.get('#searchTerm').should('exist').should('be.visible')
    cy.get('#search-button').should('contain.text', 'Search for offices in this area')
    cy.get('#select-button').should('contain.text', 'Select')
    cy.get('#cancel-button').should('contain.text', 'Cancel')
  })

  it('Results are displayed when entering a search term and clicking search', () => {
    cy.intercept('POST', '/address-search/**').as('searchRequest')
    cy.visit('/address-search/7a2d38f1-0c7e-41d1-9d2d-4ca0f2c1d8b7')
    cy.get('#searchTerm').type('Example')
    cy.get('#search-button').click()

    cy.wait('@searchRequest').then(({ request }) => {
      const body = new URLSearchParams(request.body)
      expect(body.get('action')).to.equal('search')
      expect(body.get('searchTerm')).to.equal('Example')
    })

    cy.contains('Please select the relevant address').should('be.visible')
    cy.get('input[name="addressRadio"]').should('have.length', 2)
    cy.contains('Jobcentre Plus, 1 Example Street, Leeds, LS1 1AA').should('be.visible')
    cy.contains('Jobcentre Plus, 20 Market Road, Bradford, BD1 1AA').should('be.visible')
    cy.contains('Other Office, 9 Example Street, Leeds, LS1 1AA').should('not.exist')
  })

  it('Message should display on screen when no results are returned after performing a search', () => {
    cy.intercept('POST', '/address-search/**').as('searchRequest')
    cy.visit('/address-search/4f82a9cc-6df9-4f4b-a64f-0c3a1e0d9b6e')
    cy.get('#searchTerm').type('Nowhere')
    cy.get('#search-button').click()

    cy.wait('@searchRequest').then(({ request }) => {
      const body = new URLSearchParams(request.body)
      expect(body.get('action')).to.equal('search')
      expect(body.get('searchTerm')).to.equal('Nowhere')
    })

    cy.contains(
      'No results found in the area entered, please refine search or enter manually on the previous screen',
    ).should('be.visible')
  })

  it('Validation appears when searching with nothing entered in the search term field', () => {
    cy.intercept('POST', '/address-search/**').as('searchRequest')
    cy.visit('/address-search/e9b4c5fa-3c15-4ec8-8a0a-5b94f8b2d271')
    cy.get('#search-button').click()

    cy.wait('@searchRequest').then(({ request }) => {
      const body = new URLSearchParams(request.body)
      expect(body.get('action')).to.equal('search')
      expect(body.get('searchTerm')).to.equal('')
    })

    cy.get('.govuk-error-summary__title').should('contain.text', 'There is a problem')
    cy.get('#searchTerm-error').should('contain.text', 'Please enter a search area in the field provided')
  })

  it('select button performs a post and redirects to add-dwp-address page', () => {
    cy.intercept('POST', '/address-search/**').as('addressSearchSubmit')
    cy.visit('/address-search/c3d1e8ab-21f4-4b7e-b6b2-9f4a2d6e7c10')

    cy.get('#searchTerm').type('Example')
    cy.get('#search-button').click()

    cy.wait('@addressSearchSubmit').then(({ request }) => {
      const body = new URLSearchParams(request.body)
      expect(body.get('action')).to.equal('search')
      expect(body.get('searchTerm')).to.equal('Example')
    })

    cy.get('input[name="addressRadio"]').first().check({ force: true })
    cy.get('#select-button').click()

    cy.wait('@addressSearchSubmit').then(({ request }) => {
      const body = new URLSearchParams(request.body)
      expect(body.get('action')).to.equal('select')
      expect(body.get('addressRadio')).to.equal('100120345678')
    })
    cy.url().should('include', '/add-dwp-address/c3d1e8ab-21f4-4b7e-b6b2-9f4a2d6e7c10')
  })

  it('validation appears when clicking select when no address is selected', () => {
    cy.intercept('POST', '/address-search/**').as('addressSearchSubmit')
    cy.visit('/address-search/2abfd3c9-8aa4-4f91-9f65-6a8fbc1d2e34')

    cy.get('#searchTerm').type('Example')
    cy.get('#search-button').click()

    cy.wait('@addressSearchSubmit').then(({ request }) => {
      const body = new URLSearchParams(request.body)
      expect(body.get('action')).to.equal('search')
      expect(body.get('searchTerm')).to.equal('Example')
    })

    cy.get('#select-button').click()

    cy.wait('@addressSearchSubmit').then(({ request }) => {
      const body = new URLSearchParams(request.body)
      expect(body.get('action')).to.equal('select')
      expect(body.get('addressRadio')).to.equal(null)
    })

    cy.get('.govuk-error-summary__title').should('contain.text', 'There is a problem')
    cy.get('#addressRadio-error').should('contain.text', 'Please select an address to continue')
  })

  it('should return to add-dwp-address on cancel operation', () => {
    cy.visit('/address-search/b6f37d2a-5c1e-4fd7-90c6-2d1ea8b3f9a5')
    cy.get('#cancel-button').click()

    cy.url().should('include', '/add-dwp-address/b6f37d2a-5c1e-4fd7-90c6-2d1ea8b3f9a5')
  })

  it('should stay on page and show Service error message if 500 thrown from Warrant Risk Service', () => {
    cy.visit('/address-search/d4e9a1c7-72b1-4fcb-95d2-31fa6c8b0e44')
    cy.url().should('include', '/address-search')
    cy.get('.govuk-error-summary__title').should('contain.text', 'There is a problem')
    cy.contains(
      'There has been a problem fetching information from the Warrant Risk Assessment Service. Please try again later.',
    ).should('exist')
  })

  it('should stay on page and show API error message if 500 thrown from OS Places service', () => {
    cy.intercept('POST', '/address-search/**').as('searchRequest')
    cy.visit('/address-search/98c1f6ad-4b7a-4f95-a1de-7c2e3f9b5d60')

    cy.get('#searchTerm').type('ErrorTown')
    cy.get('#search-button').click()

    cy.wait('@searchRequest').then(({ request }) => {
      const body = new URLSearchParams(request.body)
      expect(body.get('action')).to.equal('search')
      expect(body.get('searchTerm')).to.equal('ErrorTown')
    })

    cy.url().should('include', '/address-search/98c1f6ad-4b7a-4f95-a1de-7c2e3f9b5d60')
    cy.get('.govuk-error-summary__title').should('contain.text', 'There is a problem')
    cy.contains('There has been a problem fetching information from OS Places API. Please try again later.').should(
      'exist',
    )
  })
})
