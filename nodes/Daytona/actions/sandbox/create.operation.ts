import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

import { API_ENDPOINTS } from '../../helpers/constants';
import { daytonaApiRequest, waitForSandboxState } from '../../helpers/transport';
import type { CreateSandboxRequest, Sandbox } from '../../helpers/types';
import { fixedCollectionToObject, omitUndefined } from '../../helpers/utils';

const showOnly = { resource: ['sandbox'], operation: ['create'] };

export const description: INodeProperties[] = [
	{
		displayName: 'Snapshot',
		name: 'snapshot',
		type: 'string',
		default: '',
		placeholder: 'snapshot-ID-or-name',
		description:
			'Snapshot ID or name to base the sandbox on. Leave empty to use the Daytona organization default.',
		displayOptions: { show: showOnly },
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		description: 'Optional human-friendly name for the sandbox',
		displayOptions: { show: showOnly },
	},
	{
		displayName: 'Ephemeral',
		name: 'ephemeral',
		type: 'boolean',
		default: false,
		description:
			'Whether the sandbox is auto-deleted as soon as it stops. Equivalent to setting Auto-Delete Interval to 0.',
		displayOptions: { show: showOnly },
	},
	{
		displayName: 'Wait Until Started',
		name: 'waitUntilStarted',
		type: 'boolean',
		default: true,
		description: 'Whether to poll until the sandbox reaches the "started" state before returning',
		displayOptions: { show: showOnly },
	},
	{
		displayName: 'Wait Timeout (Seconds)',
		name: 'waitTimeoutSeconds',
		type: 'number',
		default: 60,
		typeOptions: { minValue: 1, maxValue: 600 },
		description: 'Maximum time to wait for the sandbox to reach the "started" state',
		displayOptions: { show: { ...showOnly, waitUntilStarted: [true] } },
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
				displayName: 'Auto-Archive Interval (Minutes)',
				name: 'autoArchiveInterval',
				type: 'number',
				default: 0,
				description:
					'Minutes a stopped sandbox can stay before being archived. 0 disables.',
			},
			{
				displayName: 'Auto-Delete Interval (Minutes)',
				name: 'autoDeleteInterval',
				type: 'number',
				default: 0,
				description:
					'Minutes a stopped sandbox can stay before being deleted. 0 deletes immediately on stop (ephemeral). -1 disables.',
			},
			{
				displayName: 'Auto-Stop Interval (Minutes)',
				name: 'autoStopInterval',
				type: 'number',
				default: 0,
				description: 'Minutes of inactivity before the sandbox is auto-stopped. 0 disables.',
			},
			{
				displayName: 'Class',
				name: 'class',
				type: 'options',
				default: '',
				description: 'Pre-defined sandbox size class',
				options: [
					{ name: '(Default)', value: '' },
					{ name: 'Small', value: 'small' },
					{ name: 'Medium', value: 'medium' },
					{ name: 'Large', value: 'large' },
				],
			},
			{
				displayName: 'CPU',
				name: 'cpu',
				type: 'number',
				default: 0,
				description: 'Number of CPU cores. 0 to use the class default.',
			},
			{
				displayName: 'Disk (GB)',
				name: 'disk',
				type: 'number',
				default: 0,
				description: 'Disk space in gigabytes. 0 to use the class default.',
			},
			{
				displayName: 'Environment Variables',
				name: 'env',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				placeholder: 'Add Environment Variable',
				default: {},
				options: [
					{
						name: 'entry',
						displayName: 'Variable',
						values: [
							{
								displayName: 'Name',
								name: 'name',
								type: 'string',
								default: '',
								description: 'Name of the environment variable',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Value of the environment variable',
							},
						],
					},
				],
			},
			{
				displayName: 'GPU',
				name: 'gpu',
				type: 'number',
				default: 0,
				description: 'Number of GPU units. 0 disables GPU allocation.',
			},
			{
				displayName: 'Labels',
				name: 'labels',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				placeholder: 'Add Label',
				default: {},
				options: [
					{
						name: 'entry',
						displayName: 'Label',
						values: [
							{
								displayName: 'Key',
								name: 'name',
								type: 'string',
								default: '',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
							},
						],
					},
				],
			},
			{
				displayName: 'Memory (GB)',
				name: 'memory',
				type: 'number',
				default: 0,
				description: 'Memory in gigabytes. 0 to use the class default.',
			},
			{
				displayName: 'Network Allow List',
				name: 'networkAllowList',
				type: 'string',
				default: '',
				placeholder: '208.80.154.232/32,10.0.0.0/8',
				description: 'Comma-separated CIDR list of allowed outbound destinations',
			},
			{
				displayName: 'Network Block All',
				name: 'networkBlockAll',
				type: 'boolean',
				default: false,
				description: 'Whether to block all outbound network access',
			},
			{
				displayName: 'Public',
				name: 'public',
				type: 'boolean',
				default: false,
				description: 'Whether to enable public preview URLs for this sandbox',
			},
			{
				displayName: 'Target Region',
				name: 'target',
				type: 'string',
				default: '',
				placeholder: 'us',
				description:
					'Daytona region to create the sandbox in (e.g. "us", "eu"). Leave empty for the organization default.',
			},
			{
				displayName: 'User',
				name: 'user',
				type: 'string',
				default: '',
				description: 'OS user inside the sandbox. Defaults to "daytona".',
			},
		],
	},
];

interface AdditionalFields {
	autoArchiveInterval?: number;
	autoDeleteInterval?: number;
	autoStopInterval?: number;
	class?: string;
	cpu?: number;
	disk?: number;
	env?: { entry?: Array<{ name: string; value: string }> };
	gpu?: number;
	labels?: { entry?: Array<{ name: string; value: string }> };
	memory?: number;
	networkAllowList?: string;
	networkBlockAll?: boolean;
	public?: boolean;
	target?: string;
	user?: string;
}

export async function execute(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const snapshot = (this.getNodeParameter('snapshot', itemIndex, '') as string).trim();
	const name = (this.getNodeParameter('name', itemIndex, '') as string).trim();
	const ephemeral = this.getNodeParameter('ephemeral', itemIndex, false) as boolean;
	const waitUntilStarted = this.getNodeParameter('waitUntilStarted', itemIndex, true) as boolean;
	const waitTimeoutSeconds = this.getNodeParameter('waitTimeoutSeconds', itemIndex, 60) as number;
	const additional = this.getNodeParameter(
		'additionalFields',
		itemIndex,
		{},
	) as AdditionalFields;

	const body: CreateSandboxRequest = omitUndefined({
		snapshot: snapshot || undefined,
		name: name || undefined,
		ephemeral: ephemeral || undefined,
		user: additional.user || undefined,
		public: additional.public || undefined,
		target: additional.target || undefined,
		class: (additional.class as 'small' | 'medium' | 'large' | undefined) || undefined,
		cpu: additional.cpu || undefined,
		gpu: additional.gpu || undefined,
		memory: additional.memory || undefined,
		disk: additional.disk || undefined,
		autoStopInterval: additional.autoStopInterval || undefined,
		autoArchiveInterval: additional.autoArchiveInterval || undefined,
		autoDeleteInterval:
			typeof additional.autoDeleteInterval === 'number'
				? additional.autoDeleteInterval
				: undefined,
		networkBlockAll: additional.networkBlockAll || undefined,
		networkAllowList: additional.networkAllowList || undefined,
		env: fixedCollectionToObject(additional.env),
		labels: fixedCollectionToObject(additional.labels),
	}) as CreateSandboxRequest;

	const created = (await daytonaApiRequest.call(
		this,
		'POST',
		API_ENDPOINTS.sandbox.create,
		body as unknown as IDataObject,
	)) as Sandbox;

	const sandboxId = created.id;

	let final: Sandbox = created;
	if (waitUntilStarted && created.state !== 'started') {
		final = await waitForSandboxState.call(this, sandboxId, {
			targetStates: ['started'],
			timeoutMs: waitTimeoutSeconds * 1000,
		});
	}

	return [
		{
			json: final as unknown as IDataObject,
			pairedItem: { item: itemIndex },
		},
	];
}
