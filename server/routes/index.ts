import { Router } from 'express'
import type { Services } from '../services'
import basicDetailsRoutes from './basicDetails'
import reportCompletedRoutes from './reportCompleted'
import checkYourAnswersRoutes from "./checkYourAnswers";
import riskAssessmentRoutes from "./riskAssessment";
import riskSummaryRoutes from "./riskSummary";
import warrantExecutionRoutes from "./warrantExecution";

export default function routes({ auditService, hmppsAuthClient, commonUtils }: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    res.render('pages/index')
  })

  router.get('/warrant-risk-assessment/:id', async (req, res) => {
    res.redirect(`/basic-details/${req.params.id}`)
  })

  router.get('/close', async (req, res) => {
    res.send(
      `<p>You can now safely close this window</p><script nonce="${res.locals.cspNonce}">window.close()</script>`,
    )
  })

  basicDetailsRoutes(router, auditService, hmppsAuthClient, commonUtils)
  reportCompletedRoutes(router, auditService, hmppsAuthClient)
  riskAssessmentRoutes(router, auditService, hmppsAuthClient, commonUtils)
  riskSummaryRoutes(router, auditService, hmppsAuthClient, commonUtils)
  warrantExecutionRoutes(router, auditService, hmppsAuthClient, commonUtils)
  checkYourAnswersRoutes(router, auditService, hmppsAuthClient, commonUtils)

  return router
}
