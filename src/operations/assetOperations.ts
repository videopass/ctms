import { send } from '@videopass/ctms-core'
import { AxiosRequestConfig } from 'axios'
import { AssetObject, AssetAttributes, FullRegistryInfo, Common, TimeBased, BaseType } from '@videopass/ctms-model'
import { LogMetadata, log } from '@videopass/services'

// PM support HTTP content type set as * application / hal + json for getting asset metadata,
// * application / aaf + json for getting aff binary data or * application / jpg + json for getting asset head frame.
// aa:assets https://developer.avid.com/ctms/api/aa/resources/assets.html
// aa:asset https://developer.avid.com/ctms/api/aa/resources/asset.html

/**
 * Returns the aa:asset identified by the given ID with attribute.
 * https://developer.avid.com/ctms/api/aa/linkrels/asset-by-id.html
 * @param fullRegistryInfo
 * @param id id can also be the mobId in case of pa:functions
 * @param attributes
 * @returns AssetObject with attributes [com.avid.workgroup.Property.User.Theta]
 */
export async function getAssetById(fullRegistryInfo: FullRegistryInfo, id: string, attributes?: string[]): Promise<AssetObject> {
	const logMetadata: LogMetadata = { action: 'asset', ref: id }
	const message = `get assets by id`
	try {
		log.debug(message, logMetadata)

		let url = fullRegistryInfo.resources['aa:asset-by-id'][0].href.replace('{id}', encodeURIComponent(id)) //?
		const config: AxiosRequestConfig = { method: 'get' }

		let attributesQuery = ''
		if (attributes) attributesQuery = `?attributes=${attributes.join(',')}` //?

		// make attributesQuery uri encoded
		attributesQuery = encodeURI(attributesQuery) //?

		const newUrl = `${url}${attributesQuery}` //?
		return (await send(newUrl, config)).data //?
	} catch (error /*?*/) {
		log.error(error, logMetadata, message)
		throw error
	}
}

/**
 * Update the asset. The format depends on the system. The type property of the link contains the supported format.
 * Common attributes that are given in the request are updated. Common attributes that are not given, are not touched.
 * PM
 * Common attributes cannot be updated. Custom attributes to be updated must be contained in the _embedded aa:attributes resource of the asset.
 * @{link https://developer.avid.com/ctms/api/aa/linkrels/attributes.html}
 * @param asset
 * @param attributesToUpdate
 * @returns
 */
export async function updateAssetAttributes(asset: AssetObject, attributesToUpdate: AssetAttributes): Promise<any> {
	const logMetadata: LogMetadata = { action: 'update asset', ref: asset.common.name }
	const message = `update asset attributes`
	try {
		log.debug(message, logMetadata)
		log.debug(JSON.stringify(attributesToUpdate), logMetadata)
		// TODO: is different by AM then in PM. Sequence is in loc: container

		// console.warn(JSON.stringify(asset, null, 1))
		let url = ''
		// if (asset.base.type === BaseType.sequence) {
		// 	url = asset._links['aa:update-attributes'].href
		// } else {
		url = asset._embedded['loc:referenced-object']._links['aa:update-attributes'].href
		// }

		const config: AxiosRequestConfig = { method: 'patch', data: attributesToUpdate }

		return await send(url, config)
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

/**
 * Update custom attributes of an asset.
 * @param fullRegistryInfo
 * @param id is id without path. Example Base.Id
 * @param attributesToUpdate
 * @param ref is used as logging metadata. For example videoId or name
 */
export async function updateAssetAttributesById(fullRegistryInfo: FullRegistryInfo, id: string, attributesToUpdate: AssetAttributes, ref: string = ''): Promise<any> {
	const logMetadata: LogMetadata = { action: 'update asset', ref }
	const message = `attributes for id: ${id}`
	try {
		log.debug(message, logMetadata)
		log.debug(JSON.stringify(attributesToUpdate), logMetadata)
		let url = fullRegistryInfo.resources['aa:update-attributes-by-id'][0].href.replace('{id}', encodeURIComponent(id))
		const config: AxiosRequestConfig = { method: 'patch', data: attributesToUpdate }

		return await send(url, config)
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

// FIXME: empty post body
/**
 * Update an aa:asset resource. Only common properties may be updated.
 * @{link // https://developer.avid.com/ctms/api/aa/linkrels/update-asset-by-id.html}
 * @param data
 * @param id
 * @param common
 * @returns
 */
export async function updateAssetById(data: FullRegistryInfo, id: string, common: Common): Promise<any> {
	const message = 'todo :'
	const logMetadata: LogMetadata = { action: 'asset', ref: id }
	try {
		log.debug(message, logMetadata)
		let url = data.resources['aa:update-asset-by-id'][0].href.replace('{id}', encodeURIComponent(id))
		const config: AxiosRequestConfig = { method: 'patch', data: { common: common } }

		return await send(url, config)
	} catch (error) {
		log.error(error, logMetadata, message)
	}
}

// https://developer.avid.com/ctms/api/aa/linkrels/time-based.html
export async function getTimeBased(asset: AssetObject): Promise<any> {
	const logMetadata: LogMetadata = { action: 'asset', ref: asset.common.name }
	const message = `get time based for: ${asset.common.name}`
	try {
		log.debug(message, logMetadata)

		let url = asset._links['aa:time-based'].href
		const config: AxiosRequestConfig = { method: 'get' }

		return await send(url, config)
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

export async function upsertSegments(asset: AssetObject, timeBased: TimeBased): Promise<TimeBased> {
	const logMetadata: LogMetadata = { action: 'asset', ref: asset.common.name }
	const message = `upsert time based for: ${asset.common.name}`
	try {
		log.debug(message, logMetadata)

		let url = asset._links['aa:time-based'].href
		const config: AxiosRequestConfig = { method: 'patch', data: timeBased }

		return (await send(url, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

/**
 * New in MediaCentral | Cloud UX 2022.3
 * https://developer.avid.com/ctms/api/aa/linkrels/asset-selective-by-id.html
 * https://developer.avid.com/ctms/api/aa/linkrels/asset-selective.html
 * https://developer.avid.com/ctms/api/aa/linkrels/multi-value-attribute-by-attributeid.html
 * https://developer.avid.com/ctms/api/aa/linkrels/multi-value-attribute-range-by-attributeid.html
 */

/**
 * Not implemented
 * https://developer.avid.com/ctms/api/aa/linkrels/create-asset.html
 * https://developer.avid.com/ctms/api/aa/linkrels/set-thumb-command.html
 * https://developer.avid.com/ctms/api/aa/linkrels/thumb.html
 */
