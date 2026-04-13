import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import WarrantRiskAssessmentApiClient , { WarrantRiskAssessment } from '../data/warrantRiskAssessmentApiClient'
import NDeliusIntegrationApiClient, { BasicDetails } from '../data/ndeliusIntegrationApiClient'
import CommonUtils from '../services/commonUtils'

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

    warrantRiskAssessment = await warrantRiskAssessmentApiClient.getWarrantRiskAssessmentById(warrantRiskAssessmentId, res.locals.user.username)

    res.render('pages/basic-details', {
      warrantRiskAssessment,
      warrantRiskAssessmentId,
      basicDetails,
      currentPage,
    })
  })

  return router
}
