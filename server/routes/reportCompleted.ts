import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'
import WarrantRiskAssessmentApiClient from '../data/warrantRiskAssessmentApiClient'

export default function reportCompletedRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
): Router {
  router.get('/report-completed/:id', async (req, res) => {
    await auditService.logPageView(Page.REPORT_COMPLETED, { who: res.locals.user.username, correlationId: req.id })
    const warrantRiskAssessmentId: string = req.params.id
    const warrantRiskAssessmentApiClient = new WarrantRiskAssessmentApiClient(authenticationClient)
    const warrantRisk = await warrantRiskAssessmentApiClient.getWarrantRiskAssessmentById(
      req.params.id,
      res.locals.user.username,
    )

    res.render('pages/report-completed', {
      warrantRisk,
      warrantRiskAssessmentId,
    })
  })
  return router
}
