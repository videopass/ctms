import { send } from '@videopass/ctms-core'
import { AxiosRequestConfig } from 'axios'
import { FullRegistryInfo, AssetResources, LocationResources, TaxonomiesResources, SearchResources, PaResources } from '@videopass/ctms-model'
import { LogMetadata, log } from '@videopass/services'

// http://developer.avid.com/ctms/api/rs_aa/rs_aa_assets.html
const logMetadata: LogMetadata = { action: 'get', ref: 'CTMS' }
export async function getAssetResources(data: FullRegistryInfo): Promise<AssetResources> {
	const message = 'assets resources'
	try {
		log.trace(message, logMetadata)

		let url = data.resources['aa:assets'][0].href
		let config: AxiosRequestConfig = { method: 'get' }

		return (await send(`${url}`, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

// http://developer.avid.com/ctms/api/rs_loc/rs_loc_locations.html
export async function getLocationResources(data: FullRegistryInfo): Promise<LocationResources> {
	const message = 'location resources'
	try {
		log.trace(message, logMetadata)

		let url = data.resources['loc:locations'][0].href
		let config: AxiosRequestConfig = { method: 'get' }

		return (await send(`${url}`, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

// http://developer.avid.com/ctms/api/rs_search/rs_search_searches.html
export async function getSearchResources(data: FullRegistryInfo): Promise<SearchResources> {
	const message = 'search resources'
	try {
		log.trace(message, logMetadata)

		let url = data.resources['search:searches'][0].href
		let config: AxiosRequestConfig = { method: 'get' }

		return (await send(`${url}`, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

// http://developer.avid.com/ctms/api/rs_taxonomies/rs_taxonomies_taxonomies.html
export async function getTaxonomiesResources(data: FullRegistryInfo): Promise<TaxonomiesResources> {
	const message = 'taxonomies resources'
	try {
		log.trace(message, logMetadata)

		let url = data.resources['taxonomies:taxonomies'][0].href
		let config: AxiosRequestConfig = { method: 'get' }

		return (await send(`${url}`, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

export async function getPaResources(data: FullRegistryInfo): Promise<PaResources> {
	const message = 'pa resources'
	try {
		log.trace(message, logMetadata)

		let url = data.resources['pa:extended'][0].href
		let config: AxiosRequestConfig = { method: 'get' }

		return (await send(`${url}`, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}
