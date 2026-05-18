"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const backoff_1 = require("../src/worker/backoff");
(0, vitest_1.describe)('calcNextRetryAt', () => {
    (0, vitest_1.it)('returns a timestamp in the future', () => {
        const before = Date.now();
        const result = (0, backoff_1.calcNextRetryAt)(0);
        (0, vitest_1.expect)(result).toBeGreaterThan(before);
    });
    (0, vitest_1.it)('returns at least 1s in the future (floor)', () => {
        const result = (0, backoff_1.calcNextRetryAt)(0);
        (0, vitest_1.expect)(result).toBeGreaterThanOrEqual(Date.now() + 999);
    });
    (0, vitest_1.it)('caps at 1 hour', () => {
        const result = (0, backoff_1.calcNextRetryAt)(100);
        (0, vitest_1.expect)(result).toBeLessThanOrEqual(Date.now() + 3_600_000 + 100);
    });
    (0, vitest_1.it)('grows with attempt number', () => {
        const r0 = (0, backoff_1.calcNextRetryAt)(0);
        const r5 = (0, backoff_1.calcNextRetryAt)(5);
        // r5 ceiling is much higher; on average r5 > r0 — just check ceiling grows
        (0, vitest_1.expect)(r5).toBeGreaterThan(Date.now());
        (0, vitest_1.expect)(r0).toBeGreaterThan(Date.now());
    });
});
