export type CapabilityStatus = "foundation" | "planned";

export interface SystemInfo {
  product: string;
  service: string;
  version: string;
  environment: string;
  build_sha: string;
}

export interface HealthInfo {
  status: "ok" | "ready";
  service: string;
  version: string;
}

export interface Capability {
  id: string;
  name: string;
  status: CapabilityStatus;
  target_phase: string;
}

export interface Overview {
  info: SystemInfo;
  health: HealthInfo;
  capabilities: Capability[];
}

export async function loadOverview(signal?: AbortSignal): Promise<Overview> {
  const response = await fetch("/api/v1/overview", {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) {
    throw new Error(`平台状态请求失败（${response.status}）`);
  }
  return (await response.json()) as Overview;
}
