/**
 * AI-Powered Element Finder
 * 
 * Uses AI to find elements on the page using natural language descriptions.
 * Includes self-healing capabilities for resilient test execution.
 */

import { Page, Locator } from '@playwright/test';
import OpenAI from 'openai';
import { AIElementDescription, AIElementResult, AIConfig, DEFAULT_AI_CONFIG } from './types';

export class AIElementFinder {
  private page: Page;
  private client: OpenAI | null = null;
  private config: AIConfig;
  private locatorCache: Map<string, string> = new Map();

  constructor(page: Page, config?: Partial<AIConfig>) {
    this.page = page;
    this.config = { ...DEFAULT_AI_CONFIG, ...config };
    
    if (this.config.enabled && this.config.apiKey) {
      this.client = new OpenAI({
        apiKey: this.config.apiKey
      });
    }
  }

  /**
   * Find an element using natural language description
   */
  async findElement(description: AIElementDescription): Promise<AIElementResult> {
    const { description: desc, context, role } = description;
    
    // Try exact selectors first
    const exactResult = await this.tryExactSelectors(desc, role);
    if (exactResult.found) {
      return exactResult;
    }

    // Try fuzzy matching
    const fuzzyResult = await this.tryFuzzySelectors(desc, role, context);
    if (fuzzyResult.found) {
      return fuzzyResult;
    }

    // Use AI to find element
    if (this.config.enabled && this.client) {
      return await this.findWithAI(description);
    }

    // Fallback to semantic selectors
    return this.trySemanticSelectors(desc, role);
  }

  /**
   * Try exact CSS selectors based on description
   */
  private async tryExactSelectors(description: string, role?: string): Promise<AIElementResult> {
    const selectors: string[] = [];
    
    // Common button selectors
    if (role === 'button' || description.toLowerCase().includes('button')) {
      selectors.push(
        `button:has-text("${description}")`,
        `[role="button"]:has-text("${description}")`,
        `.btn:has-text("${description}")`,
        `button[data-testid*="${description.toLowerCase().replace(/\s/g, '-')}"]`
      );
    }
    
    // Input selectors
    if (role === 'input' || description.toLowerCase().includes('input') || description.toLowerCase().includes('field')) {
      selectors.push(
        `input[placeholder*="${description}"]`,
        `input[name*="${description.toLowerCase().replace(/\s/g, '_')}"]`,
        `[data-testid*="${description.toLowerCase().replace(/\s/g, '-')}"]`
      );
    }

    // Link selectors
    if (role === 'link' || description.toLowerCase().includes('link')) {
      selectors.push(
        `a:has-text("${description}")`,
        `[role="link"]:has-text("${description}")`
      );
    }

    for (const selector of selectors) {
      try {
        const locator = this.page.locator(selector);
        if (await locator.count() > 0) {
          return {
            found: true,
            locator,
            method: 'exact',
            confidence: 0.9,
            alternatives: selectors
          };
        }
      } catch {
        continue;
      }
    }

    return {
      found: false,
      method: 'exact',
      confidence: 0,
      alternatives: selectors
    };
  }

  /**
   * Try fuzzy selectors with partial matching
   */
  private async tryFuzzySelectors(description: string, role?: string, context?: string): Promise<AIElementResult> {
    const words = description.toLowerCase().split(/\s+/);
    const selectors: string[] = [];

    // Text contains selectors
    selectors.push(
      `text=${description}`,
      `:has-text("${description}")`,
      `li:has-text("${description}")`,
      `div:has-text("${description}")`
    );

    // Partial text matching
    for (const word of words) {
      if (word.length > 3) {
        selectors.push(`*:has-text("${word}")`);
      }
    }

    // Context-aware selectors
    if (context) {
      selectors.push(`${context}:has-text("${description}")`);
    }

    for (const selector of selectors) {
      try {
        const locator = this.page.locator(selector);
        const count = await locator.count();
        if (count > 0) {
          return {
            found: true,
            locator,
            method: 'fuzzy',
            confidence: 0.7,
            alternatives: selectors
          };
        }
      } catch {
        continue;
      }
    }

    return {
      found: false,
      method: 'fuzzy',
      confidence: 0,
      alternatives: selectors
    };
  }

  /**
   * Use AI to find the element
   */
  private async findWithAI(description: AIElementDescription): Promise<AIElementResult> {
    try {
      // Get page HTML for context
      const html = await this.page.content();
      
      // Get visible text content
      const bodyText = await this.page.evaluate(() => document.body.innerText);

      const prompt = `
Given this web page content, find the best CSS selector or XPath for an element described as:
- Description: ${description.description}
- Role: ${description.role || 'any'}
- Context: ${description.context || 'none'}

Page content excerpt:
${bodyText.substring(0, 2000)}

Return ONLY the selector (no explanation). If uncertain, return "NOT_FOUND".
`;

      const response = await this.client!.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      });

      const selector = response.choices[0]?.message?.content?.trim() || '';
      
      if (selector && selector !== 'NOT_FOUND') {
        const locator = this.page.locator(selector);
        
        // Verify the selector works
        const count = await locator.count();
        if (count > 0) {
          this.locatorCache.set(description.description, selector);
          
          return {
            found: true,
            locator,
            method: 'ai',
            confidence: 0.85,
            alternatives: [selector]
          };
        }
      }
    } catch (error) {
      console.error('AI element finding error:', error);
    }

    return {
      found: false,
      method: 'ai',
      confidence: 0,
      error: 'AI could not find the element'
    };
  }

  /**
   * Try semantic HTML selectors
   */
  private trySemanticSelectors(description: string, role?: string): AIElementResult {
    const normalizedDesc = description.toLowerCase().replace(/\s+/g, '-');
    
    // Common semantic patterns
    const selectors = [
      `[data-testid="${normalizedDesc}"]`,
      `[data-test="${normalizedDesc}"]`,
      `[data-cy="${normalizedDesc}"]`,
      `[aria-label="${description}"]`,
      `[aria-labelledby]`
    ];

    return {
      found: false,
      method: 'fallback',
      confidence: 0,
      alternatives: selectors,
      error: 'No matching element found'
    };
  }

  /**
   * Self-heal a broken locator
   */
  async healLocator(failedLocator: string, pageState?: string): Promise<string | null> {
    if (!this.config.enableSelfHealing || !this.client) {
      return null;
    }

    try {
      const bodyText = await this.page.evaluate(() => document.body.innerText);
      
      const prompt = `
The following locator failed: ${failedLocator}

Current page content:
${bodyText.substring(0, 2000)}

${pageState ? `Previous state: ${pageState}` : ''}

Find a new CSS selector or XPath that would find the same element. Return ONLY the new selector.
`;

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      });

      const newSelector = response.choices[0]?.message?.content?.trim();
      
      if (newSelector && newSelector !== failedLocator) {
        // Verify the new locator works
        const locator = this.page.locator(newSelector);
        const count = await locator.count();
        
        if (count > 0) {
          return newSelector;
        }
      }
    } catch (error) {
      console.error('Self-healing error:', error);
    }

    return null;
  }

  /**
   * Analyze the page and suggest test targets
   */
  async analyzePage(): Promise<any> {
    if (!this.client) {
      return null;
    }

    try {
      const html = await this.page.content();
      const bodyText = await this.page.evaluate(() => document.body.innerText);

      const prompt = `
Analyze this web page and identify:
1. Page title
2. Main content areas
3. Interactive elements (buttons, links, forms)
4. Navigation elements
5. Form fields and their purposes
6. Potential test targets

Page content:
${bodyText.substring(0, 3000)}

Return a JSON object with arrays for each category.
`;

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5
      });

      const analysis = response.choices[0]?.message?.content;
      return JSON.parse(analysis || '{}');
    } catch (error) {
      console.error('Page analysis error:', error);
      return null;
    }
  }

  /**
   * Get cached locator for a description
   */
  getCachedLocator(description: string): string | undefined {
    return this.locatorCache.get(description);
  }

  /**
   * Clear the locator cache
   */
  clearCache(): void {
    this.locatorCache.clear();
  }
}

export default AIElementFinder;