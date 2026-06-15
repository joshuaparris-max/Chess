import { beforeEach, describe, expect, it, vi } from 'vitest';
import { circuitIsOpen, resilientFetch, resetProviderCircuitForTests } from '@/lib/groqResilience';

describe('Groq resilience', () => {
  beforeEach(() => resetProviderCircuitForTests());

  it('retries transient failures and succeeds', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response('busy', { status: 503 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));
    const response = await resilientFetch('https://example.test', {}, fetcher);
    expect(response.status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('opens the circuit after repeated failed requests', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('busy', { status: 503 }));
    await resilientFetch('https://example.test', {}, fetcher);
    await resilientFetch('https://example.test', {}, fetcher);
    await resilientFetch('https://example.test', {}, fetcher);
    expect(circuitIsOpen()).toBe(true);
  });
});
