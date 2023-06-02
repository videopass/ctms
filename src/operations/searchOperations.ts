// http://developer.avid.com/ctms/api/rs_search/rs_search_searches.html
import { send } from '@videopass/ctms-core'
import type { AxiosRequestConfig } from 'axios'
import type { ElasticSearchResult, ElasticSearchStatus, Expression, FullRegistryInfo,  SearchResult } from '@videopass/ctms-model'
import { LogMetadata, log } from '@videopass/services'

/**
 * Simple full-text search for assets. DOES NOT WORK FOR ATTRIBUTES!!!
 * http://developer.avid.com/ctms/api/rs_search/rs_search_searches.html#_search_simple_search
 * @param fullRegistryInfo can be the CtmsClient cache
 * @param search on this string
 * @param offset sets the start of the searching page
 * @param limit
 * @returns
 */
export async function simpleSearch(fullRegistryInfo: FullRegistryInfo, search: string, offset: number = 0, limit: number = 1000): Promise<SearchResult> {
	const logMetadata: LogMetadata = { action: 'simple search', ref: search }
	const message = `with offset: ${offset} and limit: ${limit}`
	try {
		log.debug(message, logMetadata)

		let searchExpression = encodeURIComponent(search)

		let url: string = fullRegistryInfo.resources['search:simple-search'][0].href.replace(`{search}`, searchExpression).replace(`{&offset,limit}`, `&offset=${offset}&limit=${limit}`)
		let config: AxiosRequestConfig = { method: 'get' }

		// PM does not support sort &sort=-created
		return (await send(url, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

/**
 * IS NOT ACCURATELY!!!
 * @param fullRegistryInfo
 * @param expression
 * @returns
 */
export async function elasticSearch(fullRegistryInfo: FullRegistryInfo, expression: Expression): Promise<ElasticSearchStatus> {
	const logMetadata: LogMetadata = { action: 'elastic search', ref: '' }
	const message = `with expression: ${JSON.stringify(expression)}`
	log.debug(message, logMetadata)
	try {
		let config: AxiosRequestConfig = { method: 'post', data: expression }

		const urlObject = new URL(fullRegistryInfo._links.self.href)
		const server = `${urlObject.protocol}//${urlObject.hostname}`

		return (await send(`${server}/search/v1/search`, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

export async function getElasticSearchStatus(response: ElasticSearchStatus): Promise<ElasticSearchStatus> {
	const logMetadata: LogMetadata = { action: 'elastic status', ref: response.id }
	const message = `for expression: ${JSON.stringify(response.expression)}`
	log.debug(message, logMetadata)
	try {
		const url = `${response.self}`
		let config: AxiosRequestConfig = { method: 'get' }
		return (await send(url, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

export async function getElasticSearchResult(response: ElasticSearchStatus): Promise<Array<ElasticSearchResult>> {
	const logMetadata: LogMetadata = { action: 'elastic result', ref: response.id }
	const message = `for expression: ${JSON.stringify(response.expression)}`
	log.debug(message, logMetadata)
	try {
		const url = `${response.self}/results`
		let config: AxiosRequestConfig = { method: 'get' }
		return (await send(url, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}
