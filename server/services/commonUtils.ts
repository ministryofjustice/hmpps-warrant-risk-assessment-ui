import { type Response } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { WarrantRiskAssessment } from '../data/warrantRiskAssessmentApiClient'
import NDeliusIntegrationApiClient, { LimitedAccessCheck } from '../data/ndeliusIntegrationApiClient'

export default class CommonUtils {
  async redirectRequired(
    warrantRiskAssessment: WarrantRiskAssessment,
    warrantRiskAssessmentId: string,
    res: Response,
    authenticationClient: AuthenticationClient,
  ): Promise<boolean> {
    if (warrantRiskAssessment.completedDate != null) {
      res.redirect(`/report-completed/${warrantRiskAssessmentId}`)
      return true
    }

    const ndeliusIntegrationApiClient = new NDeliusIntegrationApiClient(authenticationClient)

    const laoCheck: LimitedAccessCheck = await ndeliusIntegrationApiClient.getLimitedAccessCheck(
      warrantRiskAssessment.crn,
      res.locals.user.username,
    )
    if (laoCheck.userExcluded || laoCheck.userRestricted) {
      res.render('pages/limited-access', {
        laoCheck,
      })
      return true
    }

    return false
  }
}
