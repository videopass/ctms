import { AssetObject, AssetAttributes, AssetType, Attribute, AttributeType, FullRegistryInfo, MediaInfo, PaResources, AssetTypeQuery, CommonAssetType, CommonBaseType } from '@videopass/ctms-model'
import { LogMetadata, log } from '@videopass/services'
import { getMediaInfoById } from '../operations/paOperations'
import { updateAssetAttributesById } from '../operations/assetOperations'
import { getItemById } from '../operations/locationOperations'
import { findInAllFolderRecipe, searchWithElasticSearch } from './searchRecipes'
import { sequencesByVideoIdExpression } from './expressionRecipes'

/**
 * Update metadata of all sequences with VideoID
 * Search by VideoID is done with Elastic Search
 * @param fullRegistryInfo
 * @param videoId
 * @param assetAttributes
 */
export async function updateSequenceMetadataByVideoId(fullRegistryInfo: FullRegistryInfo, videoId: string, assetAttributes: AssetAttributes): Promise<void> {
	const logMetadata: LogMetadata = { action: 'update sequence', ref: videoId }
	const message = `upsert sequence with metadata`
	try {
		log.debug(message, logMetadata)
		// FIXME: search in all folders
		// TODO: merge with search recipes
		let searchResult = await searchWithElasticSearch(fullRegistryInfo, sequencesByVideoIdExpression(videoId))

		if (searchResult.length === 0) {
			log.debug(`no sequence found with reference: ${videoId}`, logMetadata)
			return
		}

		log.debug(`${searchResult.length} found with reference: ${videoId}`, logMetadata)
		for (const found of searchResult) {
			const id = found.catalog_item.metadata.payload.avid.id
			return await updateAssetAttributesById(fullRegistryInfo, id, assetAttributes, videoId)
		}
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

/**
 * Get sequences within a folder and return metadata of the sequences
 * @param fullRegistryInfo
 * @param folder
 * @param assetAttributes
 * @param attributes
 */
export async function getSequencesWithMetadataByFolder(fullRegistryInfo: FullRegistryInfo, folder: string, attributes?: string[]): Promise<Array<AssetObject>> {
	const logMetadata: LogMetadata = { action: 'get', ref: folder }
	const message = `get sequences with metadata for folder: ${folder}`
	try {
		log.debug(message, logMetadata)

		const limit = 1000
		let sequences = new Array<AssetObject>()
		let rootResponse = await getItemById(fullRegistryInfo, folder, limit, attributes)

		if (rootResponse._embedded['loc:collection']._embedded) {
			sequences = rootResponse._embedded['loc:collection']._embedded['loc:item'].filter((x: AssetObject) => x.common.assetType === AssetType.sequence) as Array<AssetObject>
			log.debug(`found sequences: ${sequences.length} in folder: ${folder}`, logMetadata)
		}

		return sequences
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

/**
 * Get Media Info of sequences in a folder and return metadata of the sequence
 * @param fullRegistryInfo
 * @param paResources
 * @param folder is full path /Projects/
 * @param attributes
 */
export async function getMediaInfoOfSequencesByFolder(fullRegistryInfo: FullRegistryInfo, paResources: PaResources, folder: string, attributes?: string[]): Promise<Array<MediaInfo>> {
	const logMetadata: LogMetadata = { action: 'get', ref: folder }
	const message = `get video ids of sequences in the folder: ${folder}`
	try {
		log.debug(message, logMetadata)

		let sequences = await getSequencesWithMetadataByFolder(fullRegistryInfo, folder, attributes)

		const ids = sequences.map((x) => x._embedded['loc:referenced-object'].base.id)

		// TODO: bulk
		let mediaInfos = new Array<MediaInfo>()

		for (const id of ids) {
			let mediaInfo = await getMediaInfoById(paResources, id)
			mediaInfos.push(mediaInfo.mediaInfo)
		}

		return mediaInfos
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

/**
 * Get sequences by video id for a given folder
 * {@link getSequencesWithMetadataByFolder}
 * @param fullRegistryInfo
 * @param videoId
 * @param folder is full path /Projects/
 */
export async function getSequencesByVideoIdForFolder(fullRegistryInfo: FullRegistryInfo, videoId: string, folder: string): Promise<Array<AssetObject>> {
	const logMetadata: LogMetadata = { action: 'get', ref: videoId }
	const message = `get sequences by video id: ${videoId} in the folder: ${folder}`
	try {
		log.debug(message, logMetadata)

		let sequences = await getSequencesWithMetadataByFolder(fullRegistryInfo, folder, [AttributeType.System.VideoId])
		return sequences.filter((asset: AssetObject) => getAttributesFromAsset(asset).find((attribute: Attribute) => attribute.name === AttributeType.System.VideoId)?.value === videoId)
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

/**
 * Internal use only
 * @param asset
 * @returns attributes
 */
export function getAttributesFromAsset(asset: AssetObject): Attribute[] {
	return asset._embedded['loc:referenced-object']._embedded['aa:attributes'].attributes
}
