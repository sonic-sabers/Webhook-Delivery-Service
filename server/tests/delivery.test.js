"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const delivery_1 = require("../src/worker/delivery");
(0, vitest_1.describe)('classifyResponse', () => {
    (0, vitest_1.it)('200 is success', () => {
        (0, vitest_1.expect)((0, delivery_1.classifyResponse)(200)).toEqual({ success: true, shouldRetry: false });
    });
    (0, vitest_1.it)('201 is success', () => {
        (0, vitest_1.expect)((0, delivery_1.classifyResponse)(201)).toEqual({ success: true, shouldRetry: false });
    });
    (0, vitest_1.it)('null (network error) retries', () => {
        (0, vitest_1.expect)((0, delivery_1.classifyResponse)(null)).toEqual({ success: false, shouldRetry: true });
    });
    (0, vitest_1.it)('500 retries', () => {
        (0, vitest_1.expect)((0, delivery_1.classifyResponse)(500)).toEqual({ success: false, shouldRetry: true });
    });
    (0, vitest_1.it)('400 does not retry', () => {
        (0, vitest_1.expect)((0, delivery_1.classifyResponse)(400)).toEqual({ success: false, shouldRetry: false });
    });
    (0, vitest_1.it)('404 does not retry', () => {
        (0, vitest_1.expect)((0, delivery_1.classifyResponse)(404)).toEqual({ success: false, shouldRetry: false });
    });
    (0, vitest_1.it)('408 retries', () => {
        (0, vitest_1.expect)((0, delivery_1.classifyResponse)(408)).toEqual({ success: false, shouldRetry: true });
    });
    (0, vitest_1.it)('429 retries', () => {
        (0, vitest_1.expect)((0, delivery_1.classifyResponse)(429)).toEqual({ success: false, shouldRetry: true });
    });
    (0, vitest_1.it)('503 retries', () => {
        (0, vitest_1.expect)((0, delivery_1.classifyResponse)(503)).toEqual({ success: false, shouldRetry: true });
    });
});
