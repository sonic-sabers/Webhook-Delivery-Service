"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const backoff_1 = require("../src/worker/backoff");
(0, vitest_1.describe)('calcNextRetryAt', () => {
    (0, vitest_1.it)('returns a future timestamp', () => {
        const before = Date.now();
        const next = (0, backoff_1.calcNextRetryAt)(0);
        (0, vitest_1.expect)(next).toBeGreaterThanOrEqual(before);
    });
    (0, vitest_1.it)('attempt 0 max delay is 30s', () => {
        const before = Date.now();
        const next = (0, backoff_1.calcNextRetryAt)(0);
        (0, vitest_1.expect)(next - before).toBeLessThanOrEqual(30_000 + 50);
    });
    (0, vitest_1.it)('caps at 1 hour regardless of attempt number', () => {
        const before = Date.now();
        const next = (0, backoff_1.calcNextRetryAt)(100);
        (0, vitest_1.expect)(next - before).toBeLessThanOrEqual(3_600_000 + 50);
    });
    (0, vitest_1.it)('attempt 1 max delay is 60s', () => {
        const before = Date.now();
        const next = (0, backoff_1.calcNextRetryAt)(1);
        (0, vitest_1.expect)(next - before).toBeLessThanOrEqual(60_000 + 50);
    });
});
