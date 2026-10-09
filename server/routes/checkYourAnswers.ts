import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { ZonedDateTime, ZoneId } from '@js-joda/core'
import AuditService, { Page } from '../services/auditService'
import CommonUtils from '../services/commonUtils'
import WarrantRiskAssessmentApiClient, {
  WarrantRiskAssessment,
  WarrantRiskAssessmentContact,
} from '../data/warrantRiskAssessmentApiClient'
import { toUserDate } from '../utils/dateUtils'

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
    const warrantRiskAssessment: WarrantRiskAssessment =
      await warrantRiskAssessmentApiClient.getWarrantRiskAssessmentById(
        warrantRiskAssessmentId,
        res.locals.user.username,
      )

    const existingAddresses = await warrantRiskAssessmentApiClient.getBasicDetailAddressess(
      warrantRiskAssessmentId,
      res.locals.user.username,
    )
    const employers: WarrantRiskAssessmentContact[] = await warrantRiskAssessmentApiClient.getContacts(
      warrantRiskAssessmentId,
      res.locals.user.username,
    )
    if (await commonUtils.redirectRequired(warrantRiskAssessment, warrantRiskAssessmentId, res, authenticationClient))
      return

    const dateOfBirth: string = toUserDate(warrantRiskAssessment.dateOfBirth)
    const lastHomeVisitDate: string = toUserDate(warrantRiskAssessment.lastHomeVisitDate)
    const reportValidated = validateReport(warrantRiskAssessment)

    res.render('pages/check-your-answers', {
      warrantRiskAssessment,
      warrantRiskAssessmentId,
      currentPage,
      dateOfBirth,
      lastHomeVisitDate,
      existingAddresses,
      employers,
      reportValidated,
    })
  })

  router.post('/check-your-answers/:id', async (req, res) => {
    await auditService.logPageView(Page.CHECK_YOUR_ANSWERS, { who: res.locals.user.username, correlationId: req.id })
    const warrantRiskAssessmentId: string = req.params.id
    const warrantRiskAssessmentApiClient = new WarrantRiskAssessmentApiClient(authenticationClient)
    const warrantRiskAssessment: WarrantRiskAssessment =
      await warrantRiskAssessmentApiClient.getWarrantRiskAssessmentById(
        warrantRiskAssessmentId,
        res.locals.user.username,
      )
    if (await commonUtils.redirectRequired(warrantRiskAssessment, warrantRiskAssessmentId, res, authenticationClient))
      return

    if (req.body.action === 'close') {
      res.send(
        `<p>You can now safely close this window</p><script nonce="${res.locals.cspNonce}">window.close()</script>`,
      )
    } else {
      warrantRiskAssessment.completedDate = ZonedDateTime.now(ZoneId.of('Europe/London'))
      warrantRiskAssessment.dateOfLetter = new Date().toISOString()
      await warrantRiskAssessmentApiClient.updateWarrantRiskAssessment(
        warrantRiskAssessmentId,
        warrantRiskAssessment,
        res.locals.user.username,
      )
      res.redirect(`/report-completed/${req.params.id}`)
    }
  })

  function validateReport(warrantRiskAssessment: WarrantRiskAssessment): boolean {
    return (
      warrantRiskAssessment.titleAndFullName?.trim().length > 0 &&
      warrantRiskAssessment.postalAddress != null &&
      warrantRiskAssessment.dateOfBirth != null &&
      warrantRiskAssessment.signOnOffice != null &&
      warrantRiskAssessment.subjectOfMappaProcedures != null &&
      warrantRiskAssessment.highRiskOfSelfHarm != null &&
      warrantRiskAssessment.highRiskOfAbsconding != null &&
      warrantRiskAssessment.vulnerable != null &&
      warrantRiskAssessment.carryOrUseWeapons != null &&
      warrantRiskAssessment.assaultingPolice != null &&
      warrantRiskAssessment.misuseDrugsAndAlcohol != null &&
      warrantRiskAssessment.riskToPublicLevel?.trim().length > 0 &&
      warrantRiskAssessment.riskToEnforcementOfficers?.trim().length > 0 &&
      warrantRiskAssessment.riskToPolice?.trim().length > 0 &&
      warrantRiskAssessment.responsibleOfficerFullName?.trim().length > 0 &&
      warrantRiskAssessment.probationArea?.trim().length > 0 &&
      warrantRiskAssessment.signature?.trim().length > 0
    )
  }

  return router
}
