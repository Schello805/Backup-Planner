import { describe, expect, it, vi, beforeEach } from 'vitest';
import { api } from './api.js';

describe('api fetch wrapper', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not attach content-type header for bodyless DELETE requests', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } })
    );

    await api('/plans/123', { method: 'DELETE' });

    expect(fetchSpy).toHaveBeenCalledWith('/api/plans/123', expect.objectContaining({
      method: 'DELETE',
      headers: {},
    }));
  });

  it('attaches content-type header when body is provided', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: '123' }), { status: 200, headers: { 'content-type': 'application/json' } })
    );

    await api('/plans', { method: 'POST', body: JSON.stringify({ name: 'Test' }) });

    expect(fetchSpy).toHaveBeenCalledWith('/api/plans', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
      headers: { 'content-type': 'application/json' },
    }));
  });
});
