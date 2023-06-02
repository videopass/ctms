import { send } from '@videopass/ctms-core'
import { AxiosRequestConfig, AxiosResponse } from 'axios'
import { UserSession, FullRegistryInfo } from '@videopass/ctms-model'
import { log } from '@videopass/services'

// http://developer.avid.com/ctms/api/rs_datamodel/rs_datamodel_aggregator_client.html#DataModelInfosOwnServiceRoot
export async function getRootDataModel(response: AxiosResponse<UserSession>): Promise<AxiosResponse> {
	const message = `get root data model`
	try {
		log.debug(message)
		let { config, data } = response

		let url = ''
		if (config.url) {
			url = new URL(config.url).origin
		}

		let headers = {}
		headers['authorization'] = `Bearer ${data.access_token}`
		headers['Content-Type'] = 'application/json'

		const reqConfig: AxiosRequestConfig = { method: 'get', headers, url: config.url } as AxiosRequestConfig

		return (await send(`${url}/apis/avid.ctms.datamodel.aggregator;version=0;realm=global`, reqConfig)) as any
	} catch (error) {
		log.error(error, message)
		throw error
	}
}

// http://developer.avid.com/ctms/api/rs_datamodel/rs_datamodel_aggregator_client.html#DataModelInfo
export async function getCompleteDatamodel(data: FullRegistryInfo, language: string = ''): Promise<AxiosResponse> {
	const message = `get complete data model with language: ${language}`
	try {
		log.debug(message)

		const url = data._links['datamodel:aggregated-model'][0].href.replace('{?lang}', `?lang=${language}`)
		const config: AxiosRequestConfig = { method: 'get' }

		return (await send(url, config)) as any
	} catch (error) {
		log.error(error, message)
		throw error
	}
}

/**
 * not implemented
 * https://developer.avid.com/ctms/api/datamodel/linkrels/asset-model.html
 */
