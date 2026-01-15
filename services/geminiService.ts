import { GoogleGenAI, Type } from "@google/genai";
import type { 
    AuditReport, BusinessSearchResult, ConfirmedBusiness, BusinessDna, 
    BusinessProfile, BrandDnaProfile, ProfileData, CampaignIdea, CreativeAssets,
    LiveWebsiteAnalysis, BusinessReview, YoutubeThumbnailRequest
} from '../types';
import { getCurrentMonthYear, getCurrentYear, getAIDateTimeContextShort } from '../utils/dateTimeUtils';

// Use the environment variable as configured in vite.config.ts
const getApiKey = () => process.env.API_KEY;

/**
 * Helper function to get the AI client instance.
 * Throws an error if the API key is missing, ensuring all AI functions are guarded.
 */
const getAiClient = (): GoogleGenAI => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing. AI features are disabled.");
    throw new Error("AI_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * CRITICAL: Inject current date/time context into every AI prompt
 * This ensures all AI responses use the ACTUAL current date, not 2024
 */
const injectDateContext = (prompt: string): string => {
  const dateContext = getAIDateTimeContextShort();
  return `${dateContext}\n\n${prompt}`;
};

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
    try {
        const ai = getAiClient();
        const basePrompt = `You are a Google Maps search specialist. A user is searching for their business with the query: "${query}". The query could be a business name and location, a Google Maps URL, or a specific store code (e.g., "Google Business Profile with store code 12345"). Use Google Search to find matching business listings on Google Maps. If a store code is provided, prioritize finding that exact business. Return a list of up to 5 of the most relevant results. For each result, provide the business name, full address, star rating, total review count, and primary category. Your entire output must be a single JSON array matching the provided schema. If no businesses are found, return an empty array.`;
        const prompt = injectDateContext(basePrompt);

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
    } catch (error) {
        if (error instanceof Error && error.message === "AI_KEY_MISSING") {
            return [];
        }
        throw error;
    }
}

/**
 * Detects the Google Business Profile associated with a website URL and business name.
 */
export const detectGbpOnWebsite = async (websiteUrl: string, businessName: string): Promise<BusinessSearchResult | null> => {
    try {
        const ai = getAiClient();
        const basePrompt = `You are a Google Business Profile detection specialist. A user provided their website URL: "${websiteUrl}" and business name: "${businessName}". Use Google Search to find the EXACT corresponding Google Business Profile (GBP) listing. Prioritize results where the website URL matches the listing's website or the name/address is an exact match. Return the single best matching result. If no exact match is found, return null.`;
        const prompt = injectDateContext(basePrompt);

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
                    properties: {
                        name: { type: Type.STRING },
                        address: { type: Type.STRING },
                        rating: { type: Type.NUMBER },
                        reviewCount: { type: Type.INTEGER },
                        category: { type: Type.STRING },
                    },
                    required: ["name", "address", "rating", "reviewCount", "category"]
                  }
                }
              }
            },
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        return parsed.business || null;
    } catch (error) {
        if (error instanceof Error && error.message === "AI_KEY_MISSING") {
            return null;
        }
        throw error;
    }
};

/**
 * Extracts the full Brand DNA Profile (tone, positioning, audience) from business details and website analysis.
 */
export const extractBrandDnaProfile = async (business: BusinessProfile): Promise<BrandDnaProfile> => {
    try {
        const ai = getAiClient();
        const basePrompt = `You are an expert brand strategist operating the JetSuite Brand DNA extraction tool. The user's business details are: Name: ${business.business_name}, Industry: ${business.industry}, Website: ${business.business_website}, Description: ${business.business_description}.

        Your task is to generate a comprehensive Brand DNA Profile based on these details and by analyzing the provided website using Google Search. The output MUST strictly adhere to the BrandDnaProfile JSON schema.

        Focus on inferring the following:
        1. Brand Tone: Primary tone, secondary modifiers, writing style, and emotional positioning.
        2. Brand Positioning: Core value proposition, primary customer intent, local vs. national focus, and differentiation signals.
        3. Audience Profile: Detailed description of the target audience.
        4. Industry Context: Confirmation of category, service focus areas, local relevance signals, and professionalism cues.

        If the website is unavailable or details are sparse, use industry best practices for a business of type '${business.industry}' to fill in the gaps, labeling inferred data clearly.`;
        const prompt = injectDateContext(basePrompt);

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        brand_tone: { type: Type.OBJECT, properties: { primary_tone: { type: Type.STRING }, secondary_modifiers: { type: Type.ARRAY, items: { type: Type.STRING } }, writing_style: { type: Type.STRING }, emotional_positioning: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["primary_tone", "secondary_modifiers", "writing_style", "emotional_positioning"] },
                        visual_identity: { type: Type.OBJECT, properties: { primary_colors: { type: Type.ARRAY, items: { type: Type.STRING } }, secondary_colors: { type: Type.ARRAY, items: { type: Type.STRING } }, color_mood: { type: Type.STRING }, typography_style: { type: Type.STRING }, layout_style: { type: Type.STRING } }, required: ["primary_colors", "secondary_colors", "color_mood", "typography_style", "layout_style"] },
                        logo_profile: { type: Type.OBJECT, properties: { has_logo: { type: Type.BOOLEAN }, logo_style: { type: Type.STRING }, dominant_colors: { type: Type.ARRAY, items: { type: Type.STRING } }, is_reusable: { type: Type.BOOLEAN } }, required: ["has_logo", "logo_style", "dominant_colors", "is_reusable"] },
                        brand_positioning: { type: Type.OBJECT, properties: { value_proposition: { type: Type.STRING }, primary_customer_intent: { type: Type.STRING }, local_vs_national: { type: Type.STRING }, differentiation_signals: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["value_proposition", "primary_customer_intent", "local_vs_national", "differentiation_signals"] },
                        audience_profile: { type: Type.OBJECT, properties: { target_audience: { type: Type.STRING } }, required: ["target_audience"] },
                        industry_context: { type: Type.OBJECT, properties: { category_confirmation: { type: Type.STRING }, service_focus_areas: { type: Type.ARRAY, items: { type: Type.STRING } }, local_relevance_signals: { type: Type.ARRAY, items: { type: Type.STRING } }, professionalism_cues: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["category_confirmation", "service_focus_areas", "local_relevance_signals", "professionalism_cues"] }
                    },
                    required: ["brand_tone", "visual_identity", "logo_profile", "brand_positioning", "audience_profile", "industry_context"]
                }
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as BrandDnaProfile;
    } catch (error) {
        if (error instanceof Error && error.message === "AI_KEY_MISSING") {
            throw new Error("AI features are disabled due to missing API key.");
        }
        throw error;
    }
};


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
    try {
        const ai = getAiClient();
        const basePrompt = `You are an expert local SEO strategist upgrading the JetBiz tool. A user has CONFIRMED their business is: Name: '${business.name}', Address: '${business.address}'.
        
        Your task is to perform a deep analysis of THIS SPECIFIC Google Business Profile (GBP). For each issue or competitive gap identified, generate a structured output following the JSON schema. Be extremely specific and generate a unique 'id' for each issue. For the 'weeklyActions' list, you MUST include the 'whyItMatters' field for each task, explaining its direct impact. Your entire output must be a single JSON object matching the provided schema. If the business appears unclaimed, make that a HIGH priority issue.`;
        const prompt = injectDateContext(basePrompt);
        
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
    } catch (error) {
        if (error instanceof Error && error.message === "AI_KEY_MISSING") {
            throw new Error("AI features are disabled due to missing API key.");
        }
        throw error;
    }
};

export const analyzeWebsite = async (url: string): Promise<AuditReport> => {
    try {
        const ai = getAiClient();
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
    } catch (error) {
        if (error instanceof Error && error.message === "AI_KEY_MISSING") {
            throw new Error("AI features are disabled due to missing API key.");
        }
        throw error;
    }
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
    try {
        const ai = getAiClient();
        const basePrompt = `You are operating inside JetViz, the website audit module of JetSuite. Your audits are execution guides, not reports.

Your task is to perform a DEEP analysis of the live website at the URL: '${url}'. You must use Google Search to get live data, including simulating PageSpeed Insights for mobile and desktop.

Your entire output MUST be a single JSON object matching the provided schema.

1.  **PageSpeed Scores**: Provide estimated scores (0-100) for Performance, Accessibility, Best Practices, and SEO for both Mobile and Desktop.
2.  **Issues**: Focus on Homepage Clarity, Local SEO, Conversion Friction, and Trust Signals. For every issue you identify, generate the full structured output (id, issue, whyItMatters, fix, priority, task).
3.  **Weekly Actions**: For the 'weeklyActions' list, you MUST include the 'whyItMatters' field for each task, explaining its direct impact. If a headline is weak or a CTA is missing, provide specific, improved example copy in the 'fix' instructions.`;
        const prompt = injectDateContext(basePrompt);
      
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
    } catch (error) {
        if (error instanceof Error && error.message === "AI_KEY_MISSING") {
            throw new Error("AI features are disabled due to missing API key.");
        }
        throw error;
    }
};

export const generateSocialPosts = async (businessType: string, topic: string, tone: string, platforms: string[]) => {
    try {
        const ai = getAiClient();
        const currentMonthYear = getCurrentMonthYear();
        const currentYear = getCurrentYear();
        const basePrompt = `You are a creative social media manager for local businesses. It is currently ${currentMonthYear}. Generate distinct social media posts for a '${businessType}'. The topic is '${topic}'. The desired tone is '${tone}'. Create a version specifically tailored for each of the following platforms: ${platforms.join(', ')}. Ensure the content is optimized for the style and constraints of each platform. Use current ${currentYear} dates and trends when relevant. For TikTok, suggest a short video concept.`;
        const prompt = injectDateContext(basePrompt);

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
    } catch (error) {
        if (error instanceof Error && error.message === "AI_KEY_MISSING") {
            throw new Error("AI features are disabled due to missing API key.");
        }
        throw error;
    }
};

export const fetchBusinessReviews = async (businessName: string, businessAddress: string): Promise<any[]> => {
    try {
        const ai = getAiClient();
        const currentMonthYear = getCurrentMonthYear();
        const prompt = `You are a Google Business Profile review specialist. Use Google Search to find recent reviews for the business "${businessName}" located at "${businessAddress}". 
        
        Search for reviews on their Google Business Profile listing. Return the most recent 10 reviews you can find.
        
        For each review, provide:
        - author: The reviewer's name
        - rating: Star rating (1-5)
        - text: The full review text
        - date: When the review was posted (as readable format like "2 days ago" or "${currentMonthYear}")
        
        Your entire output must be a single JSON object with a "reviews" array matching the provided schema. If no reviews are found, return an empty array.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }],
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  reviews: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        author: { type: Type.STRING },
                        rating: { type: Type.INTEGER },
                        text: { type: Type.STRING },
                        date: { type: Type.STRING }
                      },
                      required: ["author", "rating", "text", "date"]
                    }
                  }
                }
              }
            },
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        return parsed.reviews || [];
    } catch (error) {
        if (error instanceof Error && error.message === "AI_KEY_MISSING") {
            return [];
        }
        throw error;
    }
};

export const generateReviewReply = async (review: string, isPositive: boolean, tone: string) => {
    try {
        const ai = getAiClient();
        const toneInstruction = tone ? `The tone of the reply should be ${tone}.` : 'The tone of the reply should be professional and empathetic.';
        const basePrompt = `You are a customer service manager. ${toneInstruction} A customer left the following review: "${review}". 
        
        The review is considered ${isPositive ? 'positive' : 'negative'}. 
        
        Draft a concise and appropriate response. 
        - If it's positive, thank them warmly and encourage them to return.
        - If it's negative, acknowledge their issue, apologize sincerely without admitting fault, and offer to resolve the situation offline (e.g., "Please contact us at..."). Do not make excuses.
        
        Provide only the response text.`;
        const prompt = injectDateContext(basePrompt);
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });

        // FIX: Ensure response.text is not undefined to prevent type errors.
        return response.text ?? '';
    } catch (error) {
        if (error instanceof Error && error.message === "AI_KEY_MISSING") {
            return "AI features are disabled due to missing API key.";
        }
        throw error;
    }
};

export const findLeads = async (service: string, area: string) => {
    try {
        const ai = getAiClient();
        const prompt = `You are a lead generation expert for local businesses. A '${service}' provider in '${area}' is looking for new customers. Scour the web using Google Search to find recent (last few weeks) public posts, forum threads, or social media comments where people are asking for recommendations or expressing a need for this service in or near that area. For each potential lead you find, provide a summary of their request, where you found it (e.g., 'Reddit r/cityname'), and the direct quote if possible. Format this as a markdown list. If you can't find anything, say so.`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        // FIX: Ensure response.text is not undefined to prevent type errors.
        return response.text ?? '';
    } catch (error) {
        if (error instanceof Error && error.message === "AI_KEY_MISSING") {
            return "AI features are disabled due to missing API key.";
        }
        throw error;
    }
};

export const generateLocalContent = async (businessType: string, topic: string) => {
    try {
        const ai = getAiClient();
        const basePrompt = `You are a local SEO content writer. Write an engaging and informative blog post for a '${businessType}'. The topic is '${topic}'. The article should be optimized for local search, be at least 400 words long, and have a clear title, introduction, several subheadings using markdown, and a concluding paragraph with a call to action. The tone should be helpful and expert.`;
        const prompt = injectDateContext(basePrompt);
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        // FIX: Ensure response.text is not undefined to prevent type errors.
        return response.text ?? '';
    } catch (error) {
        if (error instanceof Error && error.message === "AI_KEY_MISSING") {
            return "AI features are disabled due to missing API key.";
        }
        throw error;
    }
};

export const generateAdCopy = async (product: string, platform: string) => {
    try {
        const ai = getAiClient();
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
    } catch (error) {
        if (error instanceof Error && error.message === "AI_KEY_MISSING") {
            throw new Error("AI features are disabled due to missing API key.");
        }
        throw error;
    }
};

export const analyzeCompetitor = async (competitorUrl: string): Promise<AuditReport> => {
    try {
        const ai = getAiClient();
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
    } catch (error) {
        if (error instanceof Error && error.message === "AI_KEY_MISSING") {
            throw new Error("AI features are disabled due to missing API key.");
        }
        throw error;
    }
};

export const generateEventIdeas = async (businessType: string, goal: string) => {
    try {
        const ai = getAiClient();
        const prompt = `You are a creative marketing consultant for local businesses. Brainstorm 5 unique and actionable event or promotion ideas for a '${businessType}' whose goal is to '${goal}'. For each idea, provide a catchy name, a brief description of the event/promotion, and a suggestion for how to market it locally. Format the response as a markdown list.`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        // FIX: Ensure response.text is not undefined to prevent type errors.
        return response.text ?? '';
    } catch (error) {
        if (error instanceof Error && error.message === "AI_KEY_MISSING") {
            return "AI features are disabled due to missing API key.";
        }
        throw error;
    }
};

export const findKeywords = async (service: string, location: string, descriptiveKeywords: string) => {
    try {
        const ai = getAiClient();
        const prompt = `You are a local SEO keyword specialist. For a '${service}' business in '${location}', generate a comprehensive list of keywords. The user provided these descriptive keywords: "${descriptiveKeywords}". Use these descriptive keywords to refine your search and find highly relevant, high-intent keywords. For each keyword, provide an estimated monthly search volume (e.g., '10-100', '1K-10K') and a ranking difficulty ('Low', 'Medium', or 'High'). Use Google Search to understand user intent and current search trends.`;

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
                  local_modifier_keywords: { ...keywordSchema, description: "Keywords with a local modifier like 'near me' or specific neighborhoods." }
                }
              }
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        if (error instanceof Error && error.message === "AI_KEY_MISSING") {
            throw new Error("AI features are disabled due to missing API key.");
        }
        throw error;
    }
};

export const generateImage = async (
  prompt: string,
  imageSize: '1K' | '2K' | '4K',
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1",
  inputImage?: { base64: string; mimeType: string }
) => {
    try {
        const ai = getAiClient();

        const parts: any[] = [];
        
        // Add image first if it exists
        if (inputImage) {
            parts.push({
                inlineData: {
                    data: inputImage.base64,
                    mimeType: inputImage.mimeType,
                },
            });
        }
        
        // Then add the text prompt
        parts.push({ text: prompt });

        // Use a multimodal model if an image is provided, otherwise use the dedicated image model
        const modelName = inputImage ? 'gemini-1.5-flash' : 'gemini-3-pro-image-preview';

        const config: any = {};
        // The imageConfig is specific to the image generation model
        if (modelName === 'gemini-3-pro-image-preview') {
            config.imageConfig = {
                imageSize: imageSize,
                aspectRatio: aspectRatio
            };
        }

        const response = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: parts,
            },
            config: config,
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
              return part.inlineData.data; // Return the base64 string
            }
        }

        const textResponse = response.text;
        if (textResponse) {
            throw new Error(`AI returned text instead of an image: "${textResponse.substring(0, 100)}..."`);
        }

        throw new Error('No image data found in the response.');
    } catch (error) {
        if (error instanceof Error && error.message === "AI_KEY_MISSING") {
            throw new Error("AI features are disabled due to missing API key.");
        }
        throw error;
    }
};

export const generateBusinessDescription = async (url: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const prompt = `You are a concise marketing copywriter. Analyze the content of the website at ${url}. Based on the content, generate a compelling 2-3 sentence business description (max 500 characters). Focus on what the business does, who it serves, and its key value proposition. Output only the description text.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        // FIX: Ensure response.text is not undefined before trimming to prevent runtime errors.
        return response.text ?? '';
    } catch (error) {
        if (error instanceof Error && error.message === "AI_KEY_MISSING") {
            return "AI features are disabled due to missing API key.";
        }
        throw error;
    }
};

export const extractWebsiteDna = async (url: string): Promise<{logoUrl: string; colors: string[]; fonts: string; style: string; faviconUrl: string;}> => {
    try {
        const ai = getAiClient();
        const basePrompt = `You are an expert web asset extractor. Analyze the live website at the URL: '${url}'. Your task is to extract its 'Business DNA'. Your entire output must be a single JSON object with keys: "logoUrl", "colors", "fonts", "style", and "faviconUrl".

1.  **Logo URL**: Find the primary logo on the page. You MUST return a full, absolute URL. Follow this priority order strictly:
    1.  First, look for an \`<img>\` tag where \`src\`, \`alt\`, \`class\`, or \`id\` contains "logo".
    2.  If none, look for an \`<img>\` tag inside a \`<header>\` or \`<nav>\` element that is one of the first prominent images.
    3.  If none, look for an SVG element with "logo" in its \`class\` or \`id\`.
    4.  If none, check for a \`<meta property="og:image" content="...">\` tag and use its content URL.
    5.  If none, check for a \`<meta name="twitter:image" content="...">\` tag.
    6.  If none, check for a \`<link rel="apple-touch-icon" href="...">\` tag.
    
    *Rules for logo selection*:
    - The URL MUST be absolute (start with http or https). If you find a relative URL, resolve it based on the site's base URL.
    - Prefer SVG or PNG formats.
    - Ignore images smaller than 40x40 pixels.
    - Ignore social media icons (e.g., facebook.svg, twitter.png).
    - If after all these steps no logo is found, return an empty string "".

2.  **Colors**: Identify up to 8 primary and secondary colors used on the site (buttons, headers, backgrounds). Return them as an array of hex codes. Be comprehensive.
3.  **Fonts**: Identify the main font-family used for headings and body text. Return a string like 'Inter, sans-serif'.
4.  **Style**: Describe the overall visual style in a short phrase (e.g., 'Clean and corporate', 'Vibrant and playful', 'Minimalist and modern').
5.  **Favicon URL**: Find the favicon URL. Look for \`<link rel="icon" href="...">\` or \`<link rel="shortcut icon" href="...">\`. Return the full, absolute URL. If none is found, return an empty string "".`;
        const prompt = injectDateContext(basePrompt);

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
                        style: { type: Type.STRING },
                        faviconUrl: { type: Type.STRING } // NEW FIELD
                    },
                    required: ["logoUrl", "colors", "fonts", "style", "faviconUrl"]
                }
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        if (error instanceof Error && error.message === "AI_KEY_MISSING") {
            throw new Error("AI features are disabled due to missing API key.");
        }
        throw error;
    }
};

/**
 * Generates a high-quality, trend-based prompt for a YouTube thumbnail image.
 */
export const generateYoutubeThumbnailPrompt = async (request: YoutubeThumbnailRequest): Promise<string> => {
    try {
        const ai = getAiClient();
        const basePrompt = `You are an expert YouTube thumbnail designer and trend analyst. The user is creating a video titled: "${request.videoTitle}" on the topic: "${request.videoTopic}". The business is "${request.businessName}" and the brand tone is "${request.brandTone}". Brand colors are: ${request.brandColors.join(', ')}.

        Your task is to generate a single, highly compelling image generation prompt (max 100 words) for a 16:9 YouTube thumbnail. The prompt must:
        1. Be based on current YouTube trends (e.g., high contrast, emotional faces, clear text space, vibrant colors).
        2. Incorporate the brand tone and colors.
        3. Be designed to maximize click-through rate (CTR).
        4. Include a suggestion for text overlay (e.g., "Text Overlay: [Video Title]").
        
        Output ONLY the image generation prompt text.`;
        
        const prompt = injectDateContext(basePrompt);

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        return response.text ?? 'A high-contrast, professional image with space for text overlay.';
    } catch (error) {
        if (error instanceof Error && error.message === "AI_KEY_MISSING") {
            throw new Error("AI features are disabled due to missing API key.");
        }
        throw error;
    }
};


export const getTrendingImageStyles = async (): Promise<Array<{ name: string; description: string; prompt: string }>> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
        { name: "Cinematic", description: "Dramatic lighting, shallow depth of field.", prompt: "A cinematic photograph with dramatic lighting and shallow depth of field." },
        { name: "Minimalist", description: "Clean lines, ample white space, simple composition.", prompt: "A minimalist design with clean lines and ample white space." },
        { name: "Watercolor", description: "Soft edges, blended colors, artistic feel.", prompt: "A watercolor painting with soft edges and blended colors." },
        { name: "3D Render", description: "Hyper-realistic 3D rendering, smooth textures.", prompt: "A hyper-realistic 3D render with smooth textures and vibrant colors." },
        { name: "Vibrant Pop", description: "High contrast, saturated colors, energetic.", prompt: "A vibrant pop art style image with high contrast and saturated colors." },
        { name: "Editorial", description: "Magazine quality, professional, sophisticated.", prompt: "An editorial photograph suitable for a high-end magazine." },
        { name: "Flat Design", description: "Simple 2D graphics, modern, clean shapes.", prompt: "A flat design illustration with simple 2D graphics and clean shapes." },
        { name: "Neon Noir", description: "Dark, moody, illuminated by neon lights.", prompt: "A neon noir scene with dark shadows and bright neon accents." },
    ];
};

export const generateCampaignIdeas = async (profileData: ProfileData): Promise<CampaignIdea[]> => {
    try {
        const ai = getAiClient();
        const business = profileData.business;
        const brandDna = profileData.brandDnaProfile;
        
        const basePrompt = `You are the AI Creative Director for JetSuite. Generate 5 unique, high-impact marketing campaign ideas for the business: '${business.business_name}' (${business.industry}) located in ${business.location}.
        
        The campaigns should leverage the business's Brand DNA (Tone: ${brandDna?.brand_tone.primary_tone}, Style: ${brandDna?.visual_identity.layout_style}, Value Prop: ${brandDna?.brand_positioning.value_proposition}).
        
        For each idea, provide:
        - A catchy name.
        - A brief, compelling description of the campaign's goal and execution.
        - The primary marketing channels it should target (e.g., 'Social Media', 'Ads', 'Email').
        
        Your entire output MUST be a single JSON object with a "campaigns" array matching the provided schema.`;
        const prompt = injectDateContext(basePrompt);

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }],
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  campaigns: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        channels: { type: Type.ARRAY, items: { type: Type.STRING } }
                      },
                      required: ["id", "name", "description", "channels"]
                    }
                  }
                }
              }
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText).campaigns || [];
    } catch (error) {
        if (error instanceof Error && error.message === "AI_KEY_MISSING") {
            throw new Error("AI features are disabled due to missing API key.");
        }
        throw error;
    }
};

export const generateCreativeAssets = async (campaign: CampaignIdea, profileData: ProfileData, refinement?: string): Promise<CreativeAssets> => {
    try {
        const ai = getAiClient();
        const business = profileData.business;
        const brandDna = profileData.brandDnaProfile;
        
        const refinementText = refinement ? `\n\nREFINEMENT INSTRUCTION: ${refinement}` : '';
        
        const basePrompt = `You are the AI Creative Asset Generator for JetSuite. Generate a full suite of creative assets for the campaign: '${campaign.name}' (Goal: ${campaign.description}).
        
        Business: '${business.business_name}' (${business.industry}).
        Brand DNA: Tone: ${brandDna?.brand_tone.primary_tone}, Style: ${brandDna?.visual_identity.layout_style}, Value Prop: ${brandDna?.brand_positioning.value_proposition}.
        
        Generate 3 distinct social media posts (for Instagram, Facebook, and LinkedIn) and 3 distinct ad copy variations (for Google/Facebook Ads).
        
        Ensure all copy is perfectly on-brand and persuasive. The output MUST strictly adhere to the CreativeAssets JSON schema. ${refinementText}`;
        const prompt = injectDateContext(basePrompt);

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }],
              responseMimeType: "application/json",
              responseSchema: {
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
              }
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as CreativeAssets;
    } catch (error) {
        if (error instanceof Error && error.message === "AI_KEY_MISSING") {
            throw new Error("AI features are disabled due to missing API key.");
        }
        throw error;
    }
};