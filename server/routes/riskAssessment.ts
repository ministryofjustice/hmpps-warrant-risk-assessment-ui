import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import WarrantRiskAssessmentApiClient, { WarrantRiskAssessment } from '../data/warrantRiskAssessmentApiClient'
import NDeliusIntegrationApiClient, { RiskAssessment } from '../data/ndeliusIntegrationApiClient'
import { ErrorMessages } from '../data/uiModels'
import { handleIntegrationErrors } from '../utils/utils'
import CommonUtils from '../services/commonUtils'
import AssessRiskAndNeedsApiClient, {
  AllRoshRisk,
  AssessmentNeeds,
  AssessmentOffence,
} from '../data/assessRiskAndNeedsApiClient'
import { toFullUserDate } from '../utils/dateUtils'

interface DisplayField {
  label: string
  value: string
}

export default function riskAssessmentRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
  commonUtils: CommonUtils,
): Router {
  const currentPage = 'risk-assessment'

  router.get('/risk-assessment/:id', async (req, res) => {
    await auditService.logPageView(Page.RISK_ASSESSMENT, { who: res.locals.user.username, correlationId: req.id })
    const warrantRiskAssessmentApiClient = new WarrantRiskAssessmentApiClient(authenticationClient)
    const ndeliusIntegrationApiClient = new NDeliusIntegrationApiClient(authenticationClient)
    const arnsApiClient = new AssessRiskAndNeedsApiClient(authenticationClient)
    const warrantRiskAssessmentId: string = req.params.id
    const callingScreen: string = req.query.returnTo as string
    let warrantRiskAssessment: WarrantRiskAssessment = null
    let arnsRiskAssessment: AllRoshRisk = null
    let arnsAssessmentOffence: AssessmentOffence = null
    let arnsNeeds: AssessmentNeeds = null
    let deliusRiskAssessment: RiskAssessment = null

    try {
      warrantRiskAssessment = await warrantRiskAssessmentApiClient.getWarrantRiskAssessmentById(
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
    } catch (error) {
      const errorMessages: ErrorMessages = handleIntegrationErrors(
        error?.responseStatus,
        error?.data?.userMessage,
        'Warrant Risk Assessment',
      )

      // Navigate to the detailed error page on 400
      if (error?.responseStatus === 400) {
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }

      // Navigate to the detailed error page on 404
      if (error?.responseStatus === 404) {
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }

      const showEmbeddedError = true
      res.render(`pages/risk-assessment`, { errorMessages, showEmbeddedError })
      return
    }

    try {
      arnsRiskAssessment = await arnsApiClient.getRisksFullText(warrantRiskAssessment.crn, res.locals.user.username)
      arnsAssessmentOffence = await arnsApiClient.getAssessmentOffences(
        warrantRiskAssessment.crn,
        res.locals.user.username,
      )
      arnsNeeds = await arnsApiClient.getNeeds(warrantRiskAssessment.crn, res.locals.user.username)
    } catch (error) {
      const errorMessages: ErrorMessages = handleIntegrationErrors(error.responseStatus, error.data?.message, 'ARNS')

      // take the user to detailed error page for 400 type errors
      if (error.responseStatus === 400) {
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }

      // stay on the current page for 500 errors
      if (error.responseStatus === 500) {
        const showEmbeddedError = true
        res.render(`pages/risk-assessment`, { errorMessages, showEmbeddedError })
        return
      }
      res.render(`pages/detailed-error`, { errorMessages })
      return
    }

    try {
      // get registration details from integration service
      deliusRiskAssessment = await ndeliusIntegrationApiClient.getRiskAssessment(
        warrantRiskAssessment.crn,
        res.locals.user.username,
      )
    } catch (error) {
      // get risk assessment from assess risk and needs service
      const errorMessages: ErrorMessages = handleIntegrationErrors(
        error.status,
        error.data?.message,
        'NDelius Integration',
      )
      // take the user to detailed error page for 400 type errors
      if (error.status === 400) {
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }
      // stay on the current page for 500 errors
      if (error.status === 500) {
        const showEmbeddedError = true
        res.render(`pages/information`, { errorMessages, showEmbeddedError })
        return
      }
      res.render(`pages/detailed-error`, { errorMessages })
      return
    }

    if (await commonUtils.redirectRequired(warrantRiskAssessment, warrantRiskAssessmentId, res, authenticationClient))
      return

    const mappaInfo = generateMappaInfo(deliusRiskAssessment)
    const mappaSelection = warrantRiskAssessment.subjectOfMappaProcedures ?? mappaInfo.length > 0
    const selfHarmInfo = generateSelfHarmInfo(arnsRiskAssessment)
    const selfHarmSelection = warrantRiskAssessment.highRiskOfSelfHarm ?? selfHarmInfo.length > 0
    const abscondingInfo = generateAbscondInfo(arnsRiskAssessment)
    const abscondingSelection = warrantRiskAssessment.highRiskOfAbsconding ?? selfHarmInfo.length > 0
    const vulnerableInfo = generateVulnerabilityInfo(arnsRiskAssessment)
    const vulnerableSelection = warrantRiskAssessment.vulnerable ?? selfHarmInfo.length > 0
    const weaponInfo = generateWeaponInfo(arnsAssessmentOffence)
    const weaponSelection = warrantRiskAssessment.carryOrUseWeapons ?? selfHarmInfo.length > 0
    const policeInfo = generatePoliceInfo(arnsRiskAssessment)
    const policeSelection = warrantRiskAssessment.assaultingPolice ?? selfHarmInfo.length > 0
    const drugInfo = generateDrugInformation(arnsNeeds)
    const drugSelection = warrantRiskAssessment.misuseDrugsAndAlcohol ?? selfHarmInfo.length > 0

    res.render('pages/risk-assessment', {
      warrantRiskAssessment,
      warrantRiskAssessmentId,
      currentPage,
      callingScreen,
      mappaInfo,
      mappaSelection,
      selfHarmInfo,
      selfHarmSelection,
      abscondingInfo,
      abscondingSelection,
      vulnerableInfo,
      vulnerableSelection,
      weaponInfo,
      weaponSelection,
      policeInfo,
      policeSelection,
      drugInfo,
      drugSelection,
    })
  })

  router.post('/risk-assessment/:id', async (req, res, next) => {
    await auditService.logPageView(Page.RISK_ASSESSMENT, { who: res.locals.user.username, correlationId: req.id })
    const warrantRiskAssessmentApiClient = new WarrantRiskAssessmentApiClient(authenticationClient)
    const warrantRiskAssessmentId: string = req.params.id
    const callingScreen: string = req.query.returnTo as string
    let warrantRiskAssessment: WarrantRiskAssessment = null

    try {
      warrantRiskAssessment = await warrantRiskAssessmentApiClient.getWarrantRiskAssessmentById(
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
    } catch (error) {
      const errorMessages: ErrorMessages = handleIntegrationErrors(
        error?.responseStatus,
        error?.data?.userMessage,
        'Warrant Risk Assessment',
      )

      // Navigate to the detailed error page on 400
      if (error?.responseStatus === 400) {
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }

      // Navigate to the detailed error page on 404
      if (error?.responseStatus === 404) {
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }

      const showEmbeddedError = true
      res.render(`pages/risk-assessment`, { errorMessages, showEmbeddedError })
      return
    }

    if (await commonUtils.redirectRequired(warrantRiskAssessment, warrantRiskAssessmentId, res, authenticationClient))
      return

    warrantRiskAssessment.subjectOfMappaProcedures = req.body.mappaRadio === 'Yes'
    warrantRiskAssessment.highRiskOfSelfHarm = req.body.selfHarmRadio === 'Yes'
    warrantRiskAssessment.highRiskOfAbsconding = req.body.abscondRadio === 'Yes'
    warrantRiskAssessment.vulnerable = req.body.vulnerableRadio === 'Yes'
    warrantRiskAssessment.carryOrUseWeapons = req.body.weaponRadio === 'Yes'
    warrantRiskAssessment.assaultingPolice = req.body.policeRadio === 'Yes'
    warrantRiskAssessment.misuseDrugsAndAlcohol = req.body.drugMisuseRadio === 'Yes'

    if (req.body.action === 'refreshFromNdelius') {
      // redirect to warning details to force a reload
      res.redirect(`/risk-assessment/${warrantRiskAssessmentId}`)
    } else {
      warrantRiskAssessment.riskAssessmentSaved = true
      await warrantRiskAssessmentApiClient.updateWarrantRiskAssessment(
        warrantRiskAssessmentId,
        warrantRiskAssessment,
        res.locals.user.username,
      )

      // if the user selected saveProgressAndClose then send a close back to the client
      if (req.body.action === 'saveProgressAndClose') {
        res.send(
          `<p>You can now safely close this window</p><script nonce="${res.locals.cspNonce}">window.close()</script>`,
        )
      } else if (callingScreen && callingScreen === 'check-your-report') {
        res.redirect(`/check-your-report/${req.params.id}`)
      } else {
        res.redirect(`/risk-summary/${warrantRiskAssessmentId}`)
      }
    }
  })

  function generateDrugInformation(needs: AssessmentNeeds): DisplayField[] {
    const drugAssessmentNeed = needs.identifiedNeeds?.find(need => need.section === 'DRUG_MISUSE')
    if (drugAssessmentNeed != null) {
      return [
        { label: 'Name', value: drugAssessmentNeed.name },
        { label: 'Risk of Harm', value: drugAssessmentNeed.riskOfHarm ? 'Yes' : 'No' },
        { label: 'Risk of Reoffending', value: drugAssessmentNeed.riskOfReoffending ? 'Yes' : 'No' },
        { label: 'Severity', value: drugAssessmentNeed.severity },
      ]
    }
    return []
  }

  function generatePoliceInfo(risks: AllRoshRisk): DisplayField[] {
    const risk = risks.summary?.riskInCommunity
    if (risk != null) {
      return [
        { label: 'Risk to Children', value: Object.entries(risk).find(([_, arr]) => arr.includes('Children'))?.[0] },
        {
          label: 'Risk to Known Adult',
          value: Object.entries(risk).find(([_, arr]) => arr.includes('Know adult'))?.[0],
        },
        { label: 'Risk to Prisoners', value: Object.entries(risk).find(([_, arr]) => arr.includes('Prisoners'))?.[0] },
        { label: 'Risk to Staff', value: Object.entries(risk).find(([_, arr]) => arr.includes('Staff'))?.[0] },
        { label: 'Risk to Public', value: Object.entries(risk).find(([_, arr]) => arr.includes('Public'))?.[0] },
      ]
    }
    return []
  }

  function generateWeaponInfo(offence: AssessmentOffence): DisplayField[] {
    if (offence.assessments != null) {
      const displayFieldList: DisplayField[] = []
      offence.assessments.forEach(assessment => {
        displayFieldList.push(
          { label: 'Pattern of offending', value: assessment.patternOfOffending },
          { label: 'Offence involved', value: assessment.offenceInvolved?.join(', ') },
          { label: 'Specific weapon', value: assessment.specificWeapon },
        )
      })
      return displayFieldList
    }
    return []
  }

  function generateVulnerabilityInfo(risks: AllRoshRisk): DisplayField[] {
    const vulnerability = risks.riskToSelf?.vulnerability
    if (vulnerability != null) {
      return [
        { label: 'Risk', value: vulnerability.risk },
        { label: 'Previous', value: vulnerability.previous },
        { label: 'Previous Concerns Notes', value: vulnerability.previousConcernsText },
        { label: 'Current', value: vulnerability.current },
        { label: 'Current Concerns Notes', value: vulnerability.currentConcernsText },
      ]
    }
    return []
  }

  function generateAbscondInfo(risks: AllRoshRisk): DisplayField[] {
    const abscond = risks.otherRisks?.escapeOrAbscond
    if (abscond != null) {
      return [{ label: 'Escape or Abscond risk', value: abscond }]
    }
    return []
  }

  function generateSelfHarmInfo(risks: AllRoshRisk): DisplayField[] {
    const selfHarm = risks.riskToSelf?.selfHarm
    if (selfHarm != null) {
      return [
        { label: 'Risk', value: selfHarm.risk },
        { label: 'Previous', value: selfHarm.previous },
        { label: 'Previous Concerns Notes', value: selfHarm.previousConcernsText },
        { label: 'Current', value: selfHarm.current },
        { label: 'Current Concerns Notes', value: selfHarm.currentConcernsText },
      ]
    }
    return []
  }

  function generateMappaInfo(riskAssessment: RiskAssessment): DisplayField[] {
    const { mappaRegistration } = riskAssessment
    if (mappaRegistration != null) {
      const formattedDate = toFullUserDate(mappaRegistration.startDate)
      return [
        { label: 'MAPPA Category', value: mappaRegistration.type?.description },
        { label: 'Date', value: formattedDate },
      ]
    }
    return []
  }

  return router
}
