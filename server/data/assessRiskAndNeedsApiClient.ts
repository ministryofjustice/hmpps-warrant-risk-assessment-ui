import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'

export default class AssessRiskAndNeedsApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('NDelius Integration API', config.apis.assessRisksAndNeeds, logger, authenticationClient)
  }

  async getRisksFullText(crn: string, username: string): Promise<AllRoshRisk> {
    return this.get(
      {
        path: `/risks/crn/${crn}/fulltext`,
      },
      asSystem(username),
    )
  }

  async getAssessmentOffences(crn: string, username: string): Promise<AssessmentOffence> {
    return this.get(
      {
        path: `/assessments/crn/${crn}/offence`,
      },
      asSystem(username),
    )
  }

  async getNeeds(crn: string, username: string): Promise<AssessmentNeeds> {
    return this.get(
      {
        path: `/needs/crn/${crn}`,
      },
      asSystem(username),
    )
  }
}

export interface AssessmentNeeds {
  identifiedNeeds: AssessmentNeed[]
  notIdentifiedNeeds: AssessmentNeed[]
  unansweredNeeds: AssessmentNeed[]
  assessedOn?: string
}

export interface AssessmentNeed {
  section: string
  name: string
  riskOfHarm: boolean
  riskOfReoffending: boolean
  severity: string
  score: number
  oasysThreshold: number
  tierThreshold: number
}

export interface AssessmentOffence {
  crn: string
  limitedAccessOffender: boolean
  assessments: Assessment[]
}

export interface Assessment {
  assessmentId: number
  assessmentType: string
  partcompStatus: string
  dateCompleted: string
  initiationDate: string
  assessorSignedDate: string
  assessmentStatus: string
  superStatus: string
  offence: string
  disinhibitors: string[]
  patternOfOffending: string
  offenceInvolved: string[]
  specificWeapon: string
  victimPerpetratorRelationship: string
  victimOtherInfo: string
  evidencedMotivations: string[]
  offenceDetails: OffenceDetail[]
  victimDetails: VictimDetail[]
  laterWIPAssessmentExists: boolean
  latestWIPDate: string
  laterSignLockAssessmentExists: boolean
  latestSignLockDate: string
  laterPartCompUnsignedAssessmentExists: boolean
  latestPartCompUnsignedDate: string
  laterPartCompSignedAssessmentExists: boolean
  latestPartCompSignedDate: string
  laterCompleteAssessmentExists: boolean
  latestCompleteDate: string
}

export interface OffenceDetail {
  type: string
  offenceDate: string
  offenceCode: string
  offenceSubCode: string
  offence: string
  subOffence: string
}

export interface VictimDetail {
  age: string
  gender: string
  ethnicCategory: string
  victimRelation: string
}

export interface AllRoshRisk {
  riskToSelf: RoshRiskToSelf
  otherRisks: OtherRoshRisks
  summary: RiskRoshSummary
  assessedOn?: string
}

export interface OtherRoshRisks {
  escapeOrAbscond?: Response
  controlIssuesDisruptiveBehaviour?: Response
  breachOfTrust?: Response
  riskToOtherPrisoners?: Response
  assessedOn?: string
}

export interface RoshRiskToSelf {
  suicide?: Risk
  selfHarm?: Risk
  custody?: Risk
  hostelSetting?: Risk
  vulnerability?: Risk
  assessedOn?: string
}

export interface RiskRoshSummary {
  whoIsAtRisk?: string
  natureOfRisk?: string
  riskImminence?: string
  riskIncreaseFactors?: string
  riskMitigationFactors?: string
  analysisOfRiskFactors?: string
  riskInCommunity?: Partial<Record<RiskLevel, string[]>>
  riskInCustody?: Partial<Record<RiskLevel, string[]>>
  assessedOn?: string
  overallRiskLevel?: RiskLevel
}

export interface Risk {
  risk?: Response
  previous?: Response
  previousConcernsText?: string
  current?: Response
  currentConcernsText?: string
}

export enum Response {
  YES = 'YES',
  NO = 'NO',
  DK = "DON'T KNOW",
  NA = 'N/A',
}

export enum RiskLevel {
  VERY_HIGH = 'Very High',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}
