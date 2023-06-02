/**
	https://developer.avid.com/ctms/api/loc/resources/locations.html
	https://developer.avid.com/ctms/api/loc/resources/item.html
    If a system supports displaying a folder structure, the service root information contains a link loc:root-item.
    An item that acts as a folder has a link loc: collection, pointing to a collection of items in the folder.
    The items in the folder can again be sub folders or asset references or both.
    The collection MUST also be returned as embedded resource of the folder.
*/

import { send } from '@videopass/ctms-core'
import { AxiosRequestConfig, AxiosError } from 'axios'
import { FullRegistryInfo, BaseLocation, LocationResources, Item, ItemsResult, BaseType, BulkCommandResponse, BulkDeleteStatusResponse, CtmsError, AssetObject } from '@videopass/ctms-model'
import { LogMetadata, log } from '@videopass/services'
import { getItems } from '../helpers/resourceHelpers'

// https://developer.avid.com/ctms/api/loc/linkrels/root-item.html
export async function getRoot(fullRegistryInfo: FullRegistryInfo): Promise<AssetObject> {
	const logMetadata: LogMetadata = { action: 'root', ref: '' }
	const message = 'get root location'
	try {
		log.debug(message, logMetadata)

		const url = fullRegistryInfo.resources['loc:root-item'][0].href
		const config: AxiosRequestConfig = { method: 'get' }

		return (await send(`${url}`, config)).data
	} catch (error) {
		throw error
	}
}

/**
 * Returns the item identified by the given identifier. The item can be a folder or a non-folder item.
 * @returns loc:item resource.
 * {@link https://developer.avid.com/ctms/api/loc/linkrels/item-by-id.html}
 * @param fullRegistryInfo
 * @param {string} id can be without Projects, /Projects, /Projects/ or /Projects/Child Folder
 */
export async function getItemById(fullRegistryInfo: FullRegistryInfo, id: string, limit = 1000, attributes?: string[]): Promise<AssetObject> {
	const logMetadata: LogMetadata = { action: 'get item', ref: id }
	const message = `get item by id: ${id}`
	try {
		log.debug(message, logMetadata)
		const url = fullRegistryInfo.resources['loc:item-by-id'][0].href.replace('{id}', `${encodeURIComponent(id)}?offset=0&limit=${limit}`)
		const config: AxiosRequestConfig = { method: 'get' }

		let attributesQuery = ''
		if (attributes) attributesQuery = `&attributes=${attributes.join(',')}`

		let asset: AssetObject = await (await send(`${url}${attributesQuery}`, config)).data

		await pageWalker(asset, config, limit, logMetadata)

		return asset
	} catch (error) {
		throw error
	}
}

/**
 * https://developer.avid.com/ctms/api/loc/resources/collection.html
 * @param asset 
 * @param config 
 * @param limit 
 * @param logMetadata 
 */
async function pageWalker(asset: AssetObject, config: AxiosRequestConfig, limit: number, logMetadata: LogMetadata) {
	let nextLink = asset._embedded?.['loc:collection']._links?.['next']?.href

	while (nextLink) {
		let nextPage = await (await send(`${nextLink}`, config)).data
		let nextItems = nextPage._embedded['loc:item']

		let items = asset._embedded['loc:collection']._embedded['loc:item']
		asset._embedded['loc:collection']._embedded['loc:item'] = items.concat(nextItems)

		log.trace(`page ${nextPage.paging.offset} of ${nextPage.paging.totalElements / limit} pages. ${asset._embedded['loc:collection']._embedded['loc:item'].length} items added of ${nextPage.paging.totalElements}`, logMetadata)
		nextLink = nextPage._links['next']?.href
	}
}

/**
 * Get full asset information with embedded items
 * For NON folder assets it's better to user GetAssetById. (less payload and property navigation)
 * @param asset
 */
export async function getItemByAsset(asset: AssetObject): Promise<AssetObject> {
	const logMetadata: LogMetadata = { action: 'get item', ref: asset.base.id }
	const message = `get item by id:${asset.base.id}`
	try {
		log.debug(message, logMetadata)
		// TODO: paging for big customers
		const url = asset._links.self.href.replace('?offset=0&limit=25', '?offset=0&limit=1000')
		const config: AxiosRequestConfig = { method: 'get' }

		return (await send(url, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

/**
 * Update a location name
 * https://developer.avid.com/ctms/api/rs_loc/rs_loc_item.html#_loc_update_item
 * @param asset
 * @param updateItem
 */
export async function updateItem(asset: AssetObject, updateItem: BaseLocation): Promise<AssetObject> {
	const logMetadata: LogMetadata = { action: 'update asset', ref: asset.base.id }
	const message = `update with name: ${updateItem.common.name}`
	try {
		log.debug(message, logMetadata)

		const url = asset._links['loc:update-item'].href
		const config: AxiosRequestConfig = { method: 'patch', data: updateItem }

		return (await send(url, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

// http://developer.avid.com/ctms/api/rs_loc/rs_loc_item.html#_loc_add_item
// can be use for copy past folder with content
export async function addItem(asset: AssetObject, item: Item): Promise<AssetObject> {
	const logMetadata: LogMetadata = { action: 'add asset', ref: item.base.id }
	const message = `add item: ${item.base.id} with type: ${item.base.type}`

	try {
		log.debug(message, logMetadata)

		const url = asset._links['loc:add-item'].href
		const config: AxiosRequestConfig = { method: 'post', data: item }

		return (await send(url, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

/**
 * Moves an item to the folder collection. The body contains the item that should be moved.
 * The following items can be moved: * A folder: the folder (including all items and sub folders) will be moved to the current folder as a sub folder.
 * A non-folder item: the item is moved from its original folder to the current folder.
 * {@link https://developer.avid.com/ctms/api/rs_loc/rs_loc_item.html#_loc_move_item}
 * @param destination
 * @param toMove asset.base
 */
export async function moveItem(destination: AssetObject, toMove: Item): Promise<AssetObject> {
	const logMetadata: LogMetadata = { action: 'move asset', ref: toMove.base.id }
	const message = `move item: ${toMove.base.id} with type: ${toMove.base.type}`
	log.debug(message)

	try {
		const url = destination._links['loc:move-item'].href
		const config: AxiosRequestConfig = { method: 'post', data: toMove }

		return (await send(url, config)).data
	} catch (err: any | AxiosError) {
		const error = err as AxiosError
		/* warn only when folder already exists */
		if (error.response) {
			if ((error.response.data as CtmsError).incident) {
				let ctmsError = error.response.data as CtmsError
				if (ctmsError.code === '409') {
					log.warn(ctmsError.message.split(';')[0], logMetadata)
					const folders = toMove.base.id.split('/').filter((x) => x)
					let name = folders[folders.length - 1]
					const backupCopyFolder = await createFolder(destination, `${name} copy ${new Date().valueOf().toString()}`)
					return moveItem(backupCopyFolder, toMove)
				}
				throw error
			}
			throw error
		} else {
			log.error(error, logMetadata, message)
			throw error
		}
	}
}

/**
 * Moves multiple items to the folder collection. The body contains an array of items that should be moved.
 * {@link http://developer.avid.com/ctms/api/rs_loc/rs_loc_item.html#_loc_move_items}
 * @param destination folder
 * @param toMove array with asset.base
 */
export async function moveItems(destination: AssetObject, toMove: Item[]): Promise<ItemsResult> {
	const logMetadata: LogMetadata = { action: 'bulk move', ref: destination.base.id }
	const message = `move items: ${toMove.length}`
	log.debug(message, logMetadata)

	try {
		const url = destination._links['loc:move-items'].href
		const config: AxiosRequestConfig = { method: 'post', data: toMove }

		return (await send(url, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

/**
 * Adds a folder to the folder collection. The body contains the folder that should be added.
 * {@link https://developer.avid.com/ctms/api/rs_loc/rs_loc_item.html#_loc_create_folder}
 * @param parentFolder
 * @param folderName name of the folder to create
 * @returns the new item or undefined if folder exists
 */
export async function createFolder(parentFolder: AssetObject, folderName: string): Promise<AssetObject> {
	const logMetadata: LogMetadata = { action: 'create folder', ref: folderName }
	const message = `in: ${parentFolder.base.id}`
	const folder: BaseLocation = { common: { name: folderName } }
	try {
		log.debug(message, logMetadata)

		const url = parentFolder._links['loc:create-folder'].href
		const config: AxiosRequestConfig = { method: 'post', data: folder }

		return (await send(url, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

/**
 * Search on id in folder and delete that asset
 * https://developer.avid.com/ctms/api/loc/resources/collection.html
 * @param parentFolder
 * @param id is id
 */
export async function deleteItemInFolder(parentFolder: AssetObject, id: string): Promise<boolean> {
	const logMetadata: LogMetadata = { action: 'delete asset', ref: id }
	const message = `delete item in folder: ${parentFolder.base.id} with id: ${id}`
	try {
		log.debug(message)

		const asset = parentFolder._embedded['loc:collection']._embedded['loc:item'].find((x: AssetObject) => x.base.id === `${parentFolder.base.id}${id}`)
		if (asset) {
			return await deleteItem(asset)
		}
		log.warn(`item with id: ${id} not found in folder: ${parentFolder.base.id} during delete item`, logMetadata)
		return false
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

/**
 * Delete asset for a given asset
 * @param asset to delete
 */
export async function deleteItem(asset: AssetObject): Promise<boolean> {
	const logMetadata: LogMetadata = { action: 'delete asset', ref: asset.base.id }
	const message = `item`
	const config: AxiosRequestConfig = { method: 'delete' }
	const deleteHref = asset._links['loc:delete-item']
	if (deleteHref) {
		log.debug(`delete ${asset.common.assetType}: ${asset.common.path}${asset.common.name}`, logMetadata)

		try {
			await send(`${deleteHref.href}`, config)
			return true
		} catch (error) {
			log.error(error, logMetadata, message)
			return false
		}
	}
	return false
}

/**
 * Delete a;; items in a folder one by one
 * Better to use bulk delete
 * {@link deleteBulkItemsById}
 * @param parentFolder
 */
export async function deleteAllItemsInFolder(parentFolder: AssetObject): Promise<Array<AssetObject>> {
	const logMetadata: LogMetadata = { action: 'delete all items', ref: parentFolder.base.id }
	const message = `all items in folder`
	try {
		let notDeleted = new Array<AssetObject>()
		const folderAssets = parentFolder._embedded['loc:collection']._embedded['loc:item']
		for (const asset of folderAssets) {
			if (await deleteItem(asset)) {
				notDeleted.push(asset)
			}
		}
		return notDeleted
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

/**
    https://developer.avid.com/ctms/api/loc/linkrels/delete-item-by-id-bulk-command.html
    Bulk requests need a body, which is not supported for GET and DELETE requests. 
    If the non-bulk call uses GET or DELETE, the bulk call will use POST as method.
    The request will usually accept the same query parameters as the non-bulk call unless stated otherwise in the description of the bulk request.
    The query parameters are applied to all items in the request.    

    Delete assets over multiple folders
*/
export async function deleteBulkItemsById(locationResources: LocationResources, ids: string[]): Promise<BulkCommandResponse> {
	const idsString = ids.join(', ')
	const logMetadata: LogMetadata = { action: 'bulk delete', ref: idsString }
	const message = `item(s): ${ids.length} by id: ${idsString}`
	try {
		log.debug(message, logMetadata)

		const url = locationResources._links['loc:delete-item-by-id-bulk-command'].href
		const config: AxiosRequestConfig = { method: 'post', data: ids }

		return (await send(url, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

/**
    Get the status of the bulk delete command
*/
export async function getBulkDeleteStatus(bulkCommandResponse: BulkCommandResponse, folder: string): Promise<BulkDeleteStatusResponse> {
	const logMetadata: LogMetadata = { action: 'bulk delete', ref: folder }
	const message = `get status with id: ${bulkCommandResponse.command.id}`
	try {
		log.debug(message, logMetadata)

		const url = bulkCommandResponse._links.self.href
		const config: AxiosRequestConfig = { method: 'get' }

		return (await send(url, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

/**
    Delete the assets for the given folder
*/
export async function deleteBulkItemsInFolder(folder: AssetObject): Promise<BulkCommandResponse | undefined> {
	const logMetadata: LogMetadata = { action: 'bulk delete', ref: folder.common.name }
	const message = `delete item(s) in folder`
	try {
		const url = folder._links['loc:delete-item-in-folder-by-id-bulk-command'].href

		let ids: string[] = getItems(folder)
			.filter((x: AssetObject) => x.base.type !== BaseType.folder)
			.map((x: AssetObject) => x.base.id)

		if (ids.length === 0) return

		log.debug(`${message} total found: ${ids.length}`, logMetadata)
		const config: AxiosRequestConfig = { method: 'post', data: ids }
		return (await send(url, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

/**
 * Moniker is assetResponse.data.id.split('sequence:')[1]
 * id of the response is full path
 * id of asset getById is id
 */
export async function getItemByMoniker(locationResources: LocationResources, monikerId: string): Promise<AssetObject> {
	const logMetadata: LogMetadata = { action: 'get', ref: monikerId }
	const message = `get item by moniker`
	try {
		log.debug(message, logMetadata)

		const url = locationResources._links['pa:location-item-by-moniker'].href.replace('{moniker}', encodeURIComponent(monikerId))
		const config: AxiosRequestConfig = { method: 'get' }

		return (await send(url, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

/**
 * not implemented
 * https://developer.avid.com/ctms/api/loc/linkrels/referencing-items.html
 */