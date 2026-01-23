import { chromium, type Browser, type Page } from 'playwright';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export interface FetchResult {
  html: string;
  cleanedText: string;
  cleanedHtml: string;
  title: string;
  byline: string | null;
  siteName: string | null;
  excerpt: string | null;
  url: string;
  fetchTimeMs: number;
}

export interface FetchOptions {
  timeout?: number;
  waitForSelector?: string;
  userAgent?: string;
  extraWaitMs?: number;
}

const DEFAULT_OPTIONS: FetchOptions = {
  timeout: 30000,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  extraWaitMs: 1000,
};

/**
 * UrlFetcher - Fetches and processes web pages using Playwright
 * Handles dynamic JavaScript-rendered content (common in Israeli recipe sites)
 */
export class UrlFetcher {
  private browser: Browser | null = null;

  /**
   * Initialize the browser instance
   */
  async init(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--disable-dev-shm-usage',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      });
    }
  }

  /**
   * Close the browser instance
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Fetch a URL and extract cleaned content
   */
  async fetch(url: string, options: FetchOptions = {}): Promise<FetchResult> {
    const startTime = Date.now();
    const opts = { ...DEFAULT_OPTIONS, ...options };

    await this.init();

    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const context = await this.browser.newContext({
      userAgent: opts.userAgent,
      locale: 'he-IL',
      viewport: { width: 1280, height: 720 },
      acceptDownloads: false,
      javaScriptEnabled: true,
    });

    let page: Page | null = null;

    try {
      page = await context.newPage();

      // Block unnecessary resources for faster loading
      await page.route('**/*', (route) => {
        const resourceType = route.request().resourceType();
        const url = route.request().url();

        // Block heavy resource types
        if (['image', 'media', 'font', 'stylesheet'].includes(resourceType)) {
          route.abort();
          return;
        }

        // Block common ad/tracking domains that cause endless network activity
        const blockedDomains = [
          'googleads', 'googlesyndication', 'doubleclick',
          'facebook.com/tr', 'connect.facebook',
          'analytics', 'tracking', 'adservice',
          'amazon-adsystem', 'criteo', 'taboola', 'outbrain',
        ];

        if (blockedDomains.some(domain => url.includes(domain))) {
          route.abort();
          return;
        }

        route.continue();
      });

      // Navigate with a more lenient wait strategy
      // Use 'domcontentloaded' first, then wait a bit for JS to execute
      try {
        await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: opts.timeout,
        });

        // Wait for body to be present and give scripts time to run
        await page.waitForSelector('body', { timeout: 5000 }).catch(() => {});

        // Short additional wait for dynamic content
        await page.waitForTimeout(2000);
      } catch (navError) {
        // If domcontentloaded fails, try with just 'commit' (earliest point)
        console.warn('[UrlFetcher] Navigation warning, retrying with minimal wait:', navError);
        await page.goto(url, {
          waitUntil: 'commit',
          timeout: opts.timeout,
        });
        await page.waitForTimeout(3000);
      }

      // Wait for specific selector if provided
      if (opts.waitForSelector) {
        await page.waitForSelector(opts.waitForSelector, {
          timeout: opts.timeout,
        });
      }

      // Extra wait for dynamic content (Israeli sites often need this)
      if (opts.extraWaitMs && opts.extraWaitMs > 0) {
        await page.waitForTimeout(opts.extraWaitMs);
      }

      // Get the full rendered HTML
      const html = await page.content();

      // Use Readability to extract clean content
      const { cleanedText, cleanedHtml, title, byline, siteName, excerpt } =
        this.extractCleanContent(html, url);

      return {
        html,
        cleanedText,
        cleanedHtml,
        title,
        byline,
        siteName,
        excerpt,
        url,
        fetchTimeMs: Date.now() - startTime,
      };
    } finally {
      if (page) {
        await page.close();
      }
      await context.close();
    }
  }

  /**
   * Extract clean content using Readability
   */
  private extractCleanContent(html: string, url: string): {
    cleanedText: string;
    cleanedHtml: string;
    title: string;
    byline: string | null;
    siteName: string | null;
    excerpt: string | null;
  } {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document, {
      charThreshold: 100,
      keepClasses: true,
    });

    const article = reader.parse();

    if (!article) {
      // Fallback: extract body text
      const bodyText = dom.window.document.body?.textContent || '';
      const title = dom.window.document.title || '';

      return {
        cleanedText: bodyText.replace(/\s+/g, ' ').trim(),
        cleanedHtml: html,
        title,
        byline: null,
        siteName: null,
        excerpt: null,
      };
    }

    return {
      cleanedText: (article.textContent || '').replace(/\s+/g, ' ').trim(),
      cleanedHtml: article.content || '',
      title: article.title || '',
      byline: article.byline || null,
      siteName: article.siteName || null,
      excerpt: article.excerpt || null,
    };
  }

  /**
   * Simple fetch without browser (for sites that don't need JS rendering)
   */
  async simpleFetch(url: string): Promise<FetchResult> {
    const startTime = Date.now();

    const response = await fetch(url, {
      headers: {
        'User-Agent': DEFAULT_OPTIONS.userAgent!,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const { cleanedText, cleanedHtml, title, byline, siteName, excerpt } =
      this.extractCleanContent(html, url);

    return {
      html,
      cleanedText,
      cleanedHtml,
      title,
      byline,
      siteName,
      excerpt,
      url,
      fetchTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Smart fetch - tries simple fetch first, falls back to Playwright if needed
   */
  async smartFetch(url: string, options: FetchOptions = {}): Promise<FetchResult> {
    // Sites known to require JavaScript rendering
    const jsRequiredDomains = [
      'foody.co.il',
      'mako.co.il',
      'ynet.co.il',
      '10tv.co.il',
      'walla.co.il',
    ];

    const urlObj = new URL(url);
    const needsJs = jsRequiredDomains.some(domain =>
      urlObj.hostname.includes(domain)
    );

    if (needsJs) {
      return this.fetch(url, options);
    }

    try {
      // Try simple fetch first
      const result = await this.simpleFetch(url);

      // Check if content is substantial enough
      if (result.cleanedText.length > 500) {
        return result;
      }

      // Fall back to Playwright if content is too short
      return this.fetch(url, options);
    } catch {
      // Fall back to Playwright on any error
      return this.fetch(url, options);
    }
  }
}

// Singleton instance for convenience
let fetcherInstance: UrlFetcher | null = null;

export async function getFetcher(): Promise<UrlFetcher> {
  if (!fetcherInstance) {
    fetcherInstance = new UrlFetcher();
    await fetcherInstance.init();
  }
  return fetcherInstance;
}

export async function closeFetcher(): Promise<void> {
  if (fetcherInstance) {
    await fetcherInstance.close();
    fetcherInstance = null;
  }
}
