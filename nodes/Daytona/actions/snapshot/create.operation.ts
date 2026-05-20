import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

import { API_ENDPOINTS } from '../../helpers/constants';
import { daytonaApiRequest } from '../../helpers/transport';
import type { CreateSnapshotRequest, Snapshot } from '../../helpers/types';
import { omitUndefined } from '../../helpers/utils';

const showOnly = { resource: ['snapshot'], operation: ['create'] };

export const description: INodeProperties[] = [
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'my-snapshot',
		description: 'Name for the new snapshot (must be unique in the organization)',
		displayOptions: { show: showOnly },
	},
	{
		displayName: 'Image Name',
		name: 'imageName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'python:3.11-slim',
		description: 'Docker image to base the snapshot on (must be publicly accessible)',
		displayOptions: { show: showOnly },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: showOnly },
		options: [
			{
				displayName: 'CPU',
				name: 'cpu',
				type: 'number',
				default: 0,
				description: 'Number of CPU cores',
			},
			{
				displayName: 'Disk (GB)',
				name: 'disk',
				type: 'number',
				default: 0,
				description: 'Disk space in gigabytes',
			},
			{
				displayName: 'Entrypoint',
				name: 'entrypoint',
				type: 'string',
				default: '',
				placeholder: 'sleep infinity',
				description:
					'Comma-separated entrypoint command and arguments (e.g. <code>sleep infinity</code>)',
			},
			{
				displayName: 'Memory (GB)',
				name: 'memory',
				type: 'number',
				default: 0,
				description: 'Memory in gigabytes',
			},
			{
				displayName: 'Region ID',
				name: 'regionId',
				type: 'string',
				default: '',
				description: 'Daytona region to host the snapshot in',
			},
		],
	},
];

interface AdditionalFields {
	cpu?: number;
	disk?: number;
	entrypoint?: string;
	memory?: number;
	regionId?: string;
}

export async function execute(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const name = (this.getNodeParameter('name', itemIndex) as string).trim();
	const imageName = (this.getNodeParameter('imageName', itemIndex) as string).trim();
	const additional = this.getNodeParameter('additionalFields', itemIndex, {}) as AdditionalFields;

	const entrypointArray = additional.entrypoint?.trim()
		? additional.entrypoint
				.split(',')
				.map((part) => part.trim())
				.filter((part) => part.length > 0)
		: undefined;

	const body: CreateSnapshotRequest = omitUndefined({
		name,
		imageName,
		cpu: additional.cpu || undefined,
		memory: additional.memory || undefined,
		disk: additional.disk || undefined,
		regionId: additional.regionId?.trim() || undefined,
		entrypoint: entrypointArray,
	}) as CreateSnapshotRequest;

	const created = (await daytonaApiRequest.call(
		this,
		'POST',
		API_ENDPOINTS.snapshot.create,
		body as unknown as IDataObject,
	)) as Snapshot;

	return [
		{
			json: created as unknown as IDataObject,
			pairedItem: { item: itemIndex },
		},
	];
}
