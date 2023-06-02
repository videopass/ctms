import { FullRegistryInfo, Resource, ResourceDescription, ResourceLink } from '@videopass/ctms-model'
import { log } from '@videopass/services'
import { clone, difference, sortBy, uniqWith } from 'rambda'
import { getAssetResources, getLocationResources, getPaResources, getSearchResources, getTaxonomiesResources } from '../operations/resourceOperations'
import ResourceStore from '../stores/resourceStore'

export async function getResourceIndex(FullRegistryInfo: FullRegistryInfo): Promise<ResourceStore> {
	let resourceResponses = new ResourceStore()

	let resources: Resource[] = new Array<Resource>()
	resourceResponses.Full = FullRegistryInfo
	for (const resource in FullRegistryInfo.resources) {
		let resourceDescription: ResourceDescription[] = FullRegistryInfo.resources[resource]
		resources.push({ name: resource, descriptions: resourceDescription })
	}

	let resourceLinks: ResourceLink[] = new Array<ResourceLink>()
	for (const resource of resources) {
		for (const description of resource.descriptions) {
			resourceLinks.push({ name: resource.name, href: description.href })
		}
	}

	const fromServiceRoot = clone(resourceLinks)

	const assetResources = await getAssetResources(FullRegistryInfo)
	resourceResponses.Asset = assetResources
	for (const link in assetResources._links) {
		if (!(link === 'self' || link === 'curies')) resourceLinks.push({ name: link, href: assetResources._links[link].href })
	}

	const locationResources = await getLocationResources(FullRegistryInfo)
	resourceResponses.Location = locationResources
	for (const link in locationResources._links) {
		if (!(link === 'self' || link === 'curies')) resourceLinks.push({ name: link, href: locationResources._links[link].href })
	}

	const searchResources = await getSearchResources(FullRegistryInfo)
	resourceResponses.Search = searchResources
	for (const link in searchResources._links) {
		if (!(link === 'self' || link === 'curies')) resourceLinks.push({ name: link, href: searchResources._links[link].href })
	}

	const taxonomiesResources = await getTaxonomiesResources(FullRegistryInfo)
	for (const link in taxonomiesResources._links) {
		if (!(link === 'self' || link === 'curies')) resourceLinks.push({ name: link, href: taxonomiesResources._links[link].href })
	}

	const PaResources = await getPaResources(FullRegistryInfo)
	resourceResponses.Pa = PaResources
	for (const link in PaResources._links) {
		if (!(link === 'self' || link === 'curies')) resourceLinks.push({ name: link, href: PaResources._links[link].href })
	}

	const uniqFn = (x: ResourceLink, y: ResourceLink) => x.name === y.name
	const uniqResources = uniqWith(
		uniqFn,
		sortBy((x) => x.name, resourceLinks)
	)
	for (const link of uniqResources) {
		log.trace(`${link.name} |  ${link.href}`)
	}

	let differences = difference(uniqResources, fromServiceRoot)
	log.trace('Not in service root response')
	for (const link of differences) {
		log.trace(`${link.name} | ${link.href}`)
	}

	return resourceResponses
}
