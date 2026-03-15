/**
 * AI Testing Module
 * 
 * Exports all AI-powered testing features
 */

export * from './types';
export { AIElementFinder } from './element-finder';
export { AIVisualTester } from './visual-tester';

// Re-export default for convenience
import { AIElementFinder, AIVisualTester } from './index';
import { AIConfig, DEFAULT_AI_CONFIG } from './types';

export default {
  AIElementFinder,
  AIVisualTester,
  DEFAULT_AI_CONFIG
};

// Factory function to create AI testing utilities
export function createAITesting(page: any, context: any, config?: Partial<AIConfig>) {
  return {
    elementFinder: new AIElementFinder(page, config),
    visualTester: new AIVisualTester(page, context, config)
  };
}