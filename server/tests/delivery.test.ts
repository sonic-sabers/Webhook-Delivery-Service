import { describe, it, expect } from 'vitest';
import { classifyResponse } from '../src/worker/delivery';

describe('classifyResponse', () => {
  it('200 is success', () => {
    expect(classifyResponse(200)).toEqual({ success: true, shouldRetry: false });
  });

  it('201 is success', () => {
    expect(classifyResponse(201)).toEqual({ success: true, shouldRetry: false });
  });

  it('null (network error) retries', () => {
    expect(classifyResponse(null)).toEqual({ success: false, shouldRetry: true });
  });

  it('500 retries', () => {
    expect(classifyResponse(500)).toEqual({ success: false, shouldRetry: true });
  });

  it('400 does not retry', () => {
    expect(classifyResponse(400)).toEqual({ success: false, shouldRetry: false });
  });

  it('404 does not retry', () => {
    expect(classifyResponse(404)).toEqual({ success: false, shouldRetry: false });
  });

  it('408 retries', () => {
    expect(classifyResponse(408)).toEqual({ success: false, shouldRetry: true });
  });

  it('429 retries', () => {
    expect(classifyResponse(429)).toEqual({ success: false, shouldRetry: true });
  });

  it('503 retries', () => {
    expect(classifyResponse(503)).toEqual({ success: false, shouldRetry: true });
  });
});
