import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'
import { ErrorMessages } from '../data/uiModels'
import { handleIntegrationErrors } from '../utils/utils'
import WarrantRiskAssessmentApiClient from '../data/warrantRiskAssessmentApiClient'

export default function eventTerminatedRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
): Router {
  router.get('/event-terminated/:id', async (req, res) => {
    await auditService.logPageView(Page.EVENT_TERMINATED, { who: res.locals.user.username, correlationId: req.id })
    const { id } = req.params
    res.render('pages/event-terminated', { id, confirmScreen: false })
  })

  router.post('/event-terminated/:id', async (req, res) => {
    const warrantRiskAssessmentApiClient = new WarrantRiskAssessmentApiClient(authenticationClient)
    const { id } = req.params

    if (req.body.action === 'delete') {
      res.render('pages/event-terminated', { id, confirmScreen: true })
    } else if (req.body.action === 'cancel') {
      res.render('pages/event-terminated', { id, confirmScreen: false })
    } else if (req.body.action === 'confirm') {
      try {
        const warrantRiskAssessment = await warrantRiskAssessmentApiClient.getWarrantRiskAssessmentById(
          id as string,
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
        await warrantRiskAssessmentApiClient.deleteWarrantRiskAssessment(id as string, res.locals.user.username)
      } catch (error) {
        const errorMessages: ErrorMessages = handleIntegrationErrors(
          error.responseStatus,
          error.data?.message,
          'Warrant Risk Assessment',
        )
        const showEmbeddedError = true
        res.render(`pages/detailed-error`, { errorMessages, showEmbeddedError })
        return
      }
      res.redirect(`/form-deleted/${id}`)
    } else {
      res.send(
        `<p>You can now safely close this window</p><script nonce="${res.locals.cspNonce}">window.close()</script>`,
      )
    }
  })

  return router
}
