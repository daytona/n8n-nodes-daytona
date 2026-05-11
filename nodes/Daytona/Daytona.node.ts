import {
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	type JsonObject,
} from 'n8n-workflow';

import * as codeRunCode from './actions/code/runCode.operation';
import * as codeRunCommand from './actions/code/runCommand.operation';
import * as fileDownload from './actions/file/download.operation';
import * as fileUpload from './actions/file/upload.operation';
import * as gitClone from './actions/git/clone.operation';
import * as sandboxCreate from './actions/sandbox/create.operation';
import * as sandboxDelete from './actions/sandbox/delete.operation';
import * as sandboxGet from './actions/sandbox/get.operation';
import * as sandboxGetMany from './actions/sandbox/getMany.operation';
import * as sandboxGetPreviewUrl from './actions/sandbox/getPreviewUrl.operation';
import * as sandboxStart from './actions/sandbox/start.operation';
import * as sandboxStop from './actions/sandbox/stop.operation';
import * as snapshotActivate from './actions/snapshot/activate.operation';
import * as snapshotCreate from './actions/snapshot/create.operation';
import * as snapshotDeactivate from './actions/snapshot/deactivate.operation';
import * as snapshotDelete from './actions/snapshot/delete.operation';
import * as snapshotGet from './actions/snapshot/get.operation';
import * as snapshotGetMany from './actions/snapshot/getMany.operation';
import * as volumeCreate from './actions/volume/create.operation';
import * as volumeDelete from './actions/volume/delete.operation';
import * as volumeGet from './actions/volume/get.operation';
import * as volumeGetMany from './actions/volume/getMany.operation';
import { getSnapshots } from './methods/loadOptions';

export class Daytona implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Daytona',
		name: 'daytona',
		icon: { light: 'file:daytona.svg', dark: 'file:daytona.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Manage Daytona sandboxes and run code, commands, file ops, and git clones',
		defaults: {
			name: 'Daytona',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'daytonaApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Code',
						value: 'code',
					},
					{
						name: 'File',
						value: 'file',
					},
					{
						name: 'Git',
						value: 'git',
					},
					{
						name: 'Sandbox',
						value: 'sandbox',
					},
					{
						name: 'Snapshot',
						value: 'snapshot',
					},
					{
						name: 'Volume',
						value: 'volume',
					},
				],
				default: 'sandbox',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['code'] } },
				options: [
					{
						name: 'Run Code',
						value: 'runCode',
						action: 'Run code in a sandbox',
						description:
							'Execute Python, JavaScript, or TypeScript inside a sandbox. Optionally creates an ephemeral sandbox just for this execution.',
					},
					{
						name: 'Run Command',
						value: 'runCommand',
						action: 'Run a command in a sandbox',
						description:
							'Execute a shell command inside a sandbox. Optionally creates an ephemeral sandbox just for this execution.',
					},
				],
				default: 'runCode',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['file'] } },
				options: [
					{
						name: 'Download',
						value: 'download',
						action: 'Download a file from a sandbox',
						description: 'Read a file from a sandbox path and emit it as binary output',
					},
					{
						name: 'Upload',
						value: 'upload',
						action: 'Upload a file to a sandbox',
						description: 'Send the input item\u2019s binary field to a sandbox path',
					},
				],
				default: 'upload',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['git'] } },
				options: [
					{
						name: 'Clone',
						value: 'clone',
						action: 'Clone a git repository into a sandbox',
						description: 'Clone a git repository into a path inside the sandbox',
					},
				],
				default: 'clone',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['sandbox'] } },
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create a sandbox',
						description: 'Create a new sandbox, optionally waiting until it is started',
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete a sandbox',
						description: 'Permanently delete a sandbox by ID',
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get a sandbox',
						description: 'Retrieve a single sandbox by ID',
					},
					{
						name: 'Get Many',
						value: 'getMany',
						action: 'Get many sandboxes',
						description: 'List sandboxes in the current organization',
					},
					{
						name: 'Get Preview URL',
						value: 'getPreviewUrl',
						action: 'Get a preview URL',
						description: 'Generate a public preview URL for a port exposed inside a sandbox',
					},
					{
						name: 'Start',
						value: 'start',
						action: 'Start a sandbox',
						description: 'Start a stopped sandbox, optionally waiting until it is started',
					},
					{
						name: 'Stop',
						value: 'stop',
						action: 'Stop a sandbox',
						description: 'Stop a running sandbox',
					},
				],
				default: 'getMany',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['snapshot'] } },
				options: [
					{
						name: 'Activate',
						value: 'activate',
						action: 'Activate a snapshot',
						description: 'Mark a snapshot as active so it becomes usable for sandbox creation',
					},
					{
						name: 'Create',
						value: 'create',
						action: 'Create a snapshot',
						description: 'Create a new snapshot from a Docker image',
					},
					{
						name: 'Deactivate',
						value: 'deactivate',
						action: 'Deactivate a snapshot',
						description: 'Mark a snapshot as inactive',
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete a snapshot',
						description: 'Permanently delete a snapshot',
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get a snapshot',
						description: 'Retrieve a single snapshot by ID or name',
					},
					{
						name: 'Get Many',
						value: 'getMany',
						action: 'Get many snapshots',
						description: 'List snapshots in the current organization with optional filters',
					},
				],
				default: 'getMany',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['volume'] } },
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create a volume',
						description: 'Create a new persistent volume',
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete a volume',
						description: 'Delete a volume by ID or name',
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get a volume',
						description: 'Retrieve a single volume by ID or name',
					},
					{
						name: 'Get Many',
						value: 'getMany',
						action: 'Get many volumes',
						description: 'List volumes in the current organization',
					},
				],
				default: 'getMany',
			},
			...codeRunCode.description,
			...codeRunCommand.description,
			...fileDownload.description,
			...fileUpload.description,
			...gitClone.description,
			...sandboxCreate.description,
			...sandboxDelete.description,
			...sandboxGet.description,
			...sandboxGetMany.description,
			...sandboxGetPreviewUrl.description,
			...sandboxStart.description,
			...sandboxStop.description,
			...snapshotActivate.description,
			...snapshotCreate.description,
			...snapshotDeactivate.description,
			...snapshotDelete.description,
			...snapshotGet.description,
			...snapshotGetMany.description,
			...volumeCreate.description,
			...volumeDelete.description,
			...volumeGet.description,
			...volumeGetMany.description,
		],
	};

	methods = {
		loadOptions: {
			getSnapshots,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;
			const opKey = `${resource}.${operation}`;

			try {
				let opResult: INodeExecutionData[];
				switch (opKey) {
					case 'code.runCode':
						opResult = await codeRunCode.execute.call(this, i);
						break;
					case 'code.runCommand':
						opResult = await codeRunCommand.execute.call(this, i);
						break;
					case 'file.download':
						opResult = await fileDownload.execute.call(this, i);
						break;
					case 'file.upload':
						opResult = await fileUpload.execute.call(this, i);
						break;
					case 'git.clone':
						opResult = await gitClone.execute.call(this, i);
						break;
					case 'sandbox.create':
						opResult = await sandboxCreate.execute.call(this, i);
						break;
					case 'sandbox.delete':
						opResult = await sandboxDelete.execute.call(this, i);
						break;
					case 'sandbox.get':
						opResult = await sandboxGet.execute.call(this, i);
						break;
					case 'sandbox.getMany':
						opResult = await sandboxGetMany.execute.call(this, i);
						break;
					case 'sandbox.getPreviewUrl':
						opResult = await sandboxGetPreviewUrl.execute.call(this, i);
						break;
					case 'sandbox.start':
						opResult = await sandboxStart.execute.call(this, i);
						break;
					case 'sandbox.stop':
						opResult = await sandboxStop.execute.call(this, i);
						break;
					case 'snapshot.activate':
						opResult = await snapshotActivate.execute.call(this, i);
						break;
					case 'snapshot.create':
						opResult = await snapshotCreate.execute.call(this, i);
						break;
					case 'snapshot.deactivate':
						opResult = await snapshotDeactivate.execute.call(this, i);
						break;
					case 'snapshot.delete':
						opResult = await snapshotDelete.execute.call(this, i);
						break;
					case 'snapshot.get':
						opResult = await snapshotGet.execute.call(this, i);
						break;
					case 'snapshot.getMany':
						opResult = await snapshotGetMany.execute.call(this, i);
						break;
					case 'volume.create':
						opResult = await volumeCreate.execute.call(this, i);
						break;
					case 'volume.delete':
						opResult = await volumeDelete.execute.call(this, i);
						break;
					case 'volume.get':
						opResult = await volumeGet.execute.call(this, i);
						break;
					case 'volume.getMany':
						opResult = await volumeGetMany.execute.call(this, i);
						break;
					default:
						throw new NodeOperationError(
							this.getNode(),
							`Operation "${opKey}" is not implemented yet.`,
							{ itemIndex: i },
						);
				}
				returnData.push(...opResult);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				if (error instanceof NodeOperationError) {
					throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
