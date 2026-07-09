import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import CommonUtils from '../services/commonUtils'
import { ErrorMessages } from '../data/uiModels'
import { handleIntegrationErrors } from '../utils/utils'
import WarrantRiskAssessmentApiClient, {
  WarrantRiskAssessment,
  WarrantRiskAssessmentAddress,
} from '../data/warrantRiskAssessmentApiClient'

export default function addDwpAddressRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
  commonUtils: CommonUtils,
): Router {
  const currentPage = 'add-dwp-address'

  router.get('/add-dwp-address/:id', async (req, res) => {
    await auditService.logPageView(Page.ADD_DWP_ADDRESS, { who: res.locals.user.username, correlationId: req.id })
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
      res.render(`pages/add-dwp-address`, { errorMessages, showEmbeddedError })
      return
    }

    if (await commonUtils.redirectRequired(warrantRiskAssessment, warrantRiskAssessmentId, res, authenticationClient))
      return

    res.render('pages/add-dwp-address', {
      warrantRiskAssessment,
      currentPage,
      warrantRiskAssessmentId,
    })
  })

  router.post('/add-dwp-address/:id', async (req, res) => {
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
      res.render(`pages/add-dwp-address`, { errorMessages, showEmbeddedError })
      return
    }

    if (warrantRiskAssessment.signOnOffice == null) {
      warrantRiskAssessment.signOnOffice = {
        deliusAddressId: null,
        buildingName: null,
        addressNumber: null,
        officeDescription: null,
        county: null,
        status: null,
        streetName: null,
        district: null,
        postcode: null,
        townCity: null,
      }
    }

    warrantRiskAssessment.signOnOffice.officeDescription = req.body.officeDescription
    warrantRiskAssessment.signOnOffice.addressNumber = req.body.addressNumber
    warrantRiskAssessment.signOnOffice.buildingName = req.body.buildingName
    warrantRiskAssessment.signOnOffice.streetName = req.body.streetName
    warrantRiskAssessment.signOnOffice.district = req.body.district
    warrantRiskAssessment.signOnOffice.townCity = req.body.townCity
    warrantRiskAssessment.signOnOffice.county = req.body.county
    warrantRiskAssessment.signOnOffice.postcode = req.body.postcode

    const errorMessages: ErrorMessages = validateAddress(warrantRiskAssessment.signOnOffice)
    const hasErrors: boolean = Object.keys(errorMessages).length > 0

    if (!hasErrors) {
      try {
        await warrantRiskAssessmentApiClient.updateWarrantRiskAssessment(
          req.params.id,
          warrantRiskAssessment,
          res.locals.user.username,
        )
        res.redirect(`/basic-details/${req.params.id}`)
      } catch (error) {
        const integrationErrorMessages = handleIntegrationErrors(error.status, error.data?.message, 'Breach Notice')
        const showEmbeddedError = true
        // always stay on page and display the error when there are isssues retrieving the breach notice
        res.render(`pages/add-dwp-address`, { errorMessages, showEmbeddedError, integrationErrorMessages })
      }
    } else {
      res.render('pages/add-dwp-address', {
        errorMessages,
        warrantRiskAssessment,
        currentPage,
        warrantRiskAssessmentId,
      })
    }
  })

  function validateAddress(address: WarrantRiskAssessmentAddress): ErrorMessages {
    let errorMessages: ErrorMessages = {}
    if (
      (!address.officeDescription || address.officeDescription.trim() === '') &&
      (!address.buildingName || address.buildingName.trim() === '') &&
      (!address.addressNumber || address.addressNumber.trim() === '')
    ) {
      errorMessages.identifier = {
        text: 'At least 1 out of [Description, Building Name, Address Number] must be present',
      }
    }

    if (!address.streetName || address.streetName.trim() === '') {
      errorMessages.streetName = {
        text: 'Street Name : This is a required value, please enter a value',
      }
    }

    if (!address.townCity || address.townCity.trim() === '') {
      errorMessages.townCity = {
        text: 'Town/City : This is a required value, please enter a value',
      }
    }

    if (!address.postcode || address.postcode.trim() === '') {
      errorMessages.postcode = {
        text: 'Postcode : This is a required value, please enter a value',
      }
    }

    errorMessages = validateLength(address.officeDescription, 'officeDescription', 'Office Description', errorMessages)
    errorMessages = validateLength(address.buildingName, 'buildingName', 'Building Name', errorMessages)
    errorMessages = validateLength(address.addressNumber, 'addressNumber', 'Address Number', errorMessages)
    errorMessages = validateLength(address.streetName, 'streetName', 'Street Name', errorMessages)
    errorMessages = validateLength(address.district, 'district', 'District', errorMessages)
    errorMessages = validateLength(address.townCity, 'townCity', 'Town or City', errorMessages)
    errorMessages = validateLength(address.county, 'county', 'County', errorMessages)
    errorMessages = validateLength(address.postcode, 'postcode', 'Postcode', errorMessages)

    return errorMessages
  }

  function validateLength(
    fieldValue: string,
    fieldName: keyof typeof FIELD_LIMITS,
    label: string,
    errorMessages: ErrorMessages,
  ): ErrorMessages {
    const maxLength = FIELD_LIMITS[fieldName]
    if (!fieldValue) return errorMessages

    if (fieldValue.trim().length > maxLength) {
      return {
        ...errorMessages,
        [fieldName]: {
          text: `Please enter ${maxLength} characters or less for ${label}`,
        },
      }
    }

    return errorMessages
  }

  const FIELD_LIMITS = {
    officeDescription: 50,
    buildingName: 80,
    addressNumber: 35,
    streetName: 80,
    district: 80,
    townCity: 35,
    county: 35,
    postcode: 8,
  }

  return router
}
