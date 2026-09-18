import { type Response } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { WarrantRiskAssessment } from '../data/warrantRiskAssessmentApiClient'
import ProbationAccessControlApiClient, { LimitedAccessCheck } from '../data/probationAccessControlApiClient'

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

    const probationAccessControlApiClient = new ProbationAccessControlApiClient(authenticationClient)

    const laoCheck: LimitedAccessCheck = await probationAccessControlApiClient.getLimitedAccessCheck(
      warrantRiskAssessment.crn,
      res.locals.user.username,
    )
    if (laoCheck.userExcluded || laoCheck.userRestricted) {
      res.render('pages/limited-access', {
        laoCheck,
      })
      return true
    }

    if (warrantRiskAssessment.terminated === true) {
      res.redirect(`/event-terminated/${warrantRiskAssessmentId}`)
      return true
    }

    return false
  }
}
