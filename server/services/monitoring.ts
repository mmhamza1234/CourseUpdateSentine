import { Parser } from "xml2js";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import crypto from "crypto";

export interface FetchResult {
  title: string;
  url: string;
  publishedAt: Date;
  raw: string;
  contentHash: string;
}

export class MonitoringService {
  private parser = new Parser();

  async fetchRSS(url: string): Promise<FetchResult[]> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Course-Update-Sentinel/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`RSS fetch failed: ${response.status} ${response.statusText}`);
      }

      const xmlText = await response.text();
      const result = await this.parser.parseStringPromise(xmlText);
      
      const items = result.rss?.channel?.[0]?.item || result.feed?.entry || [];
      
      return items.map((item: any) => {
        const title = item.title?.[0] || item.title?._ || '';
        const link = item.link?.[0] || item.link?.$.href || '';
        const pubDate = item.pubDate?.[0] || item.published?.[0] || new Date().toISOString();
        const description = item.description?.[0] || item.summary?.[0] || '';
        
        const raw = JSON.stringify({
          title,
          description,
          content: item.content?.[0] || '',
          author: item.author?.[0] || '',
        });
        
        return {
          title: title.trim(),
          url: link.trim(),
          publishedAt: new Date(pubDate),
          raw,
          contentHash: crypto.createHash('sha256').update(raw).digest('hex'),
        };
      });
    } catch (error) {
      throw new Error(`RSS parsing failed: ${error.message}`);
    }
  }

  async fetchHTML(url: string, cssSelector?: string): Promise<FetchResult[]> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Course-Update-Sentinel/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTML fetch failed: ${response.status} ${response.statusText}`);
      }

      const htmlText = await response.text();
      const dom = new JSDOM(htmlText);
      const document = dom.window.document;

      let elements: Element[];
      
      if (cssSelector) {
        elements = Array.from(document.querySelectorAll(cssSelector));
      } else {
        // Default selectors for common changelog patterns
        elements = Array.from(document.querySelectorAll(
          'article, .changelog-item, .release-item, .update-item, [class*="change"], [class*="release"], [class*="update"]'
        ));
      }

      if (elements.length === 0) {
        // Fallback to extracting any content that looks like updates
        elements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          .filter(el => /update|change|release|version|fix|feature/i.test(el.textContent || ''))
          .slice(0, 10); // Limit to prevent spam
      }

      return elements.map((element, index) => {
        const title = element.querySelector('h1, h2, h3, h4, h5, h6')?.textContent?.trim() || 
                     element.textContent?.trim().substring(0, 100) || 
                     `Update ${index + 1}`;
        
        const raw = element.outerHTML || element.textContent || '';
        const contentHash = crypto.createHash('sha256').update(raw).digest('hex');
        
        // Try to extract date from common patterns
        const dateText = element.querySelector('time')?.getAttribute('datetime') ||
                        element.querySelector('[class*="date"]')?.textContent ||
                        element.textContent?.match(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/)?.[0];
        
        const publishedAt = dateText ? new Date(dateText) : new Date();
        
        return {
          title: title.trim(),
          url: url,
          publishedAt,
          raw,
          contentHash,
        };
      });
    } catch (error) {
      throw new Error(`HTML parsing failed: ${error.message}`);
    }
  }

  async fetchGitHubAPI(url: string): Promise<FetchResult[]> {
    try {
      // Extract owner/repo from GitHub URL
      const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        throw new Error('Invalid GitHub URL format');
      }

      const [, owner, repo] = match;
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases`;

      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Course-Update-Sentinel/1.0',
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API failed: ${response.status} ${response.statusText}`);
      }

      const releases = await response.json() as any[];
      
      return releases.slice(0, 10).map((release: any) => {
        const raw = JSON.stringify({
          name: release.name,
          tag_name: release.tag_name,
          body: release.body,
          draft: release.draft,
          prerelease: release.prerelease,
        });
        
        return {
          title: release.name || release.tag_name || 'GitHub Release',
          url: release.html_url,
          publishedAt: new Date(release.published_at),
          raw,
          contentHash: crypto.createHash('sha256').update(raw).digest('hex'),
        };
      });
    } catch (error) {
      throw new Error(`GitHub API failed: ${error.message}`);
    }
  }

  async fetchSource(source: {
    url: string;
    type: string;
    cssSelector?: string;
  }): Promise<FetchResult[]> {
    switch (source.type.toUpperCase()) {
      case 'RSS':
        return this.fetchRSS(source.url);
      case 'HTML':
        return this.fetchHTML(source.url, source.cssSelector);
      case 'API':
      case 'GITHUB':
        return this.fetchGitHubAPI(source.url);
      default:
        throw new Error(`Unsupported source type: ${source.type}`);
    }
  }

  isContentDuplicate(existingHashes: string[], newHash: string): boolean {
    return existingHashes.includes(newHash);
  }

  async checkRobotsTxt(url: string): Promise<boolean> {
    try {
      const urlObj = new URL(url);
      const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
      
      const response = await fetch(robotsUrl);
      if (!response.ok) {
        return true; // Allow if robots.txt doesn't exist
      }
      
      const robotsText = await response.text();
      const lines = robotsText.split('\n');
      
      let currentUserAgent = '';
      let isBlocked = false;
      
      for (const line of lines) {
        const trimmed = line.trim().toLowerCase();
        
        if (trimmed.startsWith('user-agent:')) {
          currentUserAgent = trimmed.substring(11).trim();
        } else if (trimmed.startsWith('disallow:') && 
                  (currentUserAgent === '*' || currentUserAgent === 'course-update-sentinel')) {
          const disallowPath = trimmed.substring(9).trim();
          if (disallowPath === '/' || urlObj.pathname.startsWith(disallowPath)) {
            isBlocked = true;
          }
        }
      }
      
      return !isBlocked;
    } catch {
      return true; // Allow if unable to check robots.txt
    }
  }
}
