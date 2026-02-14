import { setFetchError } from "../debug/debugStore";

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    let body = "";
    try {
      body = (await res.text()).slice(0, 180);
    } catch {
      body = "";
    }
    const msg = `[FETCH_ERR] ${url} status=${res.status} body=${body}`;
    setFetchError(msg);
    throw new Error(msg);
  }
  return (await res.json()) as T;
}
