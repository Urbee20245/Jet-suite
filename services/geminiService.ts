import { GoogleGenAI, Type } from "@google/genai";
import type { 
    AuditReport, BusinessSearchResult, ConfirmedBusiness, BusinessDna, 
    BusinessProfile, BrandDnaProfile, ProfileData, CampaignIdea, CreativeAssets,
    LiveWebsiteAnalysis
} from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const businessSearchResultSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            address: { type: Type.STRING },
            rating: { type: Type.NUMBER },
            reviewCount: { type: Type.INTEGER },
            category: { type: Type.STRING },
        },
        required: ["name", "address", "rating", "reviewCount", "category"]
    }
};

export const searchGoogleBusiness = async (query: string): Promise<BusinessSearchResult[]> => {
    const prompt = `You are a Google Maps search specialist. A user is searching for their business with the query: "${query}". Use Google Search to find matching business listings on Google Maps. Return a list of up to 5 of the most relevant results. For each result, provide the business name, full address, star rating, total review count, and primary category. Your entire output must be a single JSON array matching the provided schema. If no businesses are found, return an empty array.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              businesses: businessSearchResultSchema
            }
          }
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText).businesses || [];
}


const auditReportSchema = {
    type: Type.OBJECT,
    properties: {
        timestamp: {
            type: Type.STRING,
            description: "The ISO 8601 timestamp for when the analysis was run."
        },
        issues: {
            type: Type.ARRAY,
            description: "A list of all issues identified.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: {
                        type: Type.STRING,
                        description: "A unique identifier for the issue, e.g., 'issue_gbp_unclaimed'."
                    },
                    issue: {
                        type: Type.STRING,
                        description: "ISSUE IDENTIFIED: A clear, concise description of the problem."
                    },
                    whyItMatters: {
                        type: Type.STRING,
                        description: "WHY THIS MATTERS: The specific impact on ranking, conversion, or trust."
                    },
                    fix: {
                        type: Type.STRING,
                        description: "EXACT FIX INSTRUCTIONS: Step-by-step, plain English instructions on how to fix the issue. Include copy suggestions if applicable."
                    },
                    priority: {
                        type: Type.STRING,
                        description: "PRIORITY LEVEL: 'High', 'Medium', or 'Low'."
                    },
                    task: {
                        type: Type.OBJECT,
                        description: "The corresponding task for the Growth Plan.",
                        properties: {
                            title: {
                                type: Type.STRING,
                                description: "A short, actionable task title."
                            },
                            description: {
                                type: Type.STRING,
                                description: "A brief description of what the task involves."
                            },
                            effort: {
                                type: Type.STRING,
                                description: "Estimated effort: 'Low', 'Medium', or 'High'."
                            },
                            sourceModule: {
                                type: Type.STRING,
                                description: "The module that generated this task, e.g., 'JetBiz'."
                            }
                        },
                        required: ["title", "description", "effort", "sourceModule"]
                    }
                },
                required: ["id", "issue", "whyItMatters", "fix", "priority", "task"]
            }
        },
        weeklyActions: {
            type: Type.ARRAY,
            description: "WHAT YOU SHOULD DO THIS WEEK: A prioritized list of 3-5 of the most impactful tasks for the user to focus on this week, ordered by impact.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING, description: "This is the 'How to do it' step-by-step instruction." },
                    whyItMatters: { type: Type.STRING, description: "A concise, one-sentence explanation of the task's impact." },
                    effort: { type: Type.STRING, description: "'Low', 'Medium', or 'High'." },
                    sourceModule: { type: Type.STRING }
                },
                required: ["title", "description", "whyItMatters", "effort", "sourceModule"]
            }
        }
    },
    required: ["timestamp", "issues", "weeklyActions"]
};


export const analyzeBusinessListing = async (business: ConfirmedBusiness): Promise<AuditReport> => {
  const prompt = `You are an expert local SEO strategist upgrading the JetBiz tool. A user has CONFIRMED their business is: Name: '${business.name}', Address: '${business.address}'.
  
  Your task is to perform a deep analysis of THIS SPECIFIC Google Business Profile (GBP). For each issue or competitive gap identified, generate a structured output following the JSON schema. Be extremely specific and generate a unique 'id' for each issue. For the 'weeklyActions' list, you MUST include the 'whyItMatters' field for each task, explaining its direct impact. Your entire output must be a single JSON object matching the provided schema. If the business appears unclaimed, make that a HIGH priority issue.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: auditReportSchema,
    },
  });

  const jsonText = response.text.trim();
  const report = JSON.parse(jsonText) as AuditReport;
  report.businessName = business.name;
  report.businessAddress = business.address;
  return report;
};

export const analyzeWebsite = async (url: string): Promise<AuditReport> => {
    const prompt = `You are operating inside JetViz, the website audit module of JetSuite. Your audits are execution guides, not reports.

Your task is to analyze the live website at the URL: '${url}'. Focus on Homepage Clarity, Local SEO, Conversion Friction, and Trust Signals.

Your entire output MUST be a single JSON object matching the provided schema.

For every issue you identify, generate the full structured output (id, issue, whyItMatters, fix, priority, task). For the 'weeklyActions' list, you MUST include the 'whyItMatters' field for each task, explaining its direct impact. If a headline is weak or a CTA is missing, provide specific, improved example copy in the 'fix' instructions.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: auditReportSchema,
    },
  });

  const jsonText = response.text.trim();
  const report = JSON.parse(jsonText) as AuditReport;
  report.businessName = "Website Analysis"; // Generic name for website audits
  report.businessAddress = url;
  return report;
};

// FIX: Add schema and function for live website analysis.
const liveWebsiteAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        ...auditReportSchema.properties,
        mobile: {
            type: Type.OBJECT,
            description: "Mobile PageSpeed Insights scores.",
            properties: {
                performance: { type: Type.NUMBER, description: "Performance score from 0-100." },
                accessibility: { type: Type.NUMBER, description: "Accessibility score from 0-100." },
                bestPractices: { type: Type.NUMBER, description: "Best Practices score from 0-100." },
                seo: { type: Type.NUMBER, description: "SEO score from 0-100." },
            },
            required: ["performance", "accessibility", "bestPractices", "seo"]
        },
        desktop: {
            type: Type.OBJECT,
            description: "Desktop PageSpeed Insights scores.",
            properties: {
                performance: { type: Type.NUMBER, description: "Performance score from 0-100." },
                accessibility: { type: Type.NUMBER, description: "Accessibility score from 0-100." },
                bestPractices: { type: Type.NUMBER, description: "Best Practices score from 0-100." },
                seo: { type: Type.NUMBER, description: "SEO score from 0-100." },
            },
            required: ["performance", "accessibility", "bestPractices", "seo"]
        }
    },
    required: [...auditReportSchema.required, "mobile", "desktop"]
};

export const analyzeWebsiteWithLiveApis = async (url: string): Promise<LiveWebsiteAnalysis> => {
    const prompt = `You are operating inside JetViz, the website audit module of JetSuite. Your audits are execution guides, not reports.

Your task is to perform a DEEP analysis of the live website at the URL: '${url}'. You must use Google Search to get live data, including simulating PageSpeed Insights for mobile and desktop.

Your entire output MUST be a single JSON object matching the provided schema.

1.  **PageSpeed Scores**: Provide estimated scores (0-100) for Performance, Accessibility, Best Practices, and SEO for both Mobile and Desktop.
2.  **Issues**: Focus on Homepage Clarity, Local SEO, Conversion Friction, and Trust Signals. For every issue you identify, generate the full structured output (id, issue, whyItMatters, fix, priority, task).
3.  **Weekly Actions**: For the 'weeklyActions' list, you MUST include the 'whyItMatters' field for each task, explaining its direct impact. If a headline is weak or a CTA is missing, provide specific, improved example copy in the 'fix' instructions.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: liveWebsiteAnalysisSchema,
    },
  });

  const jsonText = response.text.trim();
  const report = JSON.parse(jsonText) as LiveWebsiteAnalysis;
  report.businessName = "Live Website Analysis";
  report.businessAddress = url;
  return report;
};

export const generateSocialPosts = async (businessType: string, topic: string, tone: string, platforms: string[]) => {
  const prompt = `You are a creative social media manager for local businesses. Generate distinct social media posts for a '${businessType}'. The topic is '${topic}'. The desired tone is '${tone}'. Create a version specifically tailored for each of the following platforms: ${platforms.join(', ')}. Ensure the content is optimized for the style and constraints of each platform. For TikTok, suggest a short video concept.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          posts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                platform: {
                  type: Type.STRING,
                  description: "The social media platform this post is for (e.g., 'Facebook', 'Instagram')."
                },
                post_text: {
                  type: Type.STRING,
                  description: "The full text content for the social media post."
                },
                hashtags: {
                  type: Type.STRING,
                  description: "A string of relevant hashtags, starting with #."
                },
                visual_suggestion: {
                  type: Type.STRING,
                  description: "A brief suggestion for an accompanying image or video. For TikTok, this should be a video concept."
                }
              },
              required: ["platform", "post_text", "hashtags", "visual_suggestion"]
            }
          }
        }
      }
    }
  });

  const jsonText = response.text.trim();
  return JSON.parse(jsonText);
};


export const generateReviewReply = async (review: string, isPositive: boolean, tone: string) => {
  const toneInstruction = tone ? `The tone of the reply should be ${tone}.` : 'The tone of the reply should be professional and empathetic.';
  const prompt = `You are a customer service manager. ${toneInstruction} A customer left the following review: "${review}". 
  
  The review is considered ${isPositive ? 'positive' : 'negative'}. 
  
  Draft a concise and appropriate response. 
  - If it's positive, thank them warmly and encourage them to return.
  - If it's negative, acknowledge their issue, apologize sincerely without admitting fault, and offer to resolve the situation offline (e.g., "Please contact us at..."). Do not make excuses.
  
  Provide only the response text.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  // FIX: Ensure response.text is not undefined to prevent type errors.
  return response.text ?? '';
};

export const findLeads = async (service: string, area: string) => {
  const prompt = `You are a lead generation expert for local businesses. A '${service}' provider in '${area}' is looking for new customers. Scour the web using Google Search to find recent (last few weeks) public posts, forum threads, or social media comments where people are asking for recommendations or expressing a need for this service in or near that area. For each potential lead you find, provide a summary of their request, where you found it (e.g., 'Reddit r/cityname'), and the direct quote if possible. Format this as a markdown list. If you can't find anything, say so.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] },
  });
  // FIX: Ensure response.text is not undefined to prevent type errors.
  return response.text ?? '';
};

export const generateLocalContent = async (businessType: string, topic: string) => {
  const prompt = `You are a local SEO content writer. Write an engaging and informative blog post for a '${businessType}'. The topic is '${topic}'. The article should be optimized for local search, be at least 400 words long, and have a clear title, introduction, several subheadings using markdown, and a concluding paragraph with a call to action. The tone should be helpful and expert.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });
  // FIX: Ensure response.text is not undefined to prevent type errors.
  return response.text ?? '';
};

export const generateAdCopy = async (product: string, platform: string) => {
  const prompt = `You are an expert digital advertising copywriter. Generate 3 distinct ad variations for a '${product}' to be used on the '${platform}' platform. For each variation, provide a Headline, a Description/Body, a Call to Action, and a concise visual suggestion for an accompanying image. Make them persuasive and tailored to the platform's style.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          ads: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING, description: "A compelling headline for the ad." },
                description: { type: Type.STRING, description: "The main body text of the ad." },
                cta: { type: Type.STRING, description: "A strong call to action, e.g., 'Learn More'." },
                visual_suggestion: { type: Type.STRING, description: "A brief suggestion for an accompanying image." }
              },
              required: ["headline", "description", "cta", "visual_suggestion"]
            }
          }
        }
      }
    }
  });
  const jsonText = response.text.trim();
  return JSON.parse(jsonText);
};

export const analyzeCompetitor = async (competitorUrl: string): Promise<AuditReport> => {
    const prompt = `You are operating inside JetCompete, the competitor intelligence module of JetSuite. JetCompete is a counter-strategy engine, not a report.

Your task is to analyze the competitor at the URL: '${competitorUrl}'. Your goal is to identify their key advantages and convert them into actionable counter-strategies. Focus only on GAPS and COUNTER-ACTIONS.

Analyze their Reputation, Visibility, and Positioning Signals. For EACH advantage you identify, generate a structured output (including a unique 'id'). The "issue" should be the competitor's advantage, and the "fix" is the counter-action. For the 'weeklyActions' list, you MUST include the 'whyItMatters' field for each task, explaining its direct impact.

Your entire output MUST be a single JSON object matching the provided schema. Label any inferred data as such.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: auditReportSchema,
    },
  });
  const jsonText = response.text.trim();
  const report = JSON.parse(jsonText) as AuditReport;
  report.businessName = `Competitor: ${new URL(competitorUrl).hostname}`;
  report.businessAddress = competitorUrl;
  return report;
};

export const generateEventIdeas = async (businessType: string, goal: string) => {
  const prompt = `You are a creative marketing consultant for local businesses. Brainstorm 5 unique and actionable event or promotion ideas for a '${businessType}' whose goal is to '${goal}'. For each idea, provide a catchy name, a brief description of the event/promotion, and a suggestion for how to market it locally. Format the response as a markdown list.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });
  // FIX: Ensure response.text is not undefined to prevent type errors.
  return response.text ?? '';
};

export const findKeywords = async (service: string, location: string) => {
  const prompt = `You are a local SEO keyword specialist. For a '${service}' business in '${location}', generate a comprehensive list of keywords. For each keyword, provide an estimated monthly search volume (e.g., '10-100', '1K-10K') and a ranking difficulty ('Low', 'Medium', or 'High'). Use Google Search to understand user intent and current search trends.`;

  const keywordSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        keyword: { type: Type.STRING },
        monthly_volume: {
          type: Type.STRING,
          description: "An estimated monthly search volume range, e.g., '10-100', '1K-10K'."
        },
        difficulty: {
          type: Type.STRING,
          description: "An estimated ranking difficulty: 'Low', 'Medium', or 'High'."
        }
      },
      required: ["keyword", "monthly_volume", "difficulty"]
    }
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', // Using a more powerful model for better estimation
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          primary_keywords: { ...keywordSchema, description: "High-volume, general service keywords combined with the location." },
          long_tail_keywords: { ...keywordSchema, description: "More specific, multi-word phrases indicating higher user intent." },
          question_keywords: { ...keywordSchema, description: "Common questions users search for, ideal for blog posts or FAQ pages." },
          local_modifier_keywords: { ...keywordSchema, description: "Keywords with local modifiers like 'near me' or specific neighborhoods." }
        }
      }
    }
  });

  const jsonText = response.text.trim();
  return JSON.parse(jsonText);
};

export const generateImage = async (prompt: string, imageSize: '1K' | '2K' | '4K', aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1") => {
  // A new GenAI instance must be created before each call to ensure the latest API key is used.
  const aiWithUserKey = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await aiWithUserKey.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        imageSize: imageSize,
        aspectRatio: aspectRatio
      },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return part.inlineData.data; // Return the base64 string
    }
  }

  throw new Error('No image data found in the response.');
};

export const generateBusinessDescription = async (url: string): Promise<string> => {
    const prompt = `You are a concise marketing copywriter. Analyze the content of the website at ${url}. Based on the content, generate a compelling 2-3 sentence business description (max 500 characters). Focus on what the business does, who it serves, and its key value proposition. Output only the description text.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    // FIX: Ensure response.text is not undefined before trimming to prevent runtime errors.
    return response.text?.trim() ?? '';
};

export const extractWebsiteDna = async (url: string): Promise<{logoUrl: string; colors: string[]; fonts: string; style: string;}> => {
    const prompt = `You are an expert web asset extractor. Analyze the live website at the URL: '${url}'. Your task is to extract its 'Business DNA'. Your entire output must be a single JSON object with keys: "logoUrl", "colors", "fonts", "style".

1.  **Logo URL**: Find the primary logo on the page. You MUST return a full, absolute URL. Follow this priority order strictly:
    1.  First, look for an \`<img>\` tag where \`src\`, \`alt\`, \`class\`, or \`id\` contains "logo".
    2.  If none, look for an \`<img>\` tag inside a \`<header>\` or \`<nav>\` element that is one of the first prominent images.
    3.  If none, look for an SVG element with "logo" in its \`class\` or \`id\`.
    4.  If none, check for a \`<meta property="og:image" content="...">\` tag and use its content URL.
    5.  If none, check for a \`<meta name="twitter:image" content="...">\` tag.
    6.  If none, check for a \`<link rel="apple-touch-icon" href="...">\` tag.
    7.  As a last resort, check for a \`<link rel="icon" href="...">\` tag (favicon).
    
    *Rules for logo selection*:
    - The URL MUST be absolute (start with http or https). If you find a relative URL, resolve it based on the site's base URL.
    - Prefer SVG or PNG formats.
    - Ignore images smaller than 40x40 pixels.
    - Ignore social media icons (e.g., facebook.svg, twitter.png).
    - If after all these steps no logo is found, return an empty string "".

2.  **Colors**: Identify up to 5 primary and secondary colors used on the site (buttons, headers, backgrounds). Return them as an array of hex codes.
3.  **Fonts**: Identify the main font-family used for headings and body text. Return a string like 'Inter, sans-serif'.
4.  **Style**: Describe the overall visual style in a short phrase (e.g., 'Clean and corporate', 'Vibrant and playful', 'Minimalist and modern').`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    logoUrl: { type: Type.STRING },
                    colors: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    fonts: { type: Type.STRING },
                    style: { type: Type.STRING }
                },
                required: ["logoUrl", "colors", "fonts", "style"]
            }
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};

const brandDnaProfileSchema = {
    type: Type.OBJECT,
    properties: {
        brand_tone: {
            type: Type.OBJECT,
            properties: {
                primary_tone: { type: Type.STRING },
                secondary_modifiers: { type: Type.ARRAY, items: { type: Type.STRING } },
                writing_style: { type: Type.STRING },
                emotional_positioning: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["primary_tone", "secondary_modifiers", "writing_style", "emotional_positioning"],
        },
        visual_identity: {
            type: Type.OBJECT,
            properties: {
                primary_colors: { type: Type.ARRAY, items: { type: Type.STRING } },
                secondary_colors: { type: Type.ARRAY, items: { type: Type.STRING } },
                color_mood: { type: Type.STRING },
                typography_style: { type: Type.STRING },
                layout_style: { type: Type.STRING },
            },
            required: ["primary_colors", "secondary_colors", "color_mood", "typography_style", "layout_style"],
        },
        logo_profile: {
            type: Type.OBJECT,
            properties: {
                has_logo: { type: Type.BOOLEAN },
                logo_style: { type: Type.STRING },
                dominant_colors: { type: Type.ARRAY, items: { type: Type.STRING } },
                is_reusable: { type: Type.BOOLEAN },
            },
            required: ["has_logo", "logo_style", "dominant_colors", "is_reusable"],
        },
        brand_positioning: {
            type: Type.OBJECT,
            properties: {
                value_proposition: { type: Type.STRING },
                primary_customer_intent: { type: Type.STRING },
                local_vs_national: { type: Type.STRING },
                differentiation_signals: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["value_proposition", "primary_customer_intent", "local_vs_national", "differentiation_signals"],
        },
        audience_profile: {
            type: Type.OBJECT,
            properties: {
                target_audience: { type: Type.STRING },
            },
            required: ["target_audience"],
        },
        industry_context: {
            type: Type.OBJECT,
            properties: {
                category_confirmation: { type: Type.STRING },
                service_focus_areas: { type: Type.ARRAY, items: { type: Type.STRING } },
                local_relevance_signals: { type: Type.ARRAY, items: { type: Type.STRING } },
                professionalism_cues: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["category_confirmation", "service_focus_areas", "local_relevance_signals", "professionalism_cues"],
        },
    },
    required: ["brand_tone", "visual_identity", "logo_profile", "brand_positioning", "audience_profile", "industry_context"],
};


export const extractBrandDnaProfile = async (business: BusinessProfile): Promise<BrandDnaProfile> => {
    const prompt = `You are an expert brand strategist analyzing a business website to extract its Brand and Business DNA. This is a one-time analysis to create an authoritative brand profile that will be reused across all marketing tools. Be accurate, neutral, and consistent. Do NOT generate any marketing content or ideas. Focus ONLY on brand identity extraction.

Business Name: ${business.name}
Business Category: ${business.category}
// FIX: Corrected template literal for business location.
Business Location: ${business.location}
Business Website URL: ${business.websiteUrl}

Analyze the live website and return a complete, structured Brand DNA profile. Your entire output must be a single JSON object matching the provided schema.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: brandDnaProfileSchema,
        },
    });
    
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};

export const detectGbpOnWebsite = async (websiteUrl: string, businessName: string): Promise<BusinessSearchResult | null> => {
    const prompt = `You are an expert web analyst and local SEO specialist. Analyze the live website at ${websiteUrl} for a business named "${businessName}". Your goal is to find its official Google Business Profile and return its details.

Follow these steps in order:
1.  Scan the HTML for any \`<a>\` tags with an \`href\` attribute pointing to Google Maps (e.g., includes 'google.com/maps', 'g.page', 'goo.gl/maps', 'business.google.com').
2.  If no direct link is found, scan for JSON-LD schema (\`<script type="application/ld+json">\`) with \`@type\` of "LocalBusiness" or a subtype, and look for a 'hasMap' or 'sameAs' property pointing to a Google Maps URL.
3.  If no link is found, scan for an embedded Google Maps \`<iframe>\`.
4.  If you find a URL through any of these methods, use it to find the definitive business details using search.
5.  If no URL is found, as a fallback, search Google using the business name "${businessName}" and any address or phone number you can find on the website's contact page or footer to locate the correct profile.

Once you have confidently identified the correct Google Business Profile, return its details as a single JSON object. The details must include: business name, full address, star rating, total review count, and primary category.

If you cannot find a confident match for the Google Business Profile after trying all methods, your entire output must be a single JSON object with a single key "business" set to \`null\`. Do not guess.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    business: {
                        type: Type.OBJECT,
                        nullable: true,
                        properties: {
                            name: { type: Type.STRING },
                            address: { type: Type.STRING },
                            rating: { type: Type.NUMBER },
                            reviewCount: { type: Type.INTEGER },
                            category: { type: Type.STRING },
                        }
                    }
                },
                required: ["business"]
            }
        },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result.business || null;
}

// --- JetCreate Services ---

const campaignIdeasSchema = {
    type: Type.OBJECT,
    properties: {
        campaign_ideas: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "A unique ID for the campaign idea." },
                    name: { type: Type.STRING, description: "A catchy, short name for the campaign." },
                    description: { type: Type.STRING, description: "A one-sentence description of the campaign's core concept." },
                    channels: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of suggested marketing channels (e.g., 'Social Media', 'Google Ads', 'Email')." }
                },
                required: ["id", "name", "description", "channels"]
            }
        }
    }
};

export const generateCampaignIdeas = async (profileData: ProfileData): Promise<CampaignIdea[]> => {
    const prompt = `You are a creative director inside JetSuite. Your task is to generate 3-5 distinct, on-brand campaign ideas for the following business. The ideas should be relevant to the business category and location. Use the provided Brand DNA to ensure the concepts align with the brand's tone, style, and positioning.

Business Name: ${profileData.business.name}
Business Category: ${profileData.business.category}
Location: ${profileData.business.location}
Brand DNA Profile: ${JSON.stringify(profileData.brandDnaProfile)}

Your entire output must be a single JSON object matching the provided schema.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: campaignIdeasSchema,
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText).campaign_ideas || [];
};


const creativeAssetsSchema = {
    type: Type.OBJECT,
    properties: {
        social_posts: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    platform: { type: Type.STRING },
                    copy: { type: Type.STRING },
                    visual_suggestion: { type: Type.STRING }
                },
                required: ["platform", "copy", "visual_suggestion"]
            }
        },
        ad_copy: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    headline: { type: Type.STRING },
                    description: { type: Type.STRING },
                    cta: { type: Type.STRING }
                },
                required: ["headline", "description", "cta"]
            }
        }
    },
    required: ["social_posts", "ad_copy"]
};

export const generateCreativeAssets = async (campaign: CampaignIdea, profileData: ProfileData, modifier?: string): Promise<CreativeAssets> => {
    const prompt = `You are a creative engine inside JetCreate. Your task is to generate a full suite of on-brand creative assets for the selected marketing campaign. You must adhere strictly to the provided Brand DNA.

**Business & Brand DNA Context:**
- Business Name: ${profileData.business.name}
- Business Category: ${profileData.business.category}
- Location: ${profileData.business.location}
- Brand DNA Profile: ${JSON.stringify(profileData.brandDnaProfile)}

**Selected Campaign:**
- Name: ${campaign.name}
- Description: ${campaign.description}
${modifier ? `- **Refinement Prompt:** "${modifier}"\n` : ''}
**Asset Generation Task:**
Generate a set of creative assets for this campaign.
1.  **Social Posts**: Create 3 distinct posts for different platforms (e.g., Instagram, Facebook, LinkedIn), including copy and a visual suggestion for each.
2.  **Ad Copy**: Create 2 variations of ad copy, each with a headline, description, and a call-to-action (CTA).

Your entire output must be a single JSON object matching the provided schema.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: creativeAssetsSchema,
        },
    });
    
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};