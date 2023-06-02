import { AssetObject, AssetTypeQuery, BaseTypeQuery, ElasticSearchResult, ElasticSearchStatus, Expression, FullRegistryInfo } from '@videopass/ctms-model'
import { LogMetadata, log } from '@videopass/services'
import { getItemById } from '../operations/locationOperations'
import { elasticSearch, getElasticSearchResult, getElasticSearchStatus } from '../operations/searchOperations'
import delay from 'delay'
import { Walker } from './folderRecipes'

/**
 * Find in one folder by query. IS NOT FULLY IMPLEMENTED!!!
 * @param fullRegistryInfo
 * @param searchQuery
 * @param root is default Projects
 */
// FIXME: find on basetype
export async function findInFolderRecipe(fullRegistryInfo: FullRegistryInfo, searchQuery: BaseTypeQuery | AssetTypeQuery, root: string = 'Projects'): Promise<Array<AssetObject> | undefined> {
	const logMetadata: LogMetadata = { action: 'find in', ref: root }
	const message = `for attribute: ${searchQuery.commonType} with value ${searchQuery.value}`
	try {
		log.debug(message, logMetadata)

		const rootResponse = await getItemById(fullRegistryInfo, root)
		const foundItems = rootResponse._embedded['loc:collection'].paging.elements
		// TODO: check if there is a paging element
		const hasItems = foundItems >= 1
		// console.log(JSON.stringify(rootResponse._embedded['loc:collection']._embedded['loc:item'], null, 1))

		log.debug(`found: ${foundItems} items in folder: ${root}`)
		if (hasItems) {
			const items = rootResponse._embedded['loc:collection']._embedded['loc:item']
			const hits = items
				/**
				 * base type doesn't have sequence as type
				 * folder doesn't have an assetType
				 */
				// TODO: https://github.com/sindresorhus/matcher#readme wildcard first search on word and then filter by type
				.filter((x: AssetObject) => {
					if (x.common.assetType !== undefined) {
						return x.common.assetType === searchQuery.assetType && x.common.name === searchQuery.value
					}
					return false
				}) as Array<AssetObject>

			log.debug(`${hits.length} ${searchQuery.assetType} found in folder: ${root}`, logMetadata)

			return hits
			// return hits.filter((x) => x._embedded['aa:attributes'].attributes[`${searchQuery.attribute.name}`] === searchQuery.attribute.value)
		}
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

/**
 * Find recursive in all child folders and give folder
 * Is better to use the {@link searchWithElasticSearch}
 * @param fullRegistryInfo
 * @param searchQuery
 * @param root is default Projects
 */
// FIXME:
export async function findInAllFolderRecipe(fullRegistryInfo: FullRegistryInfo, searchQuery: BaseTypeQuery | AssetTypeQuery, root: string = 'Projects'): Promise<Array<AssetObject> | undefined> {
	const logMetadata: LogMetadata = { action: 'find in', ref: root }
	try {
		let walker = new Walker()
		const folderTree = await walker.walk(fullRegistryInfo, root)
		const message = `find in all folders: ${folderTree.length}`
		log.debug(message, logMetadata)

		let found = new Array<AssetObject>()
		for (const folder of folderTree) {
			let result = await findInFolderRecipe(fullRegistryInfo, searchQuery, folder.common.name)
			if (result) {
				found = found.concat(result)
			}
		}
		return found
	} catch (error) {
		log.error('find in all folders', logMetadata)
		throw error
	}
}

/**
 * Search with ElasticSearch instead of the CTMS search
 * @param fullRegistryInfo
 * @param expression see SearchExpression for default expressions
 */
export async function searchWithElasticSearch(fullRegistryInfo: FullRegistryInfo, expression: Expression): Promise<ElasticSearchResult[]> {
	const logMetadata: LogMetadata = { action: 'elastic search', ref: '' }
	const message = `search with elastic search`
	log.debug(message, logMetadata)

	try {
		let searchResponseStatus = await elasticSearch(fullRegistryInfo, expression)
		await new Promise((resolve, rejects) => getSearchStatus(resolve, rejects, searchResponseStatus))

		let assets = await getElasticSearchResult(searchResponseStatus)
		log.debug(`found assets: ${assets.length}`, logMetadata)

		return assets
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

const getSearchStatus = async (resolve: any, reject: any, searchResponseStatus: ElasticSearchStatus) => {
	// TODO: break when error or reject
	log.debug(`search with id: ${searchResponseStatus.id} status: ${searchResponseStatus.progress.status}`)

	if (searchResponseStatus.complete) {
		return resolve()
	} else {
		await delay(100)
		searchResponseStatus = await getElasticSearchStatus(searchResponseStatus)
		getSearchStatus(resolve, reject, searchResponseStatus)
	}
}
