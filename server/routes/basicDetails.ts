import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import WarrantRiskAssessmentApiClient, {
  WarrantRiskAssessment,
  WarrantRiskAssessmentAddress,
  WarrantRiskAssessmentContact,
} from '../data/warrantRiskAssessmentApiClient'
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
    let existingContacts: WarrantRiskAssessmentContact[] = []

    try {
      warrantRiskAssessment = await warrantRiskAssessmentApiClient.getWarrantRiskAssessmentById(
        warrantRiskAssessmentId,
        res.locals.user.username,
      )
      existingContacts = await warrantRiskAssessmentApiClient.getContacts(
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
    const otherAddresses: DeliusAddress[] = basicDetails.addresses.filter(a => a.id !== defaultAddress?.id)
    const titleAndFullName: string = formatTitleAndFullName(basicDetails.title, basicDetails.name)
    const { mobileNumber, telephoneNumber, emailAddress, nationalInsuranceNumber, employers } = basicDetails
    const addAddressDeeplink = `${config.ndeliusDeeplink.url}?component=AddressandAccommodation&CRN=${warrantRiskAssessment.crn}`
    const contactDeleted = existingContacts?.some(
      existingContact =>
        !basicDetails.employers.some(
          employer => employer.employerAddress.id === existingContact.contactLocation.deliusAddressId,
        ),
    )

    if (await commonUtils.redirectRequired(warrantRiskAssessment, warrantRiskAssessmentId, res, authenticationClient))
      return

    const errorMessages: ErrorMessages = {}
    if (contactDeleted) {
      errorMessages.contacts = {
        text: 'Previously recorded employers are no longer available. Please check the content of this screen and press "Continue" or "Save progress and close" to save the current information',
      }
    }

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
      errorMessages,
      callingScreen,
    })
  })

  router.post('/basic-details/:id', async (req, res) => {
    await auditService.logPageView(Page.BASIC_DETAILS, { who: res.locals.user.username, correlationId: req.id })
    const warrantRiskAssessmentApiClient = new WarrantRiskAssessmentApiClient(authenticationClient)
    const ndeliusIntegrationApiClient = new NDeliusIntegrationApiClient(authenticationClient)
    const warrantRiskAssessmentId: string = req.params.id
    const callingScreen: string = req.query.returnTo as string
    let warrantRiskAssessment: WarrantRiskAssessment = null
    let basicDetails: BasicDetails = null
    let existingAddresses: WarrantRiskAssessmentAddress[] = []
    let existingContacts: WarrantRiskAssessmentContact[] = []

    try {
      warrantRiskAssessment = await warrantRiskAssessmentApiClient.getWarrantRiskAssessmentById(
        warrantRiskAssessmentId,
        res.locals.user.username,
      )
      existingAddresses = await warrantRiskAssessmentApiClient.getBasicDetailAddressess(
        warrantRiskAssessmentId,
        res.locals.user.username,
      )
      existingContacts = await warrantRiskAssessmentApiClient.getContacts(
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
    const otherAddresses: DeliusAddress[] = basicDetails.addresses.filter(a => a.id !== defaultAddress?.id)
    warrantRiskAssessment.postalAddress = toWarrantRiskAssessmentAddress(defaultAddress, '', warrantRiskAssessmentId)
    warrantRiskAssessment.titleAndFullName = formatTitleAndFullName(basicDetails.title, basicDetails.name)

    const { mobileNumber, telephoneNumber, emailAddress, nationalInsuranceNumber } = basicDetails
    warrantRiskAssessment.emailAddress = emailAddress
    warrantRiskAssessment.mobileNumber = mobileNumber
    warrantRiskAssessment.telephoneNumber = telephoneNumber
    warrantRiskAssessment.nationalInsuranceNumber = nationalInsuranceNumber
    warrantRiskAssessment.dateOfBirth = `${basicDetails.dateOfBirth}T00:00:00`
    warrantRiskAssessment.lastHomeVisitDate = `${basicDetails.lastHomeVisitDate}T00:00:00`
    warrantRiskAssessment.basicDetailsSaved = true

    const contactsToDelete = existingContacts.filter(
      existingContact =>
        !basicDetails.employers.some(
          employer => employer.employerAddress.id === existingContact.contactLocation.deliusAddressId,
        ),
    )
    if (contactsToDelete.length > 0) {
      await warrantRiskAssessmentApiClient.batchDeleteContacts(contactsToDelete, res.locals.user.username)
    }

    const addressesToDelete = existingAddresses.filter(
      existingAddress => !otherAddresses.some(address => address.id === existingAddress.deliusAddressId),
    )
    if (addressesToDelete.length > 0) {
      await warrantRiskAssessmentApiClient.batchDeleteAddresses(addressesToDelete, res.locals.user.username)
    }

    const contactsToCreate: WarrantRiskAssessmentContact[] = basicDetails.employers
      .filter(
        employer => !existingContacts?.some(c => c.contactLocation.deliusAddressId === employer.employerAddress.id),
      )
      .map(employer => ({
        contactPerson: formatTitleAndFullName('', employer.employerName),
        contactLocation: toWarrantRiskAssessmentAddress(employer.employerAddress, '', warrantRiskAssessmentId),
        mobileNumber: employer.mobileNumber,
        telephoneNumber: employer.telephoneNumber,
        warrantRiskAssessmentId,
      }))

    if (contactsToCreate.length > 0) {
      await warrantRiskAssessmentApiClient.batchCreateContacts(contactsToCreate, res.locals.user.username)
    }

    const addressesToCreate = otherAddresses
      .filter(address => !existingAddresses?.some(existingAddress => existingAddress.deliusAddressId === address.id))
      .map(address => toWarrantRiskAssessmentAddress(address, 'basicDetails', warrantRiskAssessmentId))
    if (addressesToCreate.length > 0) {
      await warrantRiskAssessmentApiClient.batchCreateAddresses(addressesToCreate, res.locals.user.username)
    }

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
