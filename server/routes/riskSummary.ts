import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import CommonUtils from '../services/commonUtils'
import '@js-joda/timezone'
import WarrantRiskAssessmentApiClient, { WarrantRiskAssessment } from '../data/warrantRiskAssessmentApiClient'
import AssessRiskAndNeedsApiClient, { AllRoshRisk } from '../data/assessRiskAndNeedsApiClient'
import { ErrorMessages } from '../data/uiModels'
import { handleIntegrationErrors } from '../utils/utils'

interface DisplayField {
  label: string
  value: string
}

export default function riskSummaryRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
  commonUtils: CommonUtils,
): Router {
  const currentPage = 'risk-summary'

  router.get('/risk-summary/:id', async (req, res) => {
    await auditService.logPageView(Page.RISK_SUMMARY, { who: res.locals.user.username, correlationId: req.id })
    const warrantRiskAssessmentId: string = req.params.id
    const warrantRiskAssessmentApiClient = new WarrantRiskAssessmentApiClient(authenticationClient)
    const arnsApiClient = new AssessRiskAndNeedsApiClient(authenticationClient)
    const callingScreen: string = req.query.returnTo as string
    let warrantRiskAssessment: WarrantRiskAssessment = null
    let arnsRiskAssessment: AllRoshRisk = null

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
      res.render(`pages/risk-assessment`, { errorMessages, showEmbeddedError })
      return
    }

    try {
      arnsRiskAssessment = await arnsApiClient.getRisks(warrantRiskAssessment.crn, res.locals.user.username)
    } catch (error) {
      const errorMessages: ErrorMessages = handleIntegrationErrors(error.responseStatus, error.data?.message, 'ARNS')

      // take the user to detailed error page for 400 type errors
      if (error.responseStatus === 400) {
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }

      // stay on the current page for 500 errors
      if (error.responseStatus === 500) {
        const showEmbeddedError = true
        res.render(`pages/risk-assessment`, { errorMessages, showEmbeddedError })
        return
      }
      res.render(`pages/detailed-error`, { errorMessages })
      return
    }

    if (await commonUtils.redirectRequired(warrantRiskAssessment, warrantRiskAssessmentId, res, authenticationClient))
      return

    const publicInfo = generatePublicInfo(arnsRiskAssessment)
    const staffInfo = generateStaffInfo(arnsRiskAssessment)
    const publicSelection = warrantRiskAssessment.riskToPublicLevel
    const officerSelection = warrantRiskAssessment.riskToEnforcementOfficers
    const policeSelection = warrantRiskAssessment.riskToPolice

    res.render('pages/risk-summary', {
      warrantRiskAssessment,
      warrantRiskAssessmentId,
      currentPage,
      publicInfo,
      staffInfo,
      publicSelection,
      officerSelection,
      policeSelection,
      callingScreen,
    })
  })

  router.post('/risk-summary/:id', async (req, res, next) => {
    await auditService.logPageView(Page.RISK_SUMMARY, { who: res.locals.user.username, correlationId: req.id })
    const warrantRiskAssessmentId: string = req.params.id
    const warrantRiskAssessmentApiClient = new WarrantRiskAssessmentApiClient(authenticationClient)
    const callingScreen: string = req.query.returnTo as string
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
      res.render(`pages/risk-assessment`, { errorMessages, showEmbeddedError })
      return
    }

    if (await commonUtils.redirectRequired(warrantRiskAssessment, warrantRiskAssessmentId, res, authenticationClient))
      return

    warrantRiskAssessment.riskToPublicLevel = req.body.publicRadio
    warrantRiskAssessment.riskToEnforcementOfficers = req.body.officerRadio
    warrantRiskAssessment.riskToPolice = req.body.policeRadio
    warrantRiskAssessment.riskSummarySaved = true

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
        res.redirect(`/warrant-execution/${warrantRiskAssessmentId}`)
      }
    } catch (error) {
      const errorMessages: ErrorMessages = handleIntegrationErrors(
        error?.responseStatus,
        error?.data?.userMessage,
        'Warrant Risk Assessment',
      )
      const showEmbeddedError = true
      res.render(`pages/risk-summary`, { errorMessages, showEmbeddedError })
    }
  })

  function generateStaffInfo(risks: AllRoshRisk): DisplayField[] {
    const risk = risks.summary?.riskInCommunity
    if (risk != null) {
      return [
        {
          label: 'Risk to Known Adult',
          value: Object.entries(risk).find(([_, arr]) => arr.includes('Know adult'))?.[0],
        },
        { label: 'Risk to Prisoners', value: Object.entries(risk).find(([_, arr]) => arr.includes('Prisoners'))?.[0] },
        { label: 'Risk to Staff', value: Object.entries(risk).find(([_, arr]) => arr.includes('Staff'))?.[0] },
      ]
    }
    return []
  }

  function generatePublicInfo(risks: AllRoshRisk): DisplayField[] {
    const risk = risks.summary?.riskInCommunity
    if (risk != null) {
      return [
        { label: 'Risk to Children', value: Object.entries(risk).find(([_, arr]) => arr.includes('Children'))?.[0] },
        {
          label: 'Risk to Known Adult',
          value: Object.entries(risk).find(([_, arr]) => arr.includes('Know adult'))?.[0],
        },
        { label: 'Risk to Prisoners', value: Object.entries(risk).find(([_, arr]) => arr.includes('Prisoners'))?.[0] },
        { label: 'Risk to Staff', value: Object.entries(risk).find(([_, arr]) => arr.includes('Staff'))?.[0] },
        { label: 'Risk to Public', value: Object.entries(risk).find(([_, arr]) => arr.includes('Public'))?.[0] },
      ]
    }
    return []
  }

  return router
}
