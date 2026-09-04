import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'
import { ErrorMessages } from '../data/uiModels'
import { handleIntegrationErrors } from '../utils/utils'
import WarrantRiskAssessmentApiClient from '../data/warrantRiskAssessmentApiClient'

export default function pdfMaintenanceRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
): Router {
  router.get('/pdf/:id', async (req, res) => {
    await auditService.logPageView(Page.VIEW_PDF, { who: res.locals.user.username, correlationId: req.id })

    const warrantRiskAssessmentId: string = req.params.id

    const warrantRiskAssessmentApiClient = new WarrantRiskAssessmentApiClient(authenticationClient)
    const warrantRiskAssessment = await warrantRiskAssessmentApiClient.getWarrantRiskAssessmentById(req.params.id as string, res.locals.user.username)

    try {
      const stream: ArrayBuffer = await warrantRiskAssessmentApiClient.getPdfById(warrantRiskAssessmentId, res.locals.user.username)

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `filename="warrant_risk_assessment_form_${warrantRiskAssessment.crn}_draft.pdf"`)
      res.send(stream)
    } catch (error) {
      const errorMessages: ErrorMessages = handleIntegrationErrors(
        error.status,
        error.data?.message,
        'NDelius Integration',
      )

      res.render(`pages/pdf-generation-failed`, { errorMessages })
    }
  })

  return router
}
