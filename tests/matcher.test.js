"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const matcher_1 = require("../src/matching/matcher");
(0, vitest_1.describe)('matchesEventType', () => {
    (0, vitest_1.it)('exact match', () => {
        (0, vitest_1.expect)((0, matcher_1.matchesEventType)(['order.created'], 'order.created')).toBe(true);
    });
    (0, vitest_1.it)('wildcard star matches all', () => {
        (0, vitest_1.expect)((0, matcher_1.matchesEventType)(['*'], 'order.created')).toBe(true);
    });
    (0, vitest_1.it)('prefix wildcard matches', () => {
        (0, vitest_1.expect)((0, matcher_1.matchesEventType)(['user.*'], 'user.created')).toBe(true);
        (0, vitest_1.expect)((0, matcher_1.matchesEventType)(['user.*'], 'user.deleted')).toBe(true);
    });
    (0, vitest_1.it)('prefix wildcard does not match different namespace', () => {
        (0, vitest_1.expect)((0, matcher_1.matchesEventType)(['user.*'], 'order.created')).toBe(false);
    });
    (0, vitest_1.it)('no match returns false', () => {
        (0, vitest_1.expect)((0, matcher_1.matchesEventType)(['order.created'], 'user.created')).toBe(false);
    });
    (0, vitest_1.it)('multiple filters, one matches', () => {
        (0, vitest_1.expect)((0, matcher_1.matchesEventType)(['order.created', 'user.*'], 'user.deleted')).toBe(true);
    });
    (0, vitest_1.it)('empty filter list returns false', () => {
        (0, vitest_1.expect)((0, matcher_1.matchesEventType)([], 'order.created')).toBe(false);
    });
});
