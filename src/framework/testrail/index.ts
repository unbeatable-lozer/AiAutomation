/**
 * TestRail Integration Module
 * 
 * Exports all TestRail integration features
 */

export * from './types';
export { TestRailClient } from './client';
export { default as TestRailReporter, caseId } from './reporter';

// Re-export for convenience
import { TestRailClient } from './client';
import TestRailReporter, { caseId } from './reporter';

export default {
  TestRailClient,
  TestRailReporter,
  caseId
};