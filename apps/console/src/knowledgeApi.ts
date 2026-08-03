export interface KnowledgeNetworkStatistics {
  object_types: number;
  relation_types: number;
  action_types: number;
  concept_groups: number;
}

export interface KnowledgeNetwork {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  statistics: KnowledgeNetworkStatistics | null;
}

export interface KnowledgeNetworkPage {
  items: KnowledgeNetwork[];
  offset: number;
  limit: number;
}

export interface CreateKnowledgeNetworkRequest {
  name: string;
  description?: string;
  tags: string[];
}

export interface BuildReceipt {
  knowledge_network_id: string;
  state: "accepted";
}

export type ObjectFieldType =
  | "string"
  | "integer"
  | "decimal"
  | "datetime"
  | "boolean";

export interface ObjectTypeField {
  name: string;
  display_name: string;
  type: ObjectFieldType;
}

export interface ObjectType {
  id: string;
  knowledge_network_id: string;
  name: string;
  primary_keys: string[];
  display_key: string;
  fields: ObjectTypeField[];
}

export interface ObjectTypePage {
  items: ObjectType[];
}

export interface CreateObjectTypeRequest {
  name: string;
  primary_key: string;
  display_key: string;
  fields: ObjectTypeField[];
}

interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
    retryable?: boolean;
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly retryable: boolean;

  constructor(
    message: string,
    status: number,
    code?: string,
    retryable = false,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    let payload: ApiErrorPayload = {};
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      // The status code remains actionable when an upstream proxy returns non-JSON.
    }
    throw new ApiError(
      payload.error?.message ?? `请求失败（${response.status}）`,
      response.status,
      payload.error?.code,
      payload.error?.retryable ?? false,
    );
  }
  return (await response.json()) as T;
}

export function listKnowledgeNetworks(
  namePattern = "",
  signal?: AbortSignal,
): Promise<KnowledgeNetworkPage> {
  const query = new URLSearchParams({ offset: "0", limit: "50" });
  if (namePattern.trim()) query.set("name_pattern", namePattern.trim());
  return request(`/api/v1/knowledge-networks?${query.toString()}`, { signal });
}

export function getKnowledgeNetwork(
  id: string,
  signal?: AbortSignal,
): Promise<KnowledgeNetwork> {
  return request(`/api/v1/knowledge-networks/${encodeURIComponent(id)}`, {
    signal,
  });
}

export function createKnowledgeNetwork(
  input: CreateKnowledgeNetworkRequest,
  signal?: AbortSignal,
): Promise<KnowledgeNetwork> {
  return request("/api/v1/knowledge-networks", {
    method: "POST",
    body: JSON.stringify(input),
    signal,
  });
}

export function buildKnowledgeNetwork(
  id: string,
  signal?: AbortSignal,
): Promise<BuildReceipt> {
  return request(
    `/api/v1/knowledge-networks/${encodeURIComponent(id)}/builds`,
    { method: "POST", signal },
  );
}

export function listObjectTypes(
  knowledgeNetworkId: string,
  signal?: AbortSignal,
): Promise<ObjectTypePage> {
  return request(
    `/api/v1/knowledge-networks/${encodeURIComponent(knowledgeNetworkId)}/object-types`,
    { signal },
  );
}

export function createObjectType(
  knowledgeNetworkId: string,
  input: CreateObjectTypeRequest,
  signal?: AbortSignal,
): Promise<ObjectType> {
  return request(
    `/api/v1/knowledge-networks/${encodeURIComponent(knowledgeNetworkId)}/object-types`,
    { method: "POST", body: JSON.stringify(input), signal },
  );
}
