import { DateQuery, Expression, Query, QueryBody, QueryGroup, AttributeType, Filter, Any, All, ElasticValueType, ElasticBodyType, ElasticGroupType } from '@videopass/ctms-model'

/**
 * Expression to search on all assets created before a date
 * @param beforeDate
 */
export function beforeDateExpression(beforeDate: Date): Expression {
	let search = new DateQuery(ElasticValueType.less_than, 'payload._.source_item_created', beforeDate)
	let searches = new Array<DateQuery>()
	searches.push(search)

	let queryGroup: QueryGroup = { type: ElasticGroupType.boolean_metadata, condition: 'and', queries: searches }
	let queries = new Array<QueryGroup>()
	queries.push(queryGroup)

	let body: QueryBody = { type: ElasticBodyType.intersect, queries }

	let expression: Expression = {
		query: body,
		username: '',
	}
	return expression
}

/**
 * Expression for search on video ID and filter on sequences
 * @param videoId
 */
export function sequencesByVideoIdExpression(videoId: string): Expression {
	let stringifyAttribute = `payload.interplay-pam.${AttributeType.System.VideoId.toString().replace(/\./g, '%2E')}`
	let search = new Query(videoId, [stringifyAttribute])
	let searches = new Array<Query>()
	searches.push(search)

	let queryGroup: QueryGroup = { type: ElasticGroupType.boolean_metadata, condition: 'and', queries: searches }
	let queries = new Array<QueryGroup>()
	queries.push(queryGroup)

	let body: QueryBody = { type: ElasticBodyType.intersect, queries }

	let alls = new Array<All>()
	let anys = new Array<Any>()
	let any = new Any(ElasticValueType.equals, 'payload._.source_item_type', 'sequence')
	anys.push(any)
	let all = new All(ElasticBodyType.combined, anys)
	alls.push(all)
	let filter = new Filter(ElasticBodyType.combined, alls)

	let expression: Expression = {
		query: body,
		filter,
		username: '',
	}

	return expression
}

/**
 * Expression for search in daily on name and filter on folders
 * @param name
 */
export function sequencesByNameExpression(name: string): Expression {
	let search = new Query(`${name}`, ['payload._.title'])
	let searches = new Array<Query>()
	searches.push(search)

	let queryGroup: QueryGroup = { type: ElasticGroupType.boolean_metadata, condition: 'and', queries: searches }
	let queries = new Array<QueryGroup>()
	queries.push(queryGroup)

	let body: QueryBody = { type: ElasticBodyType.intersect, queries }

	let alls = new Array<All>()
	let anys = new Array<Any>()
	let any = new Any(ElasticValueType.equals, 'payload._.source_item_type', 'sequence')
	anys.push(any)
	let all = new All(ElasticBodyType.combined, anys)
	alls.push(all)
	let filter = new Filter(ElasticBodyType.combined, alls)

	let expression: Expression = {
		query: body,
		filter,
		username: '',
	}

	return expression
}
