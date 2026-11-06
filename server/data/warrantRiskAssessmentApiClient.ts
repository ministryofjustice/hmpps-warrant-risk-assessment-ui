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

  async updateAddress(
    id: string,
    address: WarrantRiskAssessmentAddress,
    username: string,
  ): Promise<WarrantRiskAssessmentAddress> {
    return this.put(
      {
        path: `/warrant-risk-assessment/address/${id}`,
        data: address as unknown as Record<string, unknown>,
      },
      asSystem(username),
    )
  }

  async batchUpdateAddresses(addresses: Array<WarrantRiskAssessmentAddress>, username: string): Promise<void> {
    const promises = []
    for (const a of addresses) {
      if (a.id) {
        promises.push(this.updateAddress(a.id, a, username))
      }
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

  async updateContact(
    id: string,
    contact: WarrantRiskAssessmentContact,
    username: string,
  ): Promise<WarrantRiskAssessmentContact> {
    return this.put(
      {
        path: `/warrant-risk-assessment/contact/${id}`,
        data: contact as unknown as Record<string, unknown>,
      },
      asSystem(username),
    )
  }

  async batchUpdateContacts(contacts: Array<WarrantRiskAssessmentContact>, username: string): Promise<void> {
    const promises = []
    for (const c of contacts) {
      if (c.id) {
        promises.push(this.updateContact(c.id, c, username))
      }
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
      promises.push(this.deleteAddress(a.id!, username))
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
      promises.push(this.deleteContact(c.id!, username))
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
  subjectOfMappaProcedures: boolean | null
  highRiskOfSeriousHarm: boolean | null
  highRiskOfAbsconding: boolean | null
  vulnerable: boolean | null
  carryOrUseWeapons: boolean | null
  assaultingPolice: boolean | null
  misuseDrugsAndAlcohol: boolean | null
  postalAddress: WarrantRiskAssessmentAddress | null | undefined
  dateOfBirth: string | null | undefined
  prisonNumber: string
  workAddress: WarrantRiskAssessmentAddress | null
  basicDetailsSaved: boolean
  signAndSendSaved: boolean
  contactSaved: boolean
  reviewRequiredDate: ZonedDateTime
  reviewEvent: string
  mobileNumber: string
  emailAddress: string
  lastHomeVisitDate: string | null | undefined
  riskAssessmentSaved: boolean
  riskSummarySaved: boolean
  responsibleOfficerFullName: string
  responsibleOfficerTelephoneNumer: string
  terminated: boolean
  terminatedUnterminatedDate: Date
}

export interface WarrantRiskAssessmentAddress {
  id?: string | null | undefined
  warrantRiskAssessmentId: string | null | undefined
  deliusAddressId: number | null
  status: string | null | undefined
  officeDescription?: string | null | undefined
  buildingName: string | null | undefined
  addressNumber: string | null | undefined
  streetName: string | null | undefined
  townCity: string | null | undefined
  district: string | null | undefined
  county: string | null | undefined
  postcode: string | null | undefined
  screen: string | null | undefined
}

export interface WarrantRiskAssessmentContact {
  id?: string
  contactPerson: string
  contactLocation: WarrantRiskAssessmentAddress
  warrantRiskAssessmentId: string
  mobileNumber: string
  telephoneNumber: string
}
