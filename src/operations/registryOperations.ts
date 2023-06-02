import { send } from '@videopass/ctms-core'
import { AxiosRequestConfig } from 'axios'
import { FullRegistryInfo, AssetObject } from '@videopass/ctms-model'
import { LogMetadata, log } from '@videopass/services'

// http://developer.avid.com/ctms/ctms_registry_client.html#RegistrysOwnServiceRoot
const logMetadata: LogMetadata = { action: 'get', ref: 'CTMS' }
export async function getServiceRoot(url: string): Promise<AssetObject> {
	const message = 'service root'
	try {
		log.trace(message, logMetadata)

		const config: AxiosRequestConfig = { method: 'get' }

		return (await send(`${url}/apis/avid.ctms.registry;version=0;realm=global`, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

// http://developer.avid.com/ctms/ctms_registry_client.html#FullRegistryInfo
// Getting the service root via the bus operation getServiceRoot will respond with a slightly downgraded version of a Service Root resource.
export async function getFullRegistryInfo(data: AssetObject): Promise<FullRegistryInfo> {
	const message = 'full registry info'
	try {
		log.trace(message, logMetadata)

		const url = data._links['registry:serviceroots'].href.split('{')[0]
		const config: AxiosRequestConfig = { method: 'get' }
		let response = await send(url, config)
		return response.data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}
