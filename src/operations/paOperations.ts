import { send } from '@videopass/ctms-core'
import type { AxiosRequestConfig } from 'axios'
import { BasePa, CreateSequenceResponse, PaResources, MediaInfoResult, AssetObject, FileUploadResult, ImportAsset, Sequence, ReservationResponse } from '@videopass/ctms-model'
import { LogMetadata, log } from '@videopass/services'
import fs from 'fs-extra'
import * as moment from 'moment'

/**
 * Create a sequence
 * @param paResources
 * @param sequence
 */
export async function createSequence(paResources: PaResources, sequence: Sequence): Promise<CreateSequenceResponse> {
	const logMetadata: LogMetadata = { action: 'create sequence', ref: sequence.item.createSequence.name }
	const message = `in folder: ${sequence.dbPath}`
	try {
		log.debug(message, logMetadata)

		let url = paResources._links['pa:createSequence'].href
		const config: AxiosRequestConfig = { method: 'post', data: sequence }

		return (await send(url, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

// TODO: works only with masterclip that is the id
export async function createSubclip(paResources: PaResources, basePa: BasePa): Promise<CreateSequenceResponse> {
	const logMetadata: LogMetadata = { action: 'create masterclip', ref: basePa.item.createSequence.name }
	const message = `${basePa.item.createSequence.type} sub clip with name: ${basePa.item.createSequence.name} in folder : ${basePa.dbPath}`
	try {
		log.debug(message, logMetadata)

		let assetId = '1' // TODO: get id from response
		let url = paResources._links['pa:createSubclip'].href.replace('{assetId}', assetId)
		const config: AxiosRequestConfig = { method: 'post', data: basePa }

		return (await send(url, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

/**
 * Upload file to Interplay
 * http://developer.avid.com/ctms/api/rs_loc/rs_loc_item.html#_pa_upload_file
 * @param asset
 * @param pathToFile
 */
export async function uploadFile(asset: AssetObject, pathToFile: string): Promise<FileUploadResult> {
	const logMetadata: LogMetadata = { action: 'upload file', ref: asset.common.name }
	const message = `${pathToFile}`
	try {
		log.debug(message, logMetadata)

		let file = await fs.readFile(pathToFile)
		let url = asset._links['pa:upload-file'].href
		const config: AxiosRequestConfig = { method: 'put', data: file }

		return (await send(url, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

/**
 * Import file which is uploaded with uploadFile
 * http://developer.avid.com/ctms/api/rs_loc/rs_loc_item.html#_pa_import_asset
 * @param importTo
 * @param importAsset
 * //FIXME: not working is other name. data object is not correct
 */
export async function importAsset(importTo: AssetObject, importAsset: ImportAsset): Promise<AssetObject> {
	const logMetadata: LogMetadata = { action: 'import file', ref: importAsset.fileName }
	const message = `${importAsset.fileName}`
	try {
		log.debug(message, logMetadata)
		// console.log(JSON.stringify(importTo, null, 1))
		let url = importTo._links['pa:import-asset-command'].href
		const config: AxiosRequestConfig = { method: 'post', data: importAsset }

		return (await send(url, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

export async function getMediaInfoById(paResources: PaResources, id: string): Promise<MediaInfoResult> {
	const logMetadata: LogMetadata = { action: 'media info', ref: id }
	const message = `get media info for: ${id}`
	try {
		log.info(message, logMetadata)

		let url = paResources._links['pa:mediaInfo-by-id'].href.replace('{assetId}', id)
		const config: AxiosRequestConfig = { method: 'get' }

		return (await send(url, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

// FIXME:
export async function getMediaInfoBulk(paResources: PaResources, ids: string[]): Promise<any> {
	const idsString = ids.join(', ')
	const logMetadata: LogMetadata = { action: 'bulk media info', ref: idsString }
	const message = `for: ${idsString}`
	try {
		log.debug(message, logMetadata)

		let url = paResources._links['pa:mediainfo-command'].href
		const config: AxiosRequestConfig = { method: 'post', data: ids }

		return await send(url, config)
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

// FIXME:
export async function getMediaInfoBulkStatus(paResources: PaResources, ids: string[]): Promise<any> {
	const idsString = ids.join(', ')
	const logMetadata: LogMetadata = { action: 'bulk media info', ref: idsString }
	const message = `get info media info bulk for: ${idsString}`
	try {
		log.debug(message, logMetadata)

		let url = paResources._links['pa:mediaInfoBulk'].href
		const config: AxiosRequestConfig = { method: 'post', data: ids }

		return await send(url, config)
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

/**
 *
 * {@link https://developer.avid.com/ctms/api/rs_pa/rs_pa_reservations.html#_pa_create_reservation}
 * @param reservationResponse
 * @param expirationDate Date format : IS8601. Example "2019-02-15T13:42:01.039Z"
 */
export async function createReservation(reservationResponse: ReservationResponse, expirationDate: Date = moment().add(1, 'day').toDate()): Promise<ReservationResponse> {
	const paths = reservationResponse._links.self.href.split('/')
	const logMetadata: LogMetadata = { action: 'create reservation', ref: paths[paths.length - 1] }
	const message = ``
	try {
		log.debug(message, logMetadata)

		let url = reservationResponse._links['pa:create-reservation'].href
		const config: AxiosRequestConfig = { method: 'post', data: { expirationDate: moment(expirationDate).toISOString() } }

		return await (
			await send(url, config)
		).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

export async function deleteReservation(reservationResponse: ReservationResponse): Promise<ReservationResponse> {
	const paths = reservationResponse._links.self.href.split('/')
	const logMetadata: LogMetadata = { action: 'delete reservation', ref: paths[paths.length - 1] }
	const message = ``
	try {
		log.debug(message, logMetadata)

		let url = `${reservationResponse._links['pa:create-reservation'].href}?user=all-users`
		const config: AxiosRequestConfig = { method: 'DELETE' }

		return await (
			await send(url, config)
		).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

export async function getReservation(asset: AssetObject): Promise<ReservationResponse> {
	const logMetadata: LogMetadata = { action: 'get reservation', ref: asset.base.id }
	const message = ``
	try {
		log.debug(message, logMetadata)

		let url = asset._links['pa:reservations'].href
		const config: AxiosRequestConfig = { method: 'get' }

		return await (
			await send(url, config)
		).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

export async function getAssociations(asset: AssetObject): Promise<AssetObject> {
	const logMetadata: LogMetadata = { action: 'get associations', ref: asset.base.id }
	const message = ``
	try {
		log.debug(message, logMetadata)

		let url = asset._links['pa:asset-associations'].href
		const config: AxiosRequestConfig = { method: 'get' }

		return await (
			await send(url, config)
		).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}
