"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const hmac_1 = require("../src/signing/hmac");
(0, vitest_1.describe)('signPayload', () => {
    (0, vitest_1.it)('produces t=... v1=... format', () => {
        const sig = (0, hmac_1.signPayload)('secret', '{"foo":1}');
        (0, vitest_1.expect)(sig).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
    });
});
(0, vitest_1.describe)('verifySignature', () => {
    (0, vitest_1.it)('verifies a valid signature', () => {
        const body = '{"foo":1}';
        const sig = (0, hmac_1.signPayload)('secret', body);
        (0, vitest_1.expect)((0, hmac_1.verifySignature)('secret', body, sig)).toBe(true);
    });
    (0, vitest_1.it)('rejects wrong secret', () => {
        const body = '{"foo":1}';
        const sig = (0, hmac_1.signPayload)('secret', body);
        (0, vitest_1.expect)((0, hmac_1.verifySignature)('wrong', body, sig)).toBe(false);
    });
    (0, vitest_1.it)('rejects tampered body', () => {
        const sig = (0, hmac_1.signPayload)('secret', '{"foo":1}');
        (0, vitest_1.expect)((0, hmac_1.verifySignature)('secret', '{"foo":2}', sig)).toBe(false);
    });
    (0, vitest_1.it)('rejects missing header', () => {
        (0, vitest_1.expect)((0, hmac_1.verifySignature)('secret', 'body', '')).toBe(false);
    });
    (0, vitest_1.it)('rejects malformed header missing v1', () => {
        (0, vitest_1.expect)((0, hmac_1.verifySignature)('secret', 'body', `t=${Date.now()}`)).toBe(false);
    });
});
