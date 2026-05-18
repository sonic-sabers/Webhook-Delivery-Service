import { describe, it, expect } from 'vitest';
import { classifyResponse } from '../src/worker/delivery';

describe('classifyResponse', () => {
  it('200 = success', () => {
    expect(classifyResponse(200)).toEqual({ success: true, shouldRetry: false });
  });

  it('201 = success', () => {
    expect(classifyResponse(201)).toEqual({ success: true, shouldRetry: false });
  });

  it('500 = retry', () => {
    expect(classifyResponse(500)).toEqual({ success: false, shouldRetry: true });
  });

  it('503 = retry', () => {
    expect(classifyResponse(503)).toEqual({ success: false, shouldRetry: true });
  });

  it('400 = permanent fail, no retry', () => {
    expect(classifyResponse(400)).toEqual({ success: false, shouldRetry: false });
  });

  it('404 = permanent fail, no retry', () => {
    expect(classifyResponse(404)).toEqual({ success: false, shouldRetry: false });
  });

  it('408 = retry (request timeout)', () => {
    expect(classifyResponse(408)).toEqual({ success: false, shouldRetry: true });
  });

  it('429 = retry (rate limited)', () => {
    expect(classifyResponse(429)).toEqual({ success: false, shouldRetry: true });
  });

  it('null (network error) = retry', () => {
    expect(classifyResponse(null)).toEqual({ success: false, shouldRetry: true });
  });
});
