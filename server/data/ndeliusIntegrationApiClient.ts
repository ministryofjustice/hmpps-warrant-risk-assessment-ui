import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'

export default class NDeliusIntegrationApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('NDelius Integration API', config.apis.ndeliusIntegration, logger, authenticationClient)
  }

  async getBasicDetails(crn: string, username: string): Promise<BasicDetails> {
    return this.get(
      {
        path: `/basic-details/${crn}`,
      },
      asSystem(username),
    )
  }

  async getLimitedAccessCheck(crn: string, username: string): Promise<LimitedAccessCheck> {
    return this.get(
      {
        path: `/users/${username}/access/${crn}`,
      },
      asSystem(username),
    )
  }
}

export interface LimitedAccessCheck {
  crn: string
  userExcluded: boolean
  exclusionMessage?: string
  userRestricted: boolean
  restrictionMessage?: string
}

export interface Name {
  forename: string
  middleName: string
  surname: string
}

export interface BasicDetails {
  title: string
  name: Name
  addresses: DeliusAddress[]
  dateOfBirth: string
  nomsNumber: string
}

export interface DeliusAddress {
  id: number
  status: string
  officeDescription?: string
  buildingName: string
  buildingNumber: string
  streetName: string
  townCity: string
  district: string
  county: string
  postcode: string
  startDate: string
}

export interface SignAndSendDetails {
  name: Name
  telephoneNumber?: string
  emailAddress?: string
  addresses: DeliusAddress[]
}

export interface ReferenceData {
  code: string
  description: string
}
