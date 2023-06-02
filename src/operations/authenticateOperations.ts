import { send } from '@videopass/ctms-core'
import axios, { AxiosRequestConfig } from 'axios'
import { CtmsAuth, CtmsConfig, ResourceEntryPoint, IdentityProviders, UserSession } from '@videopass/ctms-model'
import { buildUrlQueryString } from '../helpers/urlBuilder'
import { LogMetadata, log } from '@videopass/services'

// http://developer.avid.com/upstream/platformAuthorization/documentation-public/md/authentication.html#Entry-Point-Resource
const logMetadata: LogMetadata = { action: 'authorize', ref: 'CTMS' }


export async function getAuthEndpoint(url: string): Promise<ResourceEntryPoint> {
	const fullUrl = `${url}/auth`
	const message = `get authorization end point with url: ${fullUrl}`
	try {
		log.debug(message, logMetadata)

		const config: AxiosRequestConfig = { method: 'get' }

		return (await send(fullUrl, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

// http://developer.avid.com/upstream/platformAuthorization/documentation-public/md/authentication.html#Identity-Providers
export async function getIdentityProviders(data: ResourceEntryPoint): Promise<IdentityProviders> {
	const message = 'get identity providers'
	try {
		log.debug(message, logMetadata)

		const config: AxiosRequestConfig = { method: 'get' }
		const url = data._links['auth:identity-providers'][0].href

		return (await send(url, config)).data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}

// http://developer.avid.com/upstream/platformAuthorization/documentation-public/md/authentication.html#Obtaining-a-Token-Resource-Owner-Password-Credentials-Grant
export async function authorize(identityProviders: IdentityProviders, ctmsAuth: CtmsAuth, ctmsConfig: CtmsConfig): Promise<UserSession> {
	const message = 'login'
	try {
		log.debug(message, logMetadata)
		const dataObject = buildUrlQueryString(ctmsAuth)

		
		//let authorizationDefaultToken = Buffer.from(clientId + ':' + clientSecret).toString('base64')

		let headers = {}
		headers['authorization'] = `Basic ${ctmsConfig.clientToken}`
		// headers['authorization'] = `Basic ${authorizationDefaultToken}`
		headers['content-type'] = 'application/x-www-form-urlencoded'

		const config: AxiosRequestConfig = { data: dataObject, method: 'post', headers }
		const url = identityProviders._embedded['auth:identity-provider'].find((x: any) => x._links['auth:ropc-default'])._links['auth:ropc-default'][0].href

		let response = await send(url, config)

		const userSession: UserSession = response.data

		headers = {}
		headers['authorization'] = `Bearer ${userSession.access_token}`
		headers['Content-Type'] = 'application/hal+json'
		headers['Accept'] = 'application/hal+json'
		axios.defaults.headers.common = headers

		return response.data
	} catch (error) {
		log.error(error, logMetadata, message)
		throw error
	}
}
