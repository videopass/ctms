import * as systemRecipes from './recipes/systemRecipes'
import * as searchRecipes from './recipes/searchRecipes'
import * as sequenceRecipes from './recipes/sequenceRecipes'
import * as asset from './operations/assetOperations'
import * as authentication from './operations/authenticateOperations'
import * as location from './operations/locationOperations'
import * as interplay from './operations/paOperations'
import * as search from './operations/searchOperations'
import * as folderRecipes from './recipes/folderRecipes'
import * as expressionRecipes from './recipes/expressionRecipes'
import { CtmsAuth, CtmsConfig } from '@videopass/ctms-model'
import ResourceStore from './stores/resourceStore'
import { getServiceRoot, getFullRegistryInfo } from './operations/registryOperations'

/**
 * The CTMS Client is the starting point for the module
 */
export class CtmsClient {
	private cachedResources: ResourceStore
	private static url: string

	private constructor(cache: ResourceStore) {
		this.cachedResources = cache
	}

	static async Init(url: string, ctmsAuth: CtmsAuth, ctmsConfig: CtmsConfig): Promise<CtmsClient> {
		this.url = url
		const rootRegistry = await authentication.getAuthEndpoint(url)
		const identityProviders = await authentication.getIdentityProviders(rootRegistry)
		const userSession = await authentication.authorize(identityProviders, ctmsAuth, ctmsConfig)
		const serviceRoot = await getServiceRoot(url)
		const fullRegistryInfo = await getFullRegistryInfo(serviceRoot)
		const resourceResponses = await systemRecipes.getResourceIndex(fullRegistryInfo)

		let client = new CtmsClient(resourceResponses)
		client.Cache.Identity = identityProviders
		return client
	}

	get Url() {
		return CtmsClient.url
	}

	/**
	 * Cache can be use to minimize the call the the CTMS api
	 * Cache has all the recourse responses needed to make the calls to the CTMS api
	 */
	// TODO: check if user session is valid
	get Cache() {
		return this.cachedResources
	}
	get Asset() {
		return asset
	}
	get Authentication() {
		return authentication
	}
	get Location() {
		return location
	}
	get Interplay() {
		return interplay
	}
	get FolderRecipes() {
		return folderRecipes
	}
	get SequenceRecipes() {
		return sequenceRecipes
	}
	get SearchRecipes() {
		return searchRecipes
	}
	get SearchExpressions() {
		return expressionRecipes
	}
	get Search() {
		return search
	}
}
