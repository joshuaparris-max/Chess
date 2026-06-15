const FAILURE_LIMIT = 3;
const OPEN_MS = 60_000;
let failures = 0;
let openUntil = 0;

export function circuitIsOpen(now = Date.now()) {
  return now < openUntil;
}

export function recordProviderSuccess() {
  failures = 0;
  openUntil = 0;
}

export function recordProviderFailure(now = Date.now()) {
  failures += 1;
  if (failures >= FAILURE_LIMIT) openUntil = now + OPEN_MS;
}

export async function resilientFetch(input: string, init: RequestInit, fetcher: typeof fetch = fetch) {
  if (circuitIsOpen()) throw new Error('AI provider circuit is temporarily open.');
  let lastResponse: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetcher(input, init);
      lastResponse = response;
      if (response.ok || [400, 401, 403].includes(response.status)) {
        if (response.ok) recordProviderSuccess();
        else recordProviderFailure();
        return response;
      }
    } catch {
      // Retry transient network failures below.
    }
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 200 * (2 ** attempt)));
  }
  recordProviderFailure();
  if (lastResponse) return lastResponse;
  throw new Error('AI provider request failed.');
}

export function resetProviderCircuitForTests() {
  failures = 0;
  openUntil = 0;
}
