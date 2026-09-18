import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'

export default class ProbationAccessControlApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Probation Access Control API', config.apis.probationAccessControl, logger, authenticationClient)
  }

  async getLimitedAccessCheck(crn: string, username: string): Promise<LimitedAccessCheck> {
    return this.get(
      {
        path: `/user/${username}/access/${crn}`,
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
