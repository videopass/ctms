import { AssetObject, BaseType, BulkDeleteStatusResponse, FullRegistryInfo, ReservationResponse } from '@videopass/ctms-model'
import { LogMetadata, log } from '@videopass/services'
import { createFolder, deleteBulkItemsInFolder, getBulkDeleteStatus, getItemById } from '../operations/locationOperations'
import delay from 'delay'
import { deleteReservation, getReservation } from '../operations'

export class Walker {
	public directories: Array<AssetObject>
	public depthLimit: number = 100
	public onlyDepthFolders: boolean = false

	constructor() {
		this.directories = new Array<AssetObject>()
	}
	/**
	 * CTMS folder walker to collect all the folders including the child nest folder.
	 * Depth can be set with Walker.depthLimit.
	 * Also Walker.onlyDepthFolders can be set the only collect the folders with a given depth
	 * @param fullRegistryInfo
	 * @param root can be Projects or /Projects/Child Folder
	 * @param depth DO NOT SET THIS this. Use Walk.depthLimit tp limit the depth
	 * @returns
	 */
	async walk(fullRegistryInfo: FullRegistryInfo, root: string, depth: number = 0) {
		let logMetadata: LogMetadata = { action: 'walk', ref: root }
		const message = `get child folders with depth: ${depth}`

		try {
			log.trace(message, logMetadata)

			const rootFolder = await getItemById(fullRegistryInfo, root)
			let childFolders = await getFolderAssets(rootFolder)

			depth++
			if (this.onlyDepthFolders) {
				if (depth === this.depthLimit) this.directories.push(rootFolder)
			} else {
				this.directories.push(rootFolder)
			}

			if (depth < this.depthLimit)
				for (const childFolder of childFolders) {
					await this.walk(fullRegistryInfo, childFolder.base.id, depth)
				}

			return this.directories
		} catch (error) {
			log.error(error, logMetadata, message)
			throw error
		}
	}
}

/**
 * Create a new folder when not found
 * @param fullRegistryInfo
 * @param name
 * @param parentFolder is the folder where the folder will be create when not found. If found return undefined
 */
export async function upsertFolder(fullRegistryInfo: FullRegistryInfo, name: string, parentFolder: string = 'Projects'): Promise<AssetObject> {
	const logMetadata: LogMetadata = { action: 'upsert folder', ref: name }
	const message = `upsert folder: ${name} in: ${parentFolder}`

	try {
		log.debug(message, logMetadata)

		const rootResponse = await getItemById(fullRegistryInfo, parentFolder)
		const assets = rootResponse._embedded['loc:collection']
		const hasItems = assets.paging.elements >= 1

		if (hasItems) {
			const hits = assets._embedded['loc:item'].filter((x: AssetObject) => x.base.type === BaseType.folder) as Array<AssetObject>
			log.debug(`${hits.length} folder(s) found in folder: ${parentFolder}`, logMetadata)

			const found = hits.find((x) => x.common.name.toLowerCase() === name.toLowerCase())
			if (found) {
				log.debug(`${name} in ${parentFolder} already exists`, logMetadata)
				return found
			}
		}

		return await createFolder(rootResponse, name)
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

/**
 * Create recursive folders for all folders in Projects path
 * @param fullRegistryInfo
 * @param fullFolderPath
 * @returns last created folder
 */
export async function createProjectsFoldersFullPath(fullRegistryInfo: FullRegistryInfo, fullFolderPath: string): Promise<AssetObject | undefined> {
	let productionFolders = fullFolderPath.split('/').filter((x) => x)

	let parentFolder = 'Projects'
	let newFolder
	for (const folder of productionFolders.filter((x) => x !== 'Projects')) {
		newFolder = await upsertFolder(fullRegistryInfo, folder, parentFolder)
		parentFolder = newFolder.base.id
	}
	return newFolder
}

/**
 * Create recursive folders for all folders except the root folder
 * @param fullRegistryInfo
 * @param fullFolderPath
 * @returns last created folder
 */
export async function createFoldersFullPath(fullRegistryInfo: FullRegistryInfo, fullFolderPath: string): Promise<AssetObject | undefined> {
	let productionFolders = fullFolderPath.split('/').filter((x) => x)

	let parentFolder = productionFolders[0]
	let newFolder
	for (const folder of productionFolders.filter((x) => x !== parentFolder)) {
		newFolder = await upsertFolder(fullRegistryInfo, folder, parentFolder)
		parentFolder = newFolder.base.id
	}
	return newFolder
}

/**
 * Get child folder of an given path or folder name
 * @param fullRegistryInfo
 * @param {string} root /Projects/ or /Projects/Child Folder. Example common.path
 * @returns
 */
export async function getChildFolders(fullRegistryInfo: FullRegistryInfo, root: string = 'Projects'): Promise<AssetObject[]> {
	const logMetadata: LogMetadata = { action: 'get child(s)', ref: root }
	const message = ``
	try {
		log.debug(message, logMetadata)

		const rootFolder = await getItemById(fullRegistryInfo, root)
		return await getFolderAssets(rootFolder)
	} catch (error) {
		throw error
	}
}

/**
 * Get masterclips of an given path or folder name
 * @param fullRegistryInfo
 * @param {string} root /Projects/ or /Projects/Child Folder. Example common.path
 * @returns
 */
// todo: test
export async function getMasterclipsByFolder(fullRegistryInfo: FullRegistryInfo, root: string = 'Projects'): Promise<AssetObject[]> {
	const logMetadata: LogMetadata = { action: 'get masterclip(s)', ref: root }
	const message = ``
	try {
		log.debug(message, logMetadata)

		const rootFolder = await getItemById(fullRegistryInfo, root)
		return await getFolderAssets(rootFolder)
	} catch (error) {
		throw error
	}
}

/**
 * Delete all assets in the given folder and return a delete status. Folders are not deleted
 * @param folder where the assets are in
 * @returns
 */
export async function deleteBulkAssetsInFolderWithStatus(folder: AssetObject): Promise<BulkDeleteStatusResponse | undefined> {
	const logMetadata: LogMetadata = { action: 'bulk delete', ref: folder.common.path }
	const message = ``
	log.debug(message, logMetadata)

	try {
		let bulkCommandResponse = await deleteBulkItemsInFolder(folder)
		if (bulkCommandResponse) {
			let bulkCommandStatus = await getBulkDeleteStatus(bulkCommandResponse, folder.common.path)
			const count = bulkCommandStatus.payload['command-parameters'].ids.length
			if (count === 0) return

			let timeOut = count * 300
			if (timeOut > 10000) timeOut = 10000
			let i: number
			const maxCircles = 20
			for (i = 0; i <= maxCircles; i++) {
				await delay(timeOut)
				bulkCommandStatus = await getBulkDeleteStatus(bulkCommandResponse, folder.common.path)
				log.debug(`get delete status for: ${i} times with id: ${bulkCommandStatus.command.id} completed for: ${bulkCommandStatus.command.progress || 0}%`, logMetadata)
				if (bulkCommandStatus.command.progress === 100) {
					log.debug(`done with delete all assets from: ${folder.common.path} with job: ${bulkCommandStatus.command.id}`, logMetadata)
					break
				} else {
					if (i === maxCircles) {
						log.warn(`delete operation with id: ${bulkCommandStatus.command.id} not finish within ${i * timeOut}`, logMetadata)
					}
				}
			}

			if (bulkCommandStatus.payload.result) {
				log.debug(`deleted asset(s): ${bulkCommandStatus.payload.result.filter((x) => x.success).length}, not deleted asset(s): ${bulkCommandStatus.payload.result.filter((x) => !x.success).length}`, logMetadata)

				bulkCommandStatus.payload.result.forEach((element) => {
					if (!element.success) log.warn(`${element.errorMessage}`, { action: 'bulk delete', ref: element.data })
				})
			}
			return bulkCommandStatus
		}
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

async function getFolderAssets(rootFolder: AssetObject) {
	const logMetadata: LogMetadata = { action: 'get assets', ref: rootFolder.common.path }
	let folderAssets = new Array<AssetObject>()
	const assets = rootFolder._embedded['loc:collection']
	const hasItems = assets.paging.elements >= 1

	if (hasItems) {
		folderAssets = assets._embedded['loc:item'].filter((x: AssetObject) => x.base.type === BaseType.folder) as Array<AssetObject>
		log.debug(`${folderAssets.length} folders found`, logMetadata)
	}
	return folderAssets
}

/**
 * Remove folder reservation if there is any
 * @param ctmsClient
 * @param folders with or without reservations
 * @returns array with reservation responses
 */
export async function removeReservations(folders: AssetObject[]): Promise<ReservationResponse[]> {
	const logMetadata: LogMetadata = { action: 'remove reservation', ref: 'multiple folders' }
	const foldersWithReservation = folders.filter((x) => x.status.reserved)
	log.trace(`${foldersWithReservation.length} of ${folders.length} folder(s) has a reservation`, logMetadata)

	let reservationResponses = new Array<ReservationResponse>()
	for (const reservedFolder of foldersWithReservation) {
		let response = await getReservation(reservedFolder)
		let reservationResponse = await deleteReservation(response)
		reservationResponses.push(reservationResponse)
	}
	return reservationResponses
}
