import { setLastFetchError } from "../debug/debugStore";

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const detail = `[FETCH_ERR] ${url} status=${response.status} body=${body.slice(0, 120)}`;
    console.error(detail);
    setLastFetchError(detail);
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}
