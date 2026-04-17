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
}

export interface WarrantRiskAssessmentAddress {
  id?: string
  addressId: number
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
