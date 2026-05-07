import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import CommonUtils from '../services/commonUtils'
import '@js-joda/timezone'
import WarrantRiskAssessmentApiClient, {WarrantRiskAssessment} from "../data/warrantRiskAssessmentApiClient";

export default function checkYourAnswersRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
  commonUtils: CommonUtils,
): Router {
  const currentPage = 'check-your-answers'

  router.get('/check-your-answers/:id', async (req, res) => {
    await auditService.logPageView(Page.CHECK_YOUR_ANSWERS, { who: res.locals.user.username, correlationId: req.id })
    const warrantRiskAssessmentId: string = req.params.id
    const warrantRiskAssessmentApiClient = new WarrantRiskAssessmentApiClient(authenticationClient)
    const warrantRiskAssessment: WarrantRiskAssessment = await warrantRiskAssessmentApiClient.getWarrantRiskAssessmentById(
      warrantRiskAssessmentId,
      res.locals.user.username,
    )
    if (await commonUtils.redirectRequired(warrantRiskAssessment, warrantRiskAssessmentId, res, authenticationClient)) return

    res.render('pages/check-your-answers', {
      warrantRiskAssessment,
      warrantRiskAssessmentId,
      currentPage,
    })
  })

  return router
}
