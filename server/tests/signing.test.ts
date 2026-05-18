import { describe, it, expect } from 'vitest';
import { signPayload, verifySignature } from '../src/signing/hmac';

describe('signPayload', () => {
  it('produces t=... v1=... format', () => {
    const sig = signPayload('secret', '{"foo":1}');
    expect(sig).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
  });
});

describe('verifySignature', () => {
  it('verifies a valid signature', () => {
    const body = '{"foo":1}';
    const sig = signPayload('secret', body);
    expect(verifySignature('secret', body, sig)).toBe(true);
  });

  it('rejects wrong secret', () => {
    const body = '{"foo":1}';
    const sig = signPayload('secret', body);
    expect(verifySignature('wrong', body, sig)).toBe(false);
  });

  it('rejects tampered body', () => {
    const sig = signPayload('secret', '{"foo":1}');
    expect(verifySignature('secret', '{"foo":2}', sig)).toBe(false);
  });

  it('rejects missing header', () => {
    expect(verifySignature('secret', 'body', '')).toBe(false);
  });

  it('rejects malformed header missing v1', () => {
    expect(verifySignature('secret', 'body', `t=${Date.now()}`)).toBe(false);
  });
});
