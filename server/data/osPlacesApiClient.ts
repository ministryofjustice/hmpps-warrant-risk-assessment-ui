import logger from '../../logger'
import config from '../config'

const OS_PLACES_BASE_URL = config.apis.osPlaces.url as string

export class OSPlacesAPIClient {
  private readonly apiKey: string

  constructor(apiKey?: string) {
    if (!apiKey) {
      logger.error('Missing OS DataHub API credentials. Ensure OS_DATAHUB_API_KEY is configured.')
    }
    this.apiKey = apiKey || ''
  }

  async find(query: string): Promise<OSPlacesFindResponse> {
    if (!query) {
      return { results: [] }
    }

    if (!this.apiKey) {
      logger.error('Cannot search places: OS DataHub API key is not configured')
      return { results: [] }
    }

    const url = new URL(`${OS_PLACES_BASE_URL}/find`)
    url.searchParams.set('key', this.apiKey)
    url.searchParams.set('query', query)
    // url.searchParams.set('dataset', 'LPI')
    url.searchParams.set('maxresults', '100')

    try {
      const response = await fetch(url.toString())
      if (!response.ok) {
        logger.error(`OS Places API call failed with HTTP ${response.status}: ${response.statusText}`)
        return { results: [] }
      }
      return (await response.json()) as OSPlacesFindResponse
    } catch (error) {
      logger.error('Error calling OS Places API, ', error)
      return { results: [] }
    }
  }
}

export interface DeliveryPointAddress {
  UPRN: number
  ADDRESS: string
  BUILDING_NAME: string
  SUB_BUILDING_NAME: string
  BUILDING_NUMBER: number
  THOROUGHFARE_NAME: string
  POST_TOWN: string
  LOCAL_CUSTODIAN_CODE_DESCRIPTION: string
  POSTCODE: string
  STATUS: string
  ORGANISATION_NAME: string
}

export interface LandPropertyIdentifier {
  UPRN: string
  ADDRESS?: string
  ORGANISATION?: string
  SAO_TEXT?: string
  PAO_START_NUMBER?: string
  PAO_TEXT?: string
  STREET_DESCRIPTION?: string
  TOWN_NAME?: string
  ADMINISTRATIVE_AREA?: string
  POSTCODE_LOCATOR?: string
}

export interface OSPlacesResult {
  DPA?: DeliveryPointAddress
  LPI?: LandPropertyIdentifier
}

export interface OSPlacesFindResponse {
  results: OSPlacesResult[]
}
