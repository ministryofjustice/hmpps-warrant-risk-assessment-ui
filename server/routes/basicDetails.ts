import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import WarrantRiskAssessmentApiClient, { WarrantRiskAssessment } from '../data/warrantRiskAssessmentApiClient'
import { BasicDetails } from '../data/ndeliusIntegrationApiClient'

export default function basicDetailsRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
): Router {
  const currentPage = 'basic-details'

  router.get('/basic-details/:id', async (req, res) => {
    await auditService.logPageView(Page.BASIC_DETAILS, { who: res.locals.user.username, correlationId: req.id })
    const warrantRiskAssessmentApiClient = new WarrantRiskAssessmentApiClient(authenticationClient)

    const warrantRiskAssessmentId: string = req.params.id
    let warrantRiskAssessment: WarrantRiskAssessment = null
    const basicDetails: BasicDetails = null

    warrantRiskAssessment = await warrantRiskAssessmentApiClient.getWarrantRiskAssessmentById(
      warrantRiskAssessmentId,
      res.locals.user.username,
    )

    res.render('pages/basic-details', {
      warrantRiskAssessment,
      warrantRiskAssessmentId,
      basicDetails,
      currentPage,
    })
  })

  return router
}
