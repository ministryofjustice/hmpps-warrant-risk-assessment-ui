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

  async getRiskAssessment(crn: string, username: string): Promise<RiskAssessment> {
    return this.get(
      {
        path: `/mappa-information/${crn}`,
      },
      asSystem(username),
    )
  }

  async getResponsibleOfficerDetails(crn: string, username: string): Promise<SignAndSendDetails> {
    return this.get(
      {
        path: `/sign-and-send/${crn}/${username}`,
      },
      asSystem(username),
    )
  }
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
  lastHomeVisitDate: string
  nationalInsuranceNumber: string
  emailAddress: string
  mobileNumber: string
  telephoneNumber: string
  employers: Employer[]
}

export interface Employer {
  employerName: Name
  telephoneNumber: string
  mobileNumber: string
  employerAddress: DeliusAddress
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
  userDetails: UserDetails
  name: Name
  telephoneNumber?: string
  probationArea?: ReferenceData
  replyAddress: DeliusAddress[]
}

export interface UserDetails {
  forenames: string
  surname: string
}

export interface ReferenceData {
  code: string
  description: string
}

export interface RiskAssessment {
  subjectOfMappaProcedures: boolean
  mappaRegistration: Registration
}

export interface Registration {
  id: number
  type: ReferenceData
  startDate: string
  notes: string
}
