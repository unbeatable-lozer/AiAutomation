/**
 * AI-Powered Visual Testing
 * 
 * Uses AI to compare screenshots and provide intelligent diff analysis.
 */

import { Page, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LlmClient, createLlmClient } from './llm-client';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { VisualComparisonResult, AIConfig } from './types';
import { resolveAiConfig } from './config';

export class AIVisualTester {
  private page: Page;
  private context: BrowserContext;
  private llm: LlmClient | null;
  private config: AIConfig;
  private baselineDir: string;

  /**
   * @param page Playwright page used for screenshots
   * @param context Browser context the page belongs to
   * @param config AI configuration, defaults to the resolved environment config
   * @param llm Pre-built LLM client. Omit it to build one from config;
   *            pass null to disable AI analysis for this instance.
   */
  constructor(page: Page, context: BrowserContext, config?: Partial<AIConfig>, llm?: LlmClient | null) {
    this.page = page;
    this.context = context;
    this.config = { ...resolveAiConfig(), ...config };
    this.baselineDir = process.env.SCREENSHOT_DIR || './screenshots/baseline';
    this.llm = llm === undefined ? createLlmClient(this.config) : llm;

    // Ensure baseline directory exists
    if (!fs.existsSync(this.baselineDir)) {
      fs.mkdirSync(this.baselineDir, { recursive: true });
    }
  }

  /**
   * Compare current page screenshot with baseline
   */
  async compareWithBaseline(name: string, options?: {
    selector?: string;
    threshold?: number;
    updateBaseline?: boolean;
  }): Promise<VisualComparisonResult> {
    const { selector, threshold = this.config.visualThreshold, updateBaseline = false } = options || {};

    // Capture current screenshot
    const currentScreenshot = await this.captureScreenshot(selector);
    const baselinePath = path.join(this.baselineDir, `${name}.png`);

    // Check if baseline exists
    if (!fs.existsSync(baselinePath)) {
      if (updateBaseline) {
        // Save as baseline
        fs.writeFileSync(baselinePath, currentScreenshot);
        return {
          matched: true,
          diffPercentage: 0,
          diffImagePath: undefined
        };
      }
      return {
        matched: false,
        diffPercentage: 100,
        error: 'Baseline screenshot not found'
      };
    }

    // Load baseline
    const baselineScreenshot = fs.readFileSync(baselinePath);
    
    // Compare images
    const result = await this.compareImages(
      currentScreenshot,
      baselineScreenshot,
      threshold
    );

    // Update baseline if requested
    if (updateBaseline && !result.matched) {
      fs.writeFileSync(baselinePath, currentScreenshot);
    }

    return result;
  }

  /**
   * Capture a screenshot of the page or specific element
   */
  private async captureScreenshot(selector?: string): Promise<Buffer> {
    if (selector) {
      const element = this.page.locator(selector);
      return await element.screenshot() as Buffer;
    }
    return await this.page.screenshot() as Buffer;
  }

  /**
   * Compare two images using pixelmatch
   */
  private async compareImages(
    current: Buffer,
    baseline: Buffer,
    threshold: number
  ): Promise<VisualComparisonResult> {
    try {
      const currentImg = PNG.sync.read(current);
      const baselineImg = PNG.sync.read(baseline);

      // Check dimensions match
      if (currentImg.width !== baselineImg.width || currentImg.height !== baselineImg.height) {
        return {
          matched: false,
          diffPercentage: 100,
          error: `Dimension mismatch: ${currentImg.width}x${currentImg.height} vs ${baselineImg.width}x${baselineImg.height}`
        };
      }

      const diff = new PNG({ width: currentImg.width, height: currentImg.height });
      const numDiffPixels = pixelmatch(
        baselineImg.data,
        currentImg.data,
        diff.data,
        currentImg.width,
        currentImg.height
      );

      const totalPixels = currentImg.width * currentImg.height;
      const diffPercentage = (numDiffPixels / totalPixels) * 100;

      // Save diff image
      const diffPath = path.join(process.cwd(), 'test-results', `diff-${Date.now()}.png`);
      fs.writeFileSync(diffPath, PNG.sync.write(diff));

      return {
        matched: diffPercentage <= threshold * 100,
        diffPercentage,
        diffImagePath: diffPath,
        pixelDiff: numDiffPixels
      };
    } catch (error) {
      return {
        matched: false,
        diffPercentage: 100,
        error: `Comparison failed: ${error}`
      };
    }
  }

  /**
   * Analyze screenshot differences using AI
   */
  async analyzeDifferences(current: Buffer, baseline: Buffer): Promise<string | null> {
    const llm = this.llm;

    if (!llm) {
      return null;
    }

    try {
      // Convert images to base64
      const currentBase64 = current.toString('base64');
      const baselineBase64 = baseline.toString('base64');

      const prompt = `
Analyze these two screenshots and explain the visual differences:
1. What changed between the two images?
2. Is this change intentional or a bug?
3. What specific elements are different?

The first image is the current state, the second image is the recorded baseline.
`;
      return await llm.completeWithImages(prompt, [currentBase64, baselineBase64], { maxTokens: 500 });
    } catch (error) {
      console.error('AI visual analysis error:', error);
      return null;
    }
  }

  /**
   * Take a screenshot and save it
   */
  async captureScreenshotToFile(name: string, selector?: string): Promise<string> {
    const screenshot = await this.captureScreenshot(selector);
    const filePath = path.join(this.baselineDir, `${name}.png`);
    fs.writeFileSync(filePath, screenshot);
    return filePath;
  }

  /**
   * Update baseline screenshot
   */
  async updateBaseline(name: string, selector?: string): Promise<void> {
    const screenshot = await this.captureScreenshot(selector);
    const filePath = path.join(this.baselineDir, `${name}.png`);
    fs.writeFileSync(filePath, screenshot);
  }

  /**
   * Generate baseline for all test cases
   */
  async generateBaseline(tests: { name: string; selector?: string }[]): Promise<void> {
    for (const test of tests) {
      await this.updateBaseline(test.name, test.selector);
    }
  }
}

export default AIVisualTester;