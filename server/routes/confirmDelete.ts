import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'
import { ErrorMessages } from '../data/uiModels'
import { handleIntegrationErrors } from '../utils/utils'
import WarrantRiskAssessmentApiClient from '../data/warrantRiskAssessmentApiClient'

export default function confirmDeleteRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
): Router {
  router.get('/confirm-delete/:id', async (req, res) => {
    await auditService.logPageView(Page.CONFIRM_DELETE, { who: res.locals.user.username, correlationId: req.id })
    const warrantRiskAssessmentId: string = req.params.id
    res.render('pages/confirm-delete', { warrantRiskAssessmentId })
  })

  router.post('/confirm-delete/:id', async (req, res) => {
    const warrantRiskAssessmentApiClient = new WarrantRiskAssessmentApiClient(authenticationClient)
    const warrantRiskAssessmentId: string = req.params.id

    if (req.body.action === 'confirm') {
      try {
        const warrantRiskAssessment = await warrantRiskAssessmentApiClient.getWarrantRiskAssessmentById(
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
        await warrantRiskAssessmentApiClient.deleteWarrantRiskAssessment(
          warrantRiskAssessmentId,
          res.locals.user.username,
        )
      } catch (error) {
        const errorMessages: ErrorMessages = handleIntegrationErrors(
          error.status,
          error.data?.message,
          'Warrant Risk Assessment',
        )
        const showEmbeddedError = true
        // take the user to detailed error page for 404
        if (error.responseStatus === 404 || error.status === 404) {
          res.render(`pages/detailed-error`, { errorMessages })
          return
        }
        res.render(`pages/confirm-delete`, { errorMessages, showEmbeddedError })
        return
      }
      res.redirect(`/form-deleted/${warrantRiskAssessmentId}`)
    } else {
      res.redirect(`/check-your-answers/${warrantRiskAssessmentId}`)
    }
  })

  return router
}
