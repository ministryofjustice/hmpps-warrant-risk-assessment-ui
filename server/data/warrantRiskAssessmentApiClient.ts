import { ZonedDateTime } from '@js-joda/core'
import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'

export default class WarrantRiskAssessmentApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Warrant Risk Assessment API', config.apis.warrantRiskAssessment, logger, authenticationClient)
  }

  async getWarrantRiskAssessmentById(uuid: string, username: string): Promise<WarrantRiskAssessment> {
    return this.get(
      {
        path: `/warrant-risk-assessment/${uuid}`,
      },
      asSystem(username),
    )
  }

  async updateWarrantRiskAssessment(
    id: string,
    warrantRiskAssessment: WarrantRiskAssessment,
    username: string,
  ): Promise<WarrantRiskAssessment> {
    return this.put(
      {
        path: `/warrant-risk-assessment/${id}`,
        data: warrantRiskAssessment as unknown as Record<string, unknown>,
      },
      asSystem(username),
    )
  }

  async deleteWarrantRiskAssessment(warrantRiskAssessmentId: string, username: string) {
    return this.delete(
      {
        path: `/warrant-risk-assessment/${warrantRiskAssessmentId}`,
      },
      asSystem(username),
    )
  }

  async getPdfById(uuid: string, username: string): Promise<ArrayBuffer> {
    return this.get(
      {
        path: `/warrant-risk-assessment/${uuid}/pdf`,
        responseType: 'arraybuffer',
      },
      asSystem(username),
    )
  }
}

export interface WarrantRiskAssessment {
  crn: string
  completedDate: ZonedDateTime
  signOnOffice: WarrantRiskAssessmentAddress
  titleAndFullName: string
  dateOfLetter: string
  sheetSentBy: string
  telephoneNumber: string
  signature: string
  nationalInsuranceNumber: string
  probationArea: string
  riskToPublicLevel: string
  riskToEnforcementOfficers: string
  riskToPolice: string
  warrantExecutedBy: string
  subjectOfMappaProcedures: boolean
  highRiskOfSelfHarm: boolean
  highRiskOfAbsconding: boolean
  vulnerable: boolean
  carryOrUseWeapons: boolean
  assaultingPolice: boolean
  misuseDrugsAndAlcohol: boolean
  postalAddress: WarrantRiskAssessmentAddress
  dateOfBirth: string
  prisonNumber: string
  workAddress: WarrantRiskAssessmentAddress
  basicDetailsSaved: boolean
  signAndSendSaved: boolean
  contactSaved: boolean
  reviewRequiredDate: ZonedDateTime
  reviewEvent: string
  mobileNumber: string
  emailAddress: string
  lastHomeVisitDate: string
}

export interface WarrantRiskAssessmentAddress {
  id?: string
  deliusAddressId: number
  status: string
  officeDescription?: string
  buildingName: string
  buildingNumber: string
  streetName: string
  townCity: string
  district: string
  county: string
  postcode: string
}
