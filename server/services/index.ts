import { dataAccess } from '../data'
import AuditService from './auditService'
import CommonUtils from './commonUtils'

export const services = () => {
  const { applicationInfo, hmppsAuditClient, hmppsAuthClient, osPlacesApiClient } = dataAccess()
  const commonUtils = new CommonUtils()

  return {
    applicationInfo,
    auditService: new AuditService(hmppsAuditClient),
    hmppsAuthClient,
    commonUtils,
    osPlacesApiClient,
  }
}

export type Services = ReturnType<typeof services>
