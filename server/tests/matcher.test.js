"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const matcher_1 = require("../src/matching/matcher");
(0, vitest_1.describe)('matchesEventType', () => {
    (0, vitest_1.it)('matches exact type', () => {
        (0, vitest_1.expect)((0, matcher_1.matchesEventType)(['order.created'], 'order.created')).toBe(true);
    });
    (0, vitest_1.it)('does not match different exact type', () => {
        (0, vitest_1.expect)((0, matcher_1.matchesEventType)(['order.created'], 'order.updated')).toBe(false);
    });
    (0, vitest_1.it)('matches wildcard *', () => {
        (0, vitest_1.expect)((0, matcher_1.matchesEventType)(['*'], 'anything.here')).toBe(true);
    });
    (0, vitest_1.it)('matches prefix wildcard', () => {
        (0, vitest_1.expect)((0, matcher_1.matchesEventType)(['user.*'], 'user.created')).toBe(true);
    });
    (0, vitest_1.it)('does not match prefix wildcard for different prefix', () => {
        (0, vitest_1.expect)((0, matcher_1.matchesEventType)(['user.*'], 'order.created')).toBe(false);
    });
    (0, vitest_1.it)('matches one of multiple filters', () => {
        (0, vitest_1.expect)((0, matcher_1.matchesEventType)(['order.created', 'user.*'], 'user.deleted')).toBe(true);
    });
    (0, vitest_1.it)('returns false for empty filters', () => {
        (0, vitest_1.expect)((0, matcher_1.matchesEventType)([], 'order.created')).toBe(false);
    });
});
