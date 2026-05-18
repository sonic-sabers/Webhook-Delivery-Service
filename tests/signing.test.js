"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const hmac_1 = require("../src/signing/hmac");
(0, vitest_1.describe)('signPayload', () => {
    (0, vitest_1.it)('produces t and v1 fields', () => {
        const sig = (0, hmac_1.signPayload)('mysecret', '{"hello":"world"}');
        (0, vitest_1.expect)(sig).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
    });
    (0, vitest_1.it)('is deterministic given same timestamp', () => {
        const ts = Date.now();
        const body = '{"x":1}';
        (0, vitest_1.expect)((0, hmac_1.signPayload)('secret', body, ts)).toBe((0, hmac_1.signPayload)('secret', body, ts));
    });
    (0, vitest_1.it)('verifySignature accepts valid sig within window', () => {
        const secret = 'mysecret';
        const body = '{"test":true}';
        const sig = (0, hmac_1.signPayload)(secret, body);
        (0, vitest_1.expect)((0, hmac_1.verifySignature)(secret, body, sig)).toBe(true);
    });
    (0, vitest_1.it)('verifySignature rejects sig older than 5 minutes', () => {
        const secret = 'mysecret';
        const body = '{"test":true}';
        const oldTs = Date.now() - 6 * 60 * 1000;
        const sig = (0, hmac_1.signPayload)(secret, body, oldTs);
        (0, vitest_1.expect)((0, hmac_1.verifySignature)(secret, body, sig)).toBe(false);
    });
    (0, vitest_1.it)('verifySignature rejects tampered body', () => {
        const secret = 'mysecret';
        const sig = (0, hmac_1.signPayload)(secret, '{"original":true}');
        (0, vitest_1.expect)((0, hmac_1.verifySignature)(secret, '{"tampered":true}', sig)).toBe(false);
    });
});
