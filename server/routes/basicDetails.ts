import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import WarrantRiskAssessmentApiClient, { WarrantRiskAssessment } from '../data/warrantRiskAssessmentApiClient'
import NDeliusIntegrationApiClient, { BasicDetails, DeliusAddress } from '../data/ndeliusIntegrationApiClient'
import { ErrorMessages } from '../data/uiModels'
import {
  findMainOrPostalAddressInAddressList,
  formatTitleAndFullName,
  handleIntegrationErrors,
  toWarrantRiskAssessmentAddress,
} from '../utils/utils'
import CommonUtils from '../services/commonUtils'
import { toFullUserDate } from '../utils/dateUtils'
import config from '../config'

export default function basicDetailsRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
  commonUtils: CommonUtils,
): Router {
  const currentPage = 'basic-details'

  router.get('/basic-details/:id', async (req, res) => {
    await auditService.logPageView(Page.BASIC_DETAILS, { who: res.locals.user.username, correlationId: req.id })
    const warrantRiskAssessmentApiClient = new WarrantRiskAssessmentApiClient(authenticationClient)
    const ndeliusIntegrationApiClient = new NDeliusIntegrationApiClient(authenticationClient)
    const warrantRiskAssessmentId: string = req.params.id
    let warrantRiskAssessment: WarrantRiskAssessment = null
    let basicDetails: BasicDetails = null
    const callingScreen: string = req.query.returnTo as string

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
      res.render(`pages/basic-details`, { errorMessages, showEmbeddedError })
      return
    }

    if (await commonUtils.redirectRequired(warrantRiskAssessment, warrantRiskAssessmentId, res, authenticationClient))
      return

    try {
      basicDetails = await ndeliusIntegrationApiClient.getBasicDetails(
        warrantRiskAssessment.crn,
        res.locals.user.username,
      )
    } catch (error) {
      const errorMessages: ErrorMessages = handleIntegrationErrors(
        error.responseStatus,
        error.data?.message,
        'NDelius Integration',
      )

      // take the user to detailed error page for 400 type errors
      if (error.responseStatus === 400) {
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }

      // stay on the current page for 500 errors
      if (error.responseStatus === 500) {
        const showEmbeddedError = true
        res.render(`pages/basic-details`, { errorMessages, showEmbeddedError })
        return
      }
      res.render(`pages/detailed-error`, { errorMessages })
      return
    }

    const formattedDob = toFullUserDate(basicDetails.dateOfBirth)
    const formattedHomeVisit = toFullUserDate(basicDetails.lastHomeVisitDate)
    const defaultAddress: DeliusAddress = findMainOrPostalAddressInAddressList(basicDetails.addresses)
    const otherAddresses: DeliusAddress[] = basicDetails.addresses.filter(a => a.id !== defaultAddress.id)
    const titleAndFullName: string = formatTitleAndFullName(basicDetails.title, basicDetails.name)
    const { mobileNumber, telephoneNumber, emailAddress, nationalInsuranceNumber, employers } = basicDetails
    const addAddressDeeplink = `${config.ndeliusDeeplink.url}?component=AddressandAccommodation&CRN=${warrantRiskAssessment.crn}`

    if (await commonUtils.redirectRequired(warrantRiskAssessment, warrantRiskAssessmentId, res, authenticationClient))
      return

    res.render('pages/basic-details', {
      warrantRiskAssessment,
      warrantRiskAssessmentId,
      basicDetails,
      currentPage,
      formattedDob,
      defaultAddress,
      titleAndFullName,
      mobileNumber,
      telephoneNumber,
      emailAddress,
      addAddressDeeplink,
      formattedHomeVisit,
      nationalInsuranceNumber,
      otherAddresses,
      employers,
      callingScreen,
    })
  })

  router.post('/basic-details/:id', async (req, res, next) => {
    await auditService.logPageView(Page.BASIC_DETAILS, { who: res.locals.user.username, correlationId: req.id })
    const warrantRiskAssessmentApiClient = new WarrantRiskAssessmentApiClient(authenticationClient)
    const ndeliusIntegrationApiClient = new NDeliusIntegrationApiClient(authenticationClient)
    const warrantRiskAssessmentId: string = req.params.id
    const callingScreen: string = req.query.returnTo as string
    let warrantRiskAssessment: WarrantRiskAssessment = null
    let basicDetails: BasicDetails = null

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
      res.render(`pages/basic-details`, { errorMessages, showEmbeddedError })
      return
    }

    if (await commonUtils.redirectRequired(warrantRiskAssessment, warrantRiskAssessmentId, res, authenticationClient))
      return

    try {
      basicDetails = await ndeliusIntegrationApiClient.getBasicDetails(
        warrantRiskAssessment.crn,
        res.locals.user.username,
      )
    } catch (error) {
      const errorMessages: ErrorMessages = handleIntegrationErrors(
        error.responseStatus,
        error.data?.message,
        'NDelius Integration',
      )

      // take the user to detailed error page for 400 type errors
      if (error.responseStatus === 400) {
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }

      // stay on the current page for 500 errors
      if (error.responseStatus === 500) {
        const showEmbeddedError = true
        res.render(`pages/basic-details`, { errorMessages, showEmbeddedError })
        return
      }
      res.render(`pages/detailed-error`, { errorMessages })
      return
    }

    const defaultAddress: DeliusAddress = findMainOrPostalAddressInAddressList(basicDetails.addresses)
    warrantRiskAssessment.postalAddress = toWarrantRiskAssessmentAddress(defaultAddress)
    warrantRiskAssessment.titleAndFullName = formatTitleAndFullName(basicDetails.title, basicDetails.name)

    const { mobileNumber, telephoneNumber, emailAddress, nationalInsuranceNumber } = basicDetails
    warrantRiskAssessment.emailAddress = emailAddress
    warrantRiskAssessment.mobileNumber = mobileNumber
    warrantRiskAssessment.telephoneNumber = telephoneNumber
    warrantRiskAssessment.nationalInsuranceNumber = nationalInsuranceNumber
    warrantRiskAssessment.dateOfBirth = `${basicDetails.dateOfBirth}T00:00:00`
    warrantRiskAssessment.lastHomeVisitDate = `${basicDetails.lastHomeVisitDate}T00:00:00`
    warrantRiskAssessment.basicDetailsSaved = true

    await warrantRiskAssessmentApiClient.updateWarrantRiskAssessment(
      warrantRiskAssessmentId,
      warrantRiskAssessment,
      res.locals.user.username,
    )

    // if the user selected saveProgressAndClose then send a close back to the client
    if (req.body.action === 'saveProgressAndClose') {
      res.send(
        `<p>You can now safely close this window</p><script nonce="${res.locals.cspNonce}">window.close()</script>`,
      )
    } else if (req.body.action === 'refreshFromNdelius') {
      // redirect to warning details to force a reload
      res.redirect(`/basic-details/${warrantRiskAssessmentId}`)
    } else if (callingScreen && callingScreen === 'check-your-report') {
      res.redirect(`/check-your-report/${req.params.id}`)
    } else {
      res.redirect(`/risk-assessment/${warrantRiskAssessmentId}`)
    }
  })

  return router
}
