import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import CommonUtils from '../services/commonUtils'
import '@js-joda/timezone'
import WarrantRiskAssessmentApiClient, {WarrantRiskAssessment} from "../data/warrantRiskAssessmentApiClient";

export default function riskAssessmentRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
  commonUtils: CommonUtils,
): Router {
  const currentPage = 'risk-assessment'

  router.get('/risk-assessment/:id', async (req, res) => {
    await auditService.logPageView(Page.RISK_ASSESSMENT, { who: res.locals.user.username, correlationId: req.id })
    const warrantRiskAssessmentId: string = req.params.id
    const warrantRiskAssessmentApiClient = new WarrantRiskAssessmentApiClient(authenticationClient)
    const warrantRiskAssessment: WarrantRiskAssessment = await warrantRiskAssessmentApiClient.getWarrantRiskAssessmentById(
      warrantRiskAssessmentId,
      res.locals.user.username,
    )
    if (await commonUtils.redirectRequired(warrantRiskAssessment, warrantRiskAssessmentId, res, authenticationClient)) return

    res.render('pages/risk-assessment', {
      warrantRiskAssessment,
      warrantRiskAssessmentId,
      currentPage,
    })
  })

  return router
}
