import { AssetResources, FullRegistryInfo, IdentityProviders, LocationResources, PaResources, SearchResources } from '@videopass/ctms-model'

export default class ResourceStore {
	private full!: FullRegistryInfo
	private pa!: PaResources
	private search!: SearchResources
	private location!: LocationResources
	private asset!: AssetResources
	private identity!: IdentityProviders

	set Full(full: FullRegistryInfo) {
		this.full = full
	}
	set Pa(pa: PaResources) {
		this.pa = pa
	}
	set Search(search: SearchResources) {
		this.search = search
	}
	set Asset(asset: AssetResources) {
		this.asset = asset
	}
	set Location(location: LocationResources) {
		this.location = location
	}
	set Identity(identity: IdentityProviders) {
		this.identity = identity
	}

	get Identity() {
		return this.identity
	}
	get Full() {
		return this.full
	}
	get Pa() {
		return this.pa
	}
	get Search() {
		return this.search
	}
	get Location() {
		return this.location
	}
	get Asset() {
		return this.asset
	}
}
