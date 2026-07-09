import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import CommonUtils from '../services/commonUtils'
import { ErrorMessages } from '../data/uiModels'
import { handleIntegrationErrors } from '../utils/utils'
import WarrantRiskAssessmentApiClient, { WarrantRiskAssessment } from '../data/warrantRiskAssessmentApiClient'
import { OSPlacesAPIClient, OSPlacesFindResponse, OSPlacesResult } from '../data/osPlacesApiClient'

export default function addressSearchRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
  commonUtils: CommonUtils,
  osPlacesApiClient: OSPlacesAPIClient,
): Router {
  const currentPage = 'address-search'

  router.get('/address-search/:id', async (req, res) => {
    await auditService.logPageView(Page.ADDRESS_SEARCH, { who: res.locals.user.username, correlationId: req.id })
    const warrantRiskAssessmentApiClient = new WarrantRiskAssessmentApiClient(authenticationClient)
    const warrantRiskAssessmentId: string = req.params.id
    let warrantRiskAssessment: WarrantRiskAssessment = null

    try {
      warrantRiskAssessment = await warrantRiskAssessmentApiClient.getWarrantRiskAssessmentById(
        warrantRiskAssessmentId,
        res.locals.user.username,
      )
      if (Object.keys(warrantRiskAssessment).length === 0) {
        const errorMessages: ErrorMessages = {}
        errorMessages.genericErrorMessage = {
          text: 'The document has not been found or has been deleted. An error has been logged. 404',
        }
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }
    } catch (error) {
      const errorMessages: ErrorMessages = handleIntegrationErrors(
        error?.responseStatus,
        error?.data?.userMessage,
        'Warrant Risk Assessment',
      )

      // Navigate to the detailed error page on 400
      if (error?.responseStatus === 400) {
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }

      // Navigate to the detailed error page on 404
      if (error?.responseStatus === 404) {
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }

      const showEmbeddedError = true
      res.render(`pages/address-search`, { errorMessages, showEmbeddedError })
      return
    }

    if (await commonUtils.redirectRequired(warrantRiskAssessment, warrantRiskAssessmentId, res, authenticationClient))
      return

    res.render('pages/address-search', {
      warrantRiskAssessment,
      currentPage,
      warrantRiskAssessmentId,
    })
  })

  router.post('/address-search/:id', async (req, res) => {
    const warrantRiskAssessmentApiClient = new WarrantRiskAssessmentApiClient(authenticationClient)
    const warrantRiskAssessmentId: string = req.params.id
    let warrantRiskAssessment: WarrantRiskAssessment = null
    let searchResults: OSPlacesFindResponse = null

    try {
      warrantRiskAssessment = await warrantRiskAssessmentApiClient.getWarrantRiskAssessmentById(
        warrantRiskAssessmentId,
        res.locals.user.username,
      )
      if (Object.keys(warrantRiskAssessment).length === 0) {
        const errorMessages: ErrorMessages = {}
        errorMessages.genericErrorMessage = {
          text: 'The document has not been found or has been deleted. An error has been logged. 404',
        }
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }
    } catch (error) {
      const errorMessages: ErrorMessages = handleIntegrationErrors(
        error?.responseStatus,
        error?.data?.userMessage,
        'Warrant Risk Assessment',
      )

      // Navigate to the detailed error page on 400
      if (error?.responseStatus === 400) {
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }

      // Navigate to the detailed error page on 404
      if (error?.responseStatus === 404) {
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }

      const showEmbeddedError = true
      res.render(`pages/address-search`, { errorMessages, showEmbeddedError })
      return
    }

    if (await commonUtils.redirectRequired(warrantRiskAssessment, warrantRiskAssessmentId, res, authenticationClient))
      return

    let errorMessages: ErrorMessages = {}

    if (req.body.action === 'search') {
      try {
        let addressRadioItems: { value: string; text: string }[]
        let filteredResults: OSPlacesResult[]
        if (req.body.searchTerm && req.body.searchTerm.trim() !== '') {
          searchResults = await osPlacesApiClient.find(`jobcentre plus, ${req.body.searchTerm}`)
          const normalisedSearchTerm = String(req.body.searchTerm || '')
            .trim()
            .toUpperCase()
          filteredResults = searchResults.results.filter(result => {
            const organisationName = result.DPA?.ORGANISATION_NAME?.trim().toUpperCase() || ''
            const address = result.DPA?.ADDRESS?.trim().toUpperCase() || ''
            return (
              normalisedSearchTerm.length > 0 &&
              organisationName === 'JOBCENTRE PLUS' &&
              address.includes(normalisedSearchTerm) &&
              address !== normalisedSearchTerm
            )
          })
          addressRadioItems = filteredResults
            .map(result => ({
              value: String(result.DPA?.UPRN),
              text: result.DPA?.ADDRESS || '',
            }))
            .filter(item => item.text)
        } else {
          errorMessages = {
            searchTerm: { text: 'Please enter a search area in the field provided' },
          }
          addressRadioItems = []
        }

        res.render('pages/address-search', {
          currentPage,
          errorMessages,
          warrantRiskAssessmentId,
          addressRadioItems,
          filteredResults,
          searchTerm: req.body.searchTerm,
        })
      } catch (error) {
        const showEmbeddedError = true
        errorMessages = handleIntegrationErrors(error?.responseStatus, error?.data?.userMessage, 'OS Places API')
        res.render('pages/address-search', { errorMessages, showEmbeddedError, warrantRiskAssessmentId, currentPage })
      }
      return
    }

    const filteredResults: OSPlacesResult[] = req.body.filteredResults ? JSON.parse(req.body.filteredResults) : []

    if (req.body.addressRadio) {
      const matchingAddress = filteredResults.find(addr => req.body.addressRadio === addr.DPA.UPRN)
      warrantRiskAssessment.signOnOffice = {
        deliusAddressId: null,
        buildingName: matchingAddress.DPA.BUILDING_NAME,
        addressNumber: matchingAddress.DPA.BUILDING_NUMBER?.toString() ?? null,
        officeDescription: matchingAddress.DPA.ORGANISATION_NAME,
        // county: matchingAddress.DPA.LOCAL_CUSTODIAN_CODE_DESCRIPTION?.replace(/county$/i, '').trim() ?? null,
        county: null,
        status: null,
        streetName: matchingAddress.DPA.THOROUGHFARE_NAME,
        district: null,
        postcode: matchingAddress.DPA.POSTCODE,
        townCity: matchingAddress.DPA.POST_TOWN,
      }
      try {
        await warrantRiskAssessmentApiClient.updateWarrantRiskAssessment(
          req.params.id,
          warrantRiskAssessment,
          res.locals.user.username,
        )
        res.redirect(`/add-dwp-address/${req.params.id}`)
      } catch (error) {
        const integrationErrorMessages = handleIntegrationErrors(error.status, error.data?.message, 'Breach Notice')
        const showEmbeddedError = true
        // always stay on page and display the error when there are isssues retrieving the breach notice
        res.render(`pages/address-search`, { errorMessages, showEmbeddedError, integrationErrorMessages })
      }
    } else {
      errorMessages = {
        addressRadio: { text: 'Please select an address to continue' },
      }

      const addressRadioItems = filteredResults
        .map(result => ({
          value: String(result.DPA?.UPRN),
          text: result.DPA?.ADDRESS || '',
        }))
        .filter(item => item.text)

      res.render('pages/address-search', {
        errorMessages,
        warrantRiskAssessment,
        currentPage,
        warrantRiskAssessmentId,
        addressRadioItems,
        filteredResults,
        searchTerm: req.body.searchTerm,
      })
    }
  })

  return router
}
