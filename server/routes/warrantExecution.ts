import { Request, Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import CommonUtils from '../services/commonUtils'
import '@js-joda/timezone'
import WarrantRiskAssessmentApiClient, { WarrantRiskAssessment } from '../data/warrantRiskAssessmentApiClient'
import { ErrorMessages, SelectItem } from '../data/uiModels'
import {
  arrangeSelectItemListAlphabetically,
  formatAddressForSelectMenuDisplay,
  formatTitleAndFullName,
  handleIntegrationErrors,
  toWarrantRiskAssessmentAddress,
} from '../utils/utils'
import NDeliusIntegrationApiClient, {
  DeliusAddress,
  SignAndSendDetails,
  UserDetails,
} from '../data/ndeliusIntegrationApiClient'
import { toFullUserDate } from '../utils/dateUtils'

type WorkAddressContext = {
  warrantRiskAssessment: WarrantRiskAssessment
  alternateAddressOptions: SelectItem[]
  addressNotAvailable: boolean
  manualAddressAllowed: boolean
  onlyAlternateAddressesAvailable: boolean
  errorMessages: ErrorMessages
}

export default function warrantExecutionRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
  commonUtils: CommonUtils,
): Router {
  const currentPage = 'warrant-execution'

  router.get('/warrant-execution/:id', async (req, res) => {
    await auditService.logPageView(Page.WARRANT_EXECUTION, { who: res.locals.user.username, correlationId: req.id })
    const warrantRiskAssessmentId: string = req.params.id
    const warrantRiskAssessmentApiClient = new WarrantRiskAssessmentApiClient(authenticationClient)
    const ndeliusIntegrationApiClient = new NDeliusIntegrationApiClient(authenticationClient)
    const callingScreen: string = req.query.returnTo as string
    let warrantRiskAssessment: WarrantRiskAssessment = null
    let signAndSendDetails: SignAndSendDetails = null
    let errorMessages: ErrorMessages = {}

    try {
      warrantRiskAssessment = await warrantRiskAssessmentApiClient.getWarrantRiskAssessmentById(
        warrantRiskAssessmentId,
        res.locals.user.username,
      )
      if (Object.keys(warrantRiskAssessment).length === 0) {
        errorMessages.genericErrorMessage = {
          text: 'The document has not been found or has been deleted. An error has been logged. 404',
        }
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }
    } catch (error) {
      errorMessages = handleIntegrationErrors(
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
      res.render(`pages/risk-assessment`, { errorMessages, showEmbeddedError })
      return
    }

    if (await commonUtils.redirectRequired(warrantRiskAssessment, warrantRiskAssessmentId, res, authenticationClient))
      return

    try {
      signAndSendDetails = await ndeliusIntegrationApiClient.getResponsibleOfficerDetails(
        warrantRiskAssessment.crn,
        res.locals.user.username,
      )
    } catch (error) {
      errorMessages = handleIntegrationErrors(error.responseStatus, error.data?.message, 'NDelius Integration')

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

    // always use number from NDelius if available and fall back to saved one
    if (signAndSendDetails?.telephoneNumber != null) {
      warrantRiskAssessment.responsibleOfficerTelephoneNumer = signAndSendDetails.telephoneNumber
    }
    if (signAndSendDetails?.name != null) {
      warrantRiskAssessment.responsibleOfficerFullName = formatTitleAndFullName('', signAndSendDetails.name)
    }
    if (signAndSendDetails?.probationArea != null) {
      warrantRiskAssessment.probationArea = signAndSendDetails.probationArea.description
    }

    const {
      warrantRiskAssessment: preparedWarrantRiskAssessment,
      errorMessages: preparedErrorMessages,
      ...workAddressContext
    } = await prepareWorkAddressContext(
      warrantRiskAssessment,
      signAndSendDetails,
      warrantRiskAssessmentId,
      warrantRiskAssessmentApiClient,
      res.locals.user.username,
      errorMessages,
    )
    warrantRiskAssessment = preparedWarrantRiskAssessment
    errorMessages = preparedErrorMessages

    const executedBy: string =
      warrantRiskAssessment.subjectOfMappaProcedures ||
      warrantRiskAssessment.highRiskOfSelfHarm ||
      warrantRiskAssessment.highRiskOfAbsconding ||
      warrantRiskAssessment.vulnerable
        ? 'Police Officer'
        : 'Enforcement Officer'

    res.render('pages/warrant-execution', {
      warrantRiskAssessment,
      warrantRiskAssessmentId,
      currentPage,
      callingScreen,
      executedBy,
      errorMessages,
      ...workAddressContext,
      signAndSendDetails,
    })
  })

  router.post('/warrant-execution/:id', async (req, res) => {
    await auditService.logPageView(Page.WARRANT_EXECUTION, { who: res.locals.user.username, correlationId: req.id })
    const warrantRiskAssessmentId: string = req.params.id
    const warrantRiskAssessmentApiClient = new WarrantRiskAssessmentApiClient(authenticationClient)
    const ndeliusIntegrationApiClient = new NDeliusIntegrationApiClient(authenticationClient)
    const callingScreen: string = req.query.returnTo as string
    let warrantRiskAssessment: WarrantRiskAssessment = null
    let signAndSendDetails: SignAndSendDetails = null
    let errorMessages: ErrorMessages = {}

    try {
      warrantRiskAssessment = await warrantRiskAssessmentApiClient.getWarrantRiskAssessmentById(
        warrantRiskAssessmentId,
        res.locals.user.username,
      )
      if (Object.keys(warrantRiskAssessment).length === 0) {
        errorMessages.genericErrorMessage = {
          text: 'The document has not been found or has been deleted. An error has been logged. 404',
        }
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }
    } catch (error) {
      errorMessages = handleIntegrationErrors(
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
      res.render(`pages/risk-assessment`, { errorMessages, showEmbeddedError })
      return
    }

    if (await commonUtils.redirectRequired(warrantRiskAssessment, warrantRiskAssessmentId, res, authenticationClient))
      return

    try {
      signAndSendDetails = await ndeliusIntegrationApiClient.getResponsibleOfficerDetails(
        warrantRiskAssessment.crn,
        res.locals.user.username,
      )
    } catch (error) {
      errorMessages = handleIntegrationErrors(error.responseStatus, error.data?.message, 'NDelius Integration')

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

    if (req.body.action === 'clear-signature') {
      warrantRiskAssessment.signature = null
      warrantRiskAssessment.sheetSentBy = null
      await warrantRiskAssessmentApiClient.updateWarrantRiskAssessment(
        req.params.id,
        warrantRiskAssessment,
        res.locals.user.username,
      )
      res.redirect(`/warrant-execution/${req.params.id}`)
    } else if (req.body.action === 'sign') {
      if (req.body.whoIsSendingTheForm != null) {
        warrantRiskAssessment.sheetSentBy = req.body.whoIsSendingTheForm
        warrantRiskAssessment.signature = createSignatureString(
          signAndSendDetails.userDetails,
          req.body.whoIsSendingTheForm,
        )
        await warrantRiskAssessmentApiClient.updateWarrantRiskAssessment(
          req.params.id,
          warrantRiskAssessment,
          res.locals.user.username,
        )
        res.redirect(`/warrant-execution/${req.params.id}`)
      } else {
        errorMessages.sentByResponsibleOfficerOrUser = {
          text: 'Please select who is sending this document before pressing "Sign Now"',
        }

        if (signAndSendDetails?.telephoneNumber != null) {
          warrantRiskAssessment.responsibleOfficerTelephoneNumer = signAndSendDetails.telephoneNumber
        }
        if (signAndSendDetails?.name != null) {
          warrantRiskAssessment.responsibleOfficerFullName = formatTitleAndFullName('', signAndSendDetails.name)
        }
        if (signAndSendDetails?.probationArea != null) {
          warrantRiskAssessment.probationArea = signAndSendDetails.probationArea.description
        }

        const {
          warrantRiskAssessment: preparedWarrantRiskAssessment,
          errorMessages: preparedErrorMessages,
          ...workAddressContext
        } = await prepareWorkAddressContext(
          warrantRiskAssessment,
          signAndSendDetails,
          warrantRiskAssessmentId,
          warrantRiskAssessmentApiClient,
          res.locals.user.username,
          errorMessages,
        )
        warrantRiskAssessment = preparedWarrantRiskAssessment
        errorMessages = preparedErrorMessages

        const executedBy: string =
          warrantRiskAssessment.subjectOfMappaProcedures ||
          warrantRiskAssessment.highRiskOfSelfHarm ||
          warrantRiskAssessment.highRiskOfAbsconding ||
          warrantRiskAssessment.vulnerable
            ? 'Police Officer'
            : 'Enforcement Officer'

        res.render('pages/warrant-execution', {
          warrantRiskAssessment,
          warrantRiskAssessmentId,
          currentPage,
          callingScreen,
          executedBy,
          errorMessages,
          ...workAddressContext,
          signAndSendDetails,
        })
      }
    } else {
      if (signAndSendDetails?.telephoneNumber != null) {
        warrantRiskAssessment.responsibleOfficerTelephoneNumer = signAndSendDetails.telephoneNumber
      }
      if (signAndSendDetails?.name != null) {
        warrantRiskAssessment.responsibleOfficerFullName = formatTitleAndFullName('', signAndSendDetails.name)
      }
      if (signAndSendDetails?.probationArea != null) {
        warrantRiskAssessment.probationArea = signAndSendDetails.probationArea.description
      }

      const { warrantRiskAssessment: preparedWarrantRiskAssessment, errorMessages: preparedErrorMessages } =
        await prepareWorkAddressContext(
          warrantRiskAssessment,
          signAndSendDetails,
          warrantRiskAssessmentId,
          warrantRiskAssessmentApiClient,
          res.locals.user.username,
          errorMessages,
        )
      warrantRiskAssessment = preparedWarrantRiskAssessment
      errorMessages = preparedErrorMessages

      warrantRiskAssessment = handleSelectedAddress(warrantRiskAssessment, signAndSendDetails, req)

      warrantRiskAssessment.warrantExecutedBy =
        warrantRiskAssessment.subjectOfMappaProcedures ||
        warrantRiskAssessment.highRiskOfSelfHarm ||
        warrantRiskAssessment.highRiskOfAbsconding ||
        warrantRiskAssessment.vulnerable
          ? 'Police Officer'
          : 'Enforcement Officer'

      warrantRiskAssessment.signAndSendSaved = true

      try {
        await warrantRiskAssessmentApiClient.updateWarrantRiskAssessment(
          req.params.id,
          warrantRiskAssessment,
          res.locals.user.username,
        )
        if (req.body.action === 'saveProgressAndClose') {
          res.send(
            `<p>You can now safely close this window</p><script nonce="${res.locals.cspNonce}">window.close()</script>`,
          )
        } else if (callingScreen && callingScreen === 'check-your-answers') {
          res.redirect(`/check-your-answers/${req.params.id}`)
        } else {
          res.redirect(`/check-your-answers/${warrantRiskAssessmentId}`)
        }
      } catch (error) {
        errorMessages = handleIntegrationErrors(
          error?.responseStatus,
          error?.data?.userMessage,
          'Warrant Risk Assessment',
        )
        const showEmbeddedError = true
        res.render(`pages/warrant-execution`, { errorMessages, showEmbeddedError })
      }
    }
  })

  function addressListToSelectItemList(
    addresses: DeliusAddress[],
    breachNoticeSaved: boolean,
    selectedAddressId: number,
  ): SelectItem[] {
    const returnAddressList: SelectItem[] = [
      {
        text: 'Please Select',
        value: '-1',
        selected: true,
      },
    ]
    if (addresses) {
      const orderedAddressList: SelectItem[] = arrangeSelectItemListAlphabetically(
        addresses.map(address => ({
          text: formatAddressForSelectMenuDisplay(address),
          value: `${address.id}`,
          selected: breachNoticeSaved && address.id === selectedAddressId,
        })),
      )

      returnAddressList.push(...orderedAddressList)
    }

    return returnAddressList
  }

  async function prepareWorkAddressContext(
    warrantRiskAssessment: WarrantRiskAssessment,
    signAndSendDetails: SignAndSendDetails,
    warrantRiskAssessmentId: string,
    warrantRiskAssessmentApiClient: WarrantRiskAssessmentApiClient,
    username: string,
    errorMessages: ErrorMessages,
  ): Promise<WorkAddressContext> {
    let updatedWarrantRiskAssessment = warrantRiskAssessment
    let updatedErrorMessages = errorMessages
    let onlyAlternateAddressesAvailable = false
    if (updatedWarrantRiskAssessment.workAddress == null && signAndSendDetails?.replyAddress != null) {
      const defaultAddress = signAndSendDetails.replyAddress.find(record => record.status === 'Default')

      if (defaultAddress) {
        updatedWarrantRiskAssessment = {
          ...updatedWarrantRiskAssessment,
          workAddress: toWarrantRiskAssessmentAddress(defaultAddress, 'warrantExecution', warrantRiskAssessmentId),
        }
      } else if (signAndSendDetails.replyAddress.length > 0) {
        // If no default exists, UI offers the alternate address list only.
        onlyAlternateAddressesAvailable = true
      }
    }

    let addressNotAvailable = false
    if (
      updatedWarrantRiskAssessment.workAddress != null &&
      updatedWarrantRiskAssessment.workAddress.deliusAddressId != null &&
      signAndSendDetails?.replyAddress != null
    ) {
      const addressPresent = signAndSendDetails.replyAddress.find(
        record => record.id === updatedWarrantRiskAssessment.workAddress?.deliusAddressId,
      )
      if (addressPresent == null) {
        updatedWarrantRiskAssessment = {
          ...updatedWarrantRiskAssessment,
          workAddress: null,
        }
        addressNotAvailable = true
        await warrantRiskAssessmentApiClient.updateWarrantRiskAssessment(
          warrantRiskAssessmentId,
          updatedWarrantRiskAssessment,
          username,
        )

        updatedErrorMessages = {
          ...updatedErrorMessages,
          missingPreviouslySelectedAddress: {
            text: 'Work Location and Address: The previously selected address is no longer available. Please select an alternative.',
          },
        }
      }
    }

    const manualAddressAllowed =
      signAndSendDetails?.replyAddress == null || signAndSendDetails.replyAddress.length === 0

    const alternateAddressOptions = addressListToSelectItemList(
      signAndSendDetails?.replyAddress,
      updatedWarrantRiskAssessment.basicDetailsSaved,
      updatedWarrantRiskAssessment.workAddress?.deliusAddressId,
    )

    return {
      warrantRiskAssessment: updatedWarrantRiskAssessment,
      alternateAddressOptions,
      addressNotAvailable,
      manualAddressAllowed,
      onlyAlternateAddressesAvailable,
      errorMessages: updatedErrorMessages,
    }
  }

  function handleSelectedAddress(
    warrantRiskAssessment: WarrantRiskAssessment,
    signAndSendDetails: SignAndSendDetails,
    req: Request,
  ): WarrantRiskAssessment {
    const selectedAddress = getSelectedAddress(signAndSendDetails.replyAddress, req.body.alternateAddress)
    if (selectedAddress) {
      return {
        ...warrantRiskAssessment,
        workAddress: toWarrantRiskAssessmentAddress(selectedAddress, 'warrantExecution', req.params.id.toString()),
      }
    }
    return warrantRiskAssessment
  }

  function createSignatureString(currentUserDetails: UserDetails, formSentBy: string): string {
    let signature: string = ''
    if (currentUserDetails != null) {
      signature += currentUserDetails.forenames
      signature += ` ${currentUserDetails.surname} ${toFullUserDate(new Date().toISOString())}`
    }

    if (formSentBy === 'responsibleOfficer') {
      signature += ` (Responsible Officer)`
    }

    if (formSentBy === 'userOnBehalf') {
      signature += ` (User on behalf of the Responsible Officer)`
    }

    return signature
  }

  function getSelectedAddress(addressList: DeliusAddress[], addressIdentifier: string): DeliusAddress {
    if (addressIdentifier && addressIdentifier.length > 0) {
      const addressIdentifierNumber: number = +addressIdentifier
      if (addressList && Object.keys(addressList).length > 0) {
        return addressList.find(address => address.id === addressIdentifierNumber)
      }

      return null
    }
    return null
  }

  return router
}
