import type { AnalysisRequest, AnalysisResult } from '../types';

// Use Vite environment variables
const PAGESPEED_API_KEY = (import.meta as any).env?.VITE_PAGESPEED_API_KEY;
const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY;

export class AnalyzerService {
  
  static async analyzeWebsite(request: AnalysisRequest): Promise<AnalysisResult> {
    const { websiteUrl, industry = 'general' } = request;
    
    try {
      // 1. Run PageSpeed Insights
      const pageSpeedData = await this.getPageSpeed(websiteUrl);
      
      // 2. Run HTML Scan  
      const scanData = await this.scanHTML(websiteUrl);
      
      // 3. Analyze Keywords
      const keywordAnalysis = this.analyzeKeywords(scanData.content, industry);

      const metrics = pageSpeedData?.metrics || { lcp: 0, fid: 0, cls: 0 };
      const mobileStats = pageSpeedData?.mobileIssues || { viewport: true, fontSizes: true, touchTargets: true };

      const coreWebVitalsScore = pageSpeedData?.performanceScore || 0;
      const seoStructureScore = this.calculateSeoScore(scanData.seo);
      const localRelevanceScore = this.calculateLocalScore(scanData.local);
      
      const mobileScoreVal = (
        (mobileStats.viewport ? 40 : 0) + 
        (mobileStats.touchTargets ? 30 : 0) + 
        (mobileStats.fontSizes ? 30 : 0)
      );

      const overallScore = Math.round(
        (coreWebVitalsScore * 0.3) + 
        (mobileScoreVal * 0.2) + 
        (seoStructureScore * 0.25) + 
        (localRelevanceScore * 0.15) + 
        (keywordAnalysis.score * 0.1)
      );

      return {
        websiteUrl,
        overallScore,
        coreWebVitals: {
          lcp: metrics.lcp,
          fid: metrics.fid,
          cls: metrics.cls,
          score: Math.round(coreWebVitalsScore)
        },
        mobileScore: {
          touchTargets: mobileStats.touchTargets,
          viewportScaling: mobileStats.viewport,
          textReadability: mobileStats.fontSizes,
          score: mobileScoreVal
        },
        seoStructure: {
          hasH1: scanData.seo.hasH1,
          metaDescription: scanData.seo.metaDescription,
          titleTag: scanData.seo.titleTag,
          schemaMarkup: scanData.seo.schemaMarkup,
          altTags: scanData.seo.altTagsCount,
          score: seoStructureScore
        },
        localRelevance: {
          napConsistency: scanData.local.hasPhone && scanData.local.hasAddress,
          googleMyBusiness: scanData.local.hasMapEmbed,
          localKeywords: scanData.local.localKeywordsCount,
          score: localRelevanceScore
        },
        keywordGap: {
          competitorKeywords: keywordAnalysis.present,
          missingKeywords: keywordAnalysis.missing,
          score: keywordAnalysis.score
        },
        recommendations: this.generateRecommendations(scanData, metrics, mobileStats)
      };
    } catch (error) {
      console.error('Analysis failed:', error);
      throw new Error('Failed to analyze website. Please check the URL and try again.');
    }
  }

  private static async getPageSpeed(url: string) {
    try {
      const apiUrl = PAGESPEED_API_KEY 
        ? `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&key=${PAGESPEED_API_KEY}`
        : `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile`;
      
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('PageSpeed API failed');
      
      const data = await response.json();
      const metrics = data.lighthouseResult?.audits;
      
      return {
        performanceScore: Math.round((data.lighthouseResult?.categories?.performance?.score || 0) * 100),
        metrics: {
          lcp: parseFloat(metrics?.['largest-contentful-paint']?.numericValue || 0) / 1000,
          fid: parseFloat(metrics?.['max-potential-fid']?.numericValue || 0),
          cls: parseFloat(metrics?.['cumulative-layout-shift']?.numericValue || 0)
        },
        mobileIssues: {
          viewport: metrics?.['viewport']?.score === 1,
          fontSizes: metrics?.['font-size']?.score === 1,
          touchTargets: metrics?.['tap-targets']?.score === 1
        }
      };
    } catch (error) {
      console.warn('PageSpeed check failed, using defaults');
      return null;
    }
  }

  private static async scanHTML(url: string) {
    try {
      const corsProxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const response = await fetch(corsProxy);
      if (!response.ok) throw new Error('HTML fetch failed');
      
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      return {
        content: html,
        seo: {
          hasH1: doc.querySelectorAll('h1').length > 0,
          metaDescription: !!doc.querySelector('meta[name="description"]'),
          titleTag: !!doc.querySelector('title'),
          schemaMarkup: html.includes('application/ld+json'),
          altTagsCount: doc.querySelectorAll('img[alt]').length
        },
        local: {
          hasPhone: /\d{3}[-.]?\d{3}[-.]?\d{4}/.test(html),
          hasAddress: /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd)/i.test(html),
          hasMapEmbed: html.includes('maps.google') || html.includes('maps.googleapis'),
          localKeywordsCount: (html.match(/near me|local|[A-Z][a-z]+,\s*[A-Z]{2}/g) || []).length
        }
      };
    } catch (error) {
      console.warn('HTML scan failed, using defaults');
      return {
        content: '',
        seo: { hasH1: false, metaDescription: false, titleTag: false, schemaMarkup: false, altTagsCount: 0 },
        local: { hasPhone: false, hasAddress: false, hasMapEmbed: false, localKeywordsCount: 0 }
      };
    }
  }

  private static analyzeKeywords(content: string, industry: string) {
    const industryKeywords: Record<string, string[]> = {
      general: ['service', 'quality', 'professional', 'expert', 'certified'],
      restaurant: ['menu', 'reservation', 'dining', 'cuisine', 'chef'],
      medical: ['appointment', 'doctor', 'patient', 'care', 'medical'],
      legal: ['attorney', 'law', 'legal', 'consultation', 'case'],
      retail: ['shop', 'store', 'product', 'sale', 'purchase']
    };
    
    const keywords = industryKeywords[industry] || industryKeywords.general;
    const present = keywords.filter(kw => content.toLowerCase().includes(kw));
    const missing = keywords.filter(kw => !content.toLowerCase().includes(kw));
    
    return {
      present,
      missing,
      score: Math.round((present.length / keywords.length) * 100)
    };
  }

  private static calculateSeoScore(seo: any): number {
    let score = 0;
    if (seo.hasH1) score += 25;
    if (seo.metaDescription) score += 25;
    if (seo.titleTag) score += 25;
    if (seo.schemaMarkup) score += 15;
    if (seo.altTagsCount > 5) score += 10;
    return Math.min(score, 100);
  }

  private static calculateLocalScore(local: any): number {
    let score = 0;
    if (local.hasPhone) score += 30;
    if (local.hasAddress) score += 30;
    if (local.hasMapEmbed) score += 20;
    if (local.localKeywordsCount > 3) score += 20;
    return Math.min(score, 100);
  }

  private static generateRecommendations(scanData: any, metrics: any, mobileStats: any) {
    const recs = [];
    
    if (metrics.lcp > 2.5) {
      recs.push({
        category: 'Performance',
        priority: 'High',
        issue: 'Slow page load time',
        fix: 'Optimize images, enable compression, use a CDN'
      });
    }
    
    if (metrics.cls > 0.1) {
      recs.push({
        category: 'Performance',
        priority: 'High',
        issue: 'Layout shifts during load',
        fix: 'Set explicit width/height on images and embeds'
      });
    }
    
    if (!scanData.seo.hasH1) {
      recs.push({
        category: 'SEO',
        priority: 'High',
        issue: 'Missing H1 heading',
        fix: 'Add a descriptive H1 tag to your homepage'
      });
    }
    
    if (!scanData.seo.metaDescription) {
      recs.push({
        category: 'SEO',
        priority: 'Medium',
        issue: 'No meta description',
        fix: 'Add a compelling 150-160 character meta description'
      });
    }
    
    if (!mobileStats.viewport) {
      recs.push({
        category: 'Mobile',
        priority: 'High',
        issue: 'Not mobile-friendly',
        fix: 'Add viewport meta tag and responsive CSS'
      });
    }
    
    if (!scanData.local.hasPhone) {
      recs.push({
        category: 'Local SEO',
        priority: 'High',
        issue: 'Phone number not found',
        fix: 'Display phone number prominently in header/footer'
      });
    }
    
    if (!scanData.local.hasAddress) {
      recs.push({
        category: 'Local SEO',
        priority: 'Medium',
        issue: 'Address not found',
        fix: 'Add your business address with proper schema markup'
      });
    }
    
    return recs;
  }
}
