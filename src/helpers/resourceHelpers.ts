import { AssetObject } from "@videopass/ctms-model"

// TODO: test what is better with paging count check or ?[loc:item]
export function getItems(folder: AssetObject): AssetObject[] {
	if (folder._embedded?.['loc:collection']?._embedded) {
		if (folder._embedded?.['loc:collection']?._embedded['loc:item']) {
			return folder._embedded['loc:collection']._embedded['loc:item']
		}
		return new Array<AssetObject>()
	}
	return new Array<AssetObject>()
}
