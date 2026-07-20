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

  async getBasicDetailAddressess(uuid: string, username: string): Promise<Array<WarrantRiskAssessmentAddress>> {
    return this.get(
      {
        path: `/warrant-risk-assessment/address/byWRAIdAndPage/${uuid}/basicDetails`,
      },
      asSystem(username),
    )
  }

  async getContacts(uuid: string, username: string): Promise<Array<WarrantRiskAssessmentContact>> {
    return this.get(
      {
        path: `/warrant-risk-assessment/contact/byWRAId/${uuid}`,
      },
      asSystem(username),
    )
  }

  async createAddress(address: WarrantRiskAssessmentAddress, username: string): Promise<string> {
    return this.post(
      {
        path: `/warrant-risk-assessment/address`,
        data: address as unknown as Record<string, unknown>,
      },
      asSystem(username),
    )
  }

  async batchCreateAddresses(addresses: Array<WarrantRiskAssessmentAddress>, username: string): Promise<void> {
    const promises = []
    for (const a of addresses) {
      promises.push(this.createAddress(a, username))
    }
    await Promise.all(promises)
  }

  async createContact(contact: WarrantRiskAssessmentContact, username: string): Promise<string> {
    return this.post(
      {
        path: `/warrant-risk-assessment/contact`,
        data: contact as unknown as Record<string, unknown>,
      },
      asSystem(username),
    )
  }

  async batchCreateContacts(contacts: Array<WarrantRiskAssessmentContact>, username: string): Promise<void> {
    const promises = []
    for (const c of contacts) {
      promises.push(this.createContact(c, username))
    }
    await Promise.all(promises)
  }

  async deleteAddress(id: string, username: string) {
    return this.delete(
      {
        path: `/warrant-risk-assessment/address/${id}`,
      },
      asSystem(username),
    )
  }

  async batchDeleteAddresses(addresses: Array<WarrantRiskAssessmentAddress>, username: string): Promise<void> {
    const promises = []
    for (const a of addresses) {
      promises.push(this.deleteAddress(a.id, username))
    }
    await Promise.all(promises)
  }

  async deleteContact(id: string, username: string) {
    return this.delete(
      {
        path: `/warrant-risk-assessment/contact/${id}`,
      },
      asSystem(username),
    )
  }

  async batchDeleteContacts(contacts: Array<WarrantRiskAssessmentContact>, username: string): Promise<void> {
    const promises = []
    for (const c of contacts) {
      promises.push(this.deleteContact(c.id, username))
    }
    await Promise.all(promises)
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
  riskAssessmentSaved: boolean
  riskSummarySaved: boolean
}

export interface WarrantRiskAssessmentAddress {
  id?: string
  warrantRiskAssessmentId: string
  deliusAddressId: number
  status: string
  officeDescription?: string
  buildingName: string
  addressNumber: string
  streetName: string
  townCity: string
  district: string
  county: string
  postcode: string
  screen: string
}

export interface WarrantRiskAssessmentContact {
  id?: string
  contactPerson: string
  contactLocation: WarrantRiskAssessmentAddress
  warrantRiskAssessmentId: string
  mobileNumber: string
  telephoneNumber: string
}
