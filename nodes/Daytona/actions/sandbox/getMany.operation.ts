import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

import { API_ENDPOINTS } from '../../helpers/constants';
import { daytonaApiRequest } from '../../helpers/transport';
import type { PaginatedResponse, Sandbox } from '../../helpers/types';

const showOnly = { resource: ['sandbox'], operation: ['getMany'] };

export const description: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: showOnly },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: { minValue: 1, maxValue: 100 },
		description: 'Max number of results to return',
		displayOptions: {
			show: { ...showOnly, returnAll: [false] },
		},
	},
];

const PAGE_SIZE = 100;

export async function execute(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
	const limit = this.getNodeParameter('limit', itemIndex, 50) as number;

	const sandboxes: Sandbox[] = [];
	let page = 1;
	const pageLimit = returnAll ? PAGE_SIZE : limit;

	while (true) {
		const response = (await daytonaApiRequest.call(
			this,
			'GET',
			API_ENDPOINTS.sandbox.list,
			undefined,
			{ page, limit: pageLimit },
		)) as PaginatedResponse<Sandbox> | Sandbox[];

		const batch = Array.isArray(response) ? response : (response?.items ?? []);
		sandboxes.push(...batch);

		if (!returnAll) break;
		if (batch.length < pageLimit) break;
		if (!Array.isArray(response) && response?.hasMore === false) break;
		if (!Array.isArray(response) && response?.totalPages && page >= response.totalPages) break;

		page++;
	}

	return sandboxes.map((sandbox) => ({
		json: sandbox as unknown as IDataObject,
		pairedItem: { item: itemIndex },
	}));
}
