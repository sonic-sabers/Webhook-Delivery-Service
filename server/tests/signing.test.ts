import { describe, it, expect } from 'vitest';
import { signPayload, verifySignature } from '../src/signing/hmac';

describe('signPayload', () => {
  it('produces t and v1 fields', () => {
    const sig = signPayload('mysecret', '{"hello":"world"}');
    expect(sig).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
  });

  it('is deterministic given same timestamp', () => {
    const ts = Date.now();
    const body = '{"x":1}';
    expect(signPayload('secret', body, ts)).toBe(signPayload('secret', body, ts));
  });

  it('verifySignature accepts valid sig within window', () => {
    const secret = 'mysecret';
    const body = '{"test":true}';
    const sig = signPayload(secret, body);
    expect(verifySignature(secret, body, sig)).toBe(true);
  });

  it('verifySignature rejects sig older than 5 minutes', () => {
    const secret = 'mysecret';
    const body = '{"test":true}';
    const oldTs = Date.now() - 6 * 60 * 1000;
    const sig = signPayload(secret, body, oldTs);
    expect(verifySignature(secret, body, sig)).toBe(false);
  });

  it('verifySignature rejects tampered body', () => {
    const secret = 'mysecret';
    const sig = signPayload(secret, '{"original":true}');
    expect(verifySignature(secret, '{"tampered":true}', sig)).toBe(false);
  });
});
