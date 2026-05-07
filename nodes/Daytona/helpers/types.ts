export type SandboxState =
	| 'creating'
	| 'starting'
	| 'started'
	| 'stopping'
	| 'stopped'
	| 'archiving'
	| 'archived'
	| 'destroying'
	| 'destroyed'
	| 'pulling_snapshot'
	| 'restoring'
	| 'error'
	| 'unknown';

export type SandboxClass = 'small' | 'medium' | 'large';

export interface SandboxVolumeMount {
	volumeId: string;
	mountPath: string;
}

export interface Sandbox {
	id: string;
	name?: string;
	state: SandboxState;
	target?: string;
	class?: SandboxClass;
	cpu?: number;
	gpu?: number;
	memory?: number;
	disk?: number;
	user?: string;
	env?: Record<string, string>;
	labels?: Record<string, string>;
	public?: boolean;
	toolboxProxyUrl?: string;
	autoStopInterval?: number;
	autoArchiveInterval?: number;
	autoDeleteInterval?: number;
	volumes?: SandboxVolumeMount[];
	networkBlockAll?: boolean;
	networkAllowList?: string;
	createdAt?: string;
	updatedAt?: string;
	[k: string]: unknown;
}

export interface CreateSandboxRequest {
	name?: string;
	snapshot?: string;
	user?: string;
	env?: Record<string, string>;
	labels?: Record<string, string>;
	public?: boolean;
	target?: string;
	class?: SandboxClass;
	cpu?: number;
	gpu?: number;
	memory?: number;
	disk?: number;
	autoStopInterval?: number;
	autoArchiveInterval?: number;
	autoDeleteInterval?: number;
	volumes?: SandboxVolumeMount[];
	networkBlockAll?: boolean;
	networkAllowList?: string;
	ephemeral?: boolean;
}

export interface ProcessExecutionResponse {
	exitCode: number;
	result: string;
	artifacts?: {
		stdout?: string;
		stderr?: string;
		charts?: Array<Record<string, unknown>>;
	};
}

export interface PreviewUrlResponse {
	url: string;
	token: string;
	port: number;
	legacyProxyUrl?: string;
}

export interface SignedPreviewUrlResponse {
	url: string;
	port: number;
	expiresAt?: string;
}

export interface PaginatedResponse<T> {
	items: T[];
	page?: number;
	pageSize?: number;
	total?: number;
	totalPages?: number;
	hasMore?: boolean;
}
