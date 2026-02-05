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
 */
const getAiClient = (): GoogleGenAI => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing. AI features are disabled.");
    throw new Error("AI_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

const injectDateContext = (prompt: string): string => {
  const dateContext = getAIDateTimeContextShort();
  return `${dateContext}\n\n${prompt}`;
};

const auditReportSchema = {
    type: Type.OBJECT,
    properties: {
        timestamp: { type: Type.STRING },
        issues: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    issue: { type: Type.STRING },
                    whyItMatters: { type: Type.STRING },
                    fix: { type: Type.STRING },
                    priority: { type: Type.STRING },
                    task: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            effort: { type: Type.STRING },
                            priority: { type: Type.STRING },
                            sourceModule: { type: Type.STRING }
                        },
                        required: ["title", "description", "effort", "priority", "sourceModule"]
                    }
                },
                required: ["id", "issue", "whyItMatters", "fix", "priority", "task"]
            }
        },
        weeklyActions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    whyItMatters: { type: Type.STRING },
                    effort: { type: Type.STRING },
                    sourceModule: { type: Type.STRING },
                    priority: { type: Type.STRING }
                },
                required: ["title", "description", "whyItMatters", "effort", "sourceModule", "priority"]
            }
        }
    },
    required: ["timestamp", "issues", "weeklyActions"]
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
                  businesses: {
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
                  }
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

export const analyzeBusinessListing = async (business: ConfirmedBusiness): Promise<AuditReport> => {
    try {
        const ai = getAiClient();
        const basePrompt = `You are an expert local SEO strategist. Confirmed business: Name: '${business.name}', Address: '${business.address}'. Perform a deep analysis of THIS SPECIFIC Google Business Profile (GBP). Generate structured output according to the schema.`;
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

export const analyzeWebsiteWithLiveApis = async (url: string): Promise<LiveWebsiteAnalysis> => {
    try {
        const ai = getAiClient();
        const basePrompt = `You are operating inside JetViz. Analyze the live website at: '${url}'. Use Google Search to get live data and PageSpeed Insight estimates. Focus on Homepage Clarity, Local SEO, and Trust Signals. Output JSON according to the schema.`;
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
                    ...auditReportSchema.properties,
                    mobile: { type: Type.OBJECT, properties: { performance: { type: Type.NUMBER }, accessibility: { type: Type.NUMBER }, bestPractices: { type: Type.NUMBER }, seo: { type: Type.NUMBER } }, required: ["performance", "accessibility", "bestPractices", "seo"] },
                    desktop: { type: Type.OBJECT, properties: { performance: { type: Type.NUMBER }, accessibility: { type: Type.NUMBER }, bestPractices: { type: Type.NUMBER }, seo: { type: Type.NUMBER } }, required: ["performance", "accessibility", "bestPractices", "seo"] }
                },
                required: ["timestamp", "issues", "weeklyActions", "mobile", "desktop"]
              },
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

export const suggestBlogTitles = async (profileData: ProfileData): Promise<string[]> => {
    try {
        const ai = getAiClient();
        const business = profileData.business;
        const brandDna = profileData.brandDnaProfile;
        
        const basePrompt = `You are an expert Local SEO Content Strategist. Your goal is to suggest 10 high-impact, SEO-optimized blog titles for the business: '${business.business_name}' (${business.industry}) in ${business.location}.
        
        Strategy Guidelines:
        - Target "Near Me" intent and local service keywords.
        - Focus on solving customer pain points.
        - Use "How To", "Best of", and "Why You Need" formats.
        - Ensure titles are catchy and encourage clicks (High CTR).
        - Leverage Brand Tone: ${brandDna?.brand_tone.primary_tone}.
        
        Output only a JSON array of 10 strings representing the titles.`;
        const prompt = injectDateContext(basePrompt);

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        titles: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["titles"]
                }
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText).titles || [];
    } catch (error) {
        if (error instanceof Error && error.message === "AI_KEY_MISSING") {
            return [];
        }
        throw error;
    }
};

export const generateLocalContent = async (businessType: string, topic: string, location: string, brandStyle: string) => {
    try {
        const ai = getAiClient();
        const basePrompt = `You are a professional Local SEO copywriter. Write a 600-800 word blog post for a '${businessType}' located in '${location}'. 
        
        Topic: '${topic}'
        Brand Style: '${brandStyle}'
        
        CRITICAL SEO REQUIREMENTS:
        1. Use a clear, H1-wrapped main title.
        2. Use multiple H2 and H3 subheadings for readability and keyword density.
        3. Naturally weave in '${location}' and relevant industry terms.
        4. Focus on providing massive value to a local reader.
        5. Include a strong "About the Author/Business" section and a clear Call to Action at the end.
        6. Start with a 150-character Meta Description wrapped in **Meta Description:** block.
        
        Format the entire response in markdown.`;
        const prompt = injectDateContext(basePrompt);
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text ?? '';
    } catch (error) {
        if (error instanceof Error && error.message === "AI_KEY_MISSING") {
            return "AI features are disabled due to missing API key.";
        }
        throw error;
    }
};

export const generateSocialPosts = async (businessType: string, topic: string, tone: string, platforms: string[], count: number = 2) => {
    try {
        const ai = getAiClient();
        const currentMonthYear = getCurrentMonthYear();
        const basePrompt = `You are a social media manager. Generate exactly ${count} unique and distinct post ideas for a '${businessType}'. Topic: '${topic}'. Tone: '${tone}'. Platforms: ${platforms.join(', ')}. Use ${currentMonthYear} context. Each post MUST have a completely different angle, hook, and visual concept — no duplicates or near-duplicates.`;
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
                        platform: { type: Type.STRING },
                        post_text: { type: Type.STRING },
                        hashtags: { type: Type.STRING },
                        visual_suggestion: { type: Type.STRING }
                      },
                      required: ["platform", "post_text", "hashtags", "visual_suggestion"]
                    }
                  }
                }
              }
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        if (error instanceof Error && error.message === "AI_KEY_MISSING") throw new Error("AI features disabled.");
        throw error;
    }
};

export const fetchBusinessReviews = async (businessName: string, businessAddress: string): Promise<any[]> => {
    try {
        const ai = getAiClient();
        const prompt = `Use Google Search to find recent reviews for "${businessName}" at "${businessAddress}". Return top 10 as JSON.`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }],
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  reviews: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { author: { type: Type.STRING }, rating: { type: Type.INTEGER }, text: { type: Type.STRING }, date: { type: Type.STRING } }, required: ["author", "rating", "text", "date"] } }
                }
              }
            },
        });
        return JSON.parse(response.text.trim()).reviews || [];
    } catch (error) { return []; }
};

export const generateReviewReply = async (review: string, isPositive: boolean, tone: string) => {
    try {
        const ai = getAiClient();
        const prompt = injectDateContext(`Customer review: "${review}". Sentiment: ${isPositive ? 'positive' : 'negative'}. Tone: ${tone}. Draft a professional response.`);
        const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
        return response.text ?? '';
    } catch (error) { return "AI features disabled."; }
};

export const findLeads = async (service: string, area: string) => {
    try {
        const ai = getAiClient();
        const prompt = `Search for people in ${area} asking for ${service} recommendations. Return as markdown list.`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        return response.text ?? '';
    } catch (error) { return "AI features disabled."; }
};

export const generateAdCopy = async (product: string, platform: string) => {
    try {
        const ai = getAiClient();
        const prompt = `Write 3 ads for ${product} on ${platform}. JSON output.`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  ads: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { headline: { type: Type.STRING }, description: { type: Type.STRING }, cta: { type: Type.STRING }, visual_suggestion: { type: Type.STRING } }, required: ["headline", "description", "cta", "visual_suggestion"] } }
                }
              }
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) { throw error; }
};

export const analyzeCompetitor = async (competitorUrl: string): Promise<AuditReport> => {
    try {
        const ai = getAiClient();
        const prompt = `Analyze competitor at ${competitorUrl}. Focus on gaps. JSON output.`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }],
              responseMimeType: "application/json",
              responseSchema: auditReportSchema,
            },
        });
        const report = JSON.parse(response.text.trim()) as AuditReport;
        report.businessName = `Competitor: ${new URL(competitorUrl).hostname}`;
        report.businessAddress = competitorUrl;
        return report;
    } catch (error) { throw error; }
};

export const generateEventIdeas = async (businessType: string, goal: string) => {
    try {
        const ai = getAiClient();
        const prompt = `Brainstorm 5 events for ${businessType} aiming for ${goal}. Markdown list.`;
        const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
        return response.text ?? '';
    } catch (error) { return "AI features disabled."; }
};

export const findKeywords = async (service: string, location: string, descriptiveKeywords: string) => {
    try {
        const ai = getAiClient();
        const prompt = `Find local keywords for ${service} in ${location}. Based on: ${descriptiveKeywords}. JSON output.`;
        const keywordSchema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { keyword: { type: Type.STRING }, monthly_volume: { type: Type.STRING }, difficulty: { type: Type.STRING } }, required: ["keyword", "monthly_volume", "difficulty"] } };
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }],
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  primary_keywords: keywordSchema,
                  long_tail_keywords: keywordSchema,
                  question_keywords: keywordSchema,
                  local_modifier_keywords: keywordSchema
                }
              }
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) { throw error; }
};

export const generateImage = async (
  prompt: string, 
  imageSize: '1K' | '2K' | '4K', 
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1", 
  inputImage?: { base64: string; mimeType: string }
): Promise<string> => {
    try {
        const ai = getAiClient();
        
        // Enhanced prompt for maximum quality
        const enhancedPrompt = `ULTRA HIGH QUALITY COMMERCIAL PHOTOGRAPHY:

${prompt}

CRITICAL QUALITY REQUIREMENTS:
- Professional studio photography with dramatic lighting
- VIVID, highly saturated colors with rich contrast and depth
- Photorealistic textures and materials
- Magazine cover or luxury brand advertising quality
- Sharp focus with beautiful depth of field
- Professional color grading and post-processing
- Award-winning commercial product photography composition`;

        const parts: any[] = [];
        
        if (inputImage) {
            parts.push({ inlineData: { data: inputImage.base64, mimeType: inputImage.mimeType } });
        }
        parts.push({ text: enhancedPrompt });
        
        // TRY IMAGEN 3 FIRST (best quality)
        try {
            console.log('[generateImage] Attempting Imagen 3 generation...');
            
            const imagenConfig: any = {
                generationConfig: {
                    sampleCount: 1,
                    aspectRatio: aspectRatio,
                }
            };
            
            const imagenResponse = await ai.models.generateContent({ 
                model: 'imagen-3.0-generate-001',
                contents: { parts }, 
                config: imagenConfig
            });
            
            for (const part of imagenResponse.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    console.log('[generateImage] Imagen 3 success!');
                    return part.inlineData.data;
                }
            }
            
            throw new Error('No image in Imagen 3 response');
            
        } catch (imagenError) {
            // FALLBACK TO GEMINI if Imagen 3 fails
            console.warn('[generateImage] Imagen 3 failed, falling back to Gemini:', imagenError);
            
            const geminiConfig: any = { 
                imageConfig: { imageSize, aspectRatio } 
            };
            
            const geminiResponse = await ai.models.generateContent({ 
                model: 'gemini-3-pro-image-preview',
                contents: { parts }, 
                config: geminiConfig
            });
            
            for (const part of geminiResponse.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    console.log('[generateImage] Gemini fallback success');
                    return part.inlineData.data;
                }
            }
            
            throw new Error('No image found in Gemini response');
        }
        
    } catch (error) { 
        console.error('[generateImage] Complete failure:', error);
        throw error; 
    }
};

export const generateBusinessDescription = async (url: string): Promise<{ description: string; suggestedCategory: string }> => {
    try {
        const ai = getAiClient();
        const prompt = `Analyze ${url}. Generate 2-3 sentence business description and suggest category from list. JSON output.`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: injectDateContext(prompt),
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { description: { type: Type.STRING }, suggestedCategory: { type: Type.STRING } },
                    required: ["description", "suggestedCategory"]
                }
            },
        });
        return JSON.parse(response.text.trim());
    } catch (error) { return { description: "AI features disabled.", suggestedCategory: "Other" }; }
};

export const extractWebsiteDna = async (url: string): Promise<{logoUrl: string; colors: string[]; fonts: string; style: string; faviconUrl: string;}> => {
    try {
        const ai = getAiClient();
        const prompt = `Extract logo, colors, fonts, style, favicon from ${url}. JSON output.`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: injectDateContext(prompt),
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { logoUrl: { type: Type.STRING }, colors: { type: Type.ARRAY, items: { type: Type.STRING } }, fonts: { type: Type.STRING }, style: { type: Type.STRING }, faviconUrl: { type: Type.STRING } },
                    required: ["logoUrl", "colors", "fonts", "style", "faviconUrl"]
                }
            },
        });
        return JSON.parse(response.text.trim());
    } catch (error) { throw error; }
};

export const generateCampaignIdeas = async (profileData: ProfileData): Promise<CampaignIdea[]> => {
    try {
        const ai = getAiClient();
        const prompt = `Generate 5 campaign ideas for ${profileData.business.business_name}. JSON output.`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: injectDateContext(prompt),
            config: {
              tools: [{ googleSearch: {} }],
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  campaigns: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, description: { type: Type.STRING }, channels: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["id", "name", "description", "channels"] } }
                }
              }
            }
        });
        return JSON.parse(response.text.trim()).campaigns || [];
    } catch (error) { throw error; }
};

export const generateCreativeAssets = async (campaign: CampaignIdea, profileData: ProfileData, refinement?: string): Promise<CreativeAssets> => {
    try {
        const ai = getAiClient();
        const prompt = `Generate social posts and ads for campaign ${campaign.name}. JSON output. ${refinement ? `Refinement: ${refinement}` : ''}`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: injectDateContext(prompt),
            config: {
              tools: [{ googleSearch: {} }],
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  social_posts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { platform: { type: Type.STRING }, copy: { type: Type.STRING }, visual_suggestion: { type: Type.STRING } }, required: ["platform", "copy", "visual_suggestion"] } },
                  ad_copy: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { headline: { type: Type.STRING }, description: { type: Type.STRING }, cta: { type: Type.STRING } }, required: ["headline", "description", "cta"] } }
                },
                required: ["social_posts", "ad_copy"]
              }
            }
        });
        return JSON.parse(response.text.trim()) as CreativeAssets;
    } catch (error) { throw error; }
};

export const generateYoutubeThumbnailPrompt = async (request: YoutubeThumbnailRequest): Promise<string> => {
    try {
        const ai = getAiClient();
        const prompt = `You are a YouTube thumbnail expert. Generate a detailed, high-CTR image generation prompt for a thumbnail based on the following:
        - Video Title: "${request.videoTitle}"
        - Video Topic: "${request.videoTopic}"
        - Target Emotion: "${request.targetEmotion}"
        - Business/Brand: "${request.businessName}"
        - Brand Tone: "${request.brandTone}"
        - Brand Colors: ${request.brandColors.join(', ')}
        
        The output MUST be a single, highly descriptive prompt (max 100 words) optimized for a 16:9 aspect ratio, focusing on dramatic lighting, bold text integration, and high visual impact. Do not include the title in the prompt, only the visual description.`;
        const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: injectDateContext(prompt), config: { tools: [{ googleSearch: {} }] } });
        return response.text ?? '';
    } catch (error) { throw error; }
};

export const getTrendingImageStyles = async (): Promise<Array<{ name: string; description: string; prompt: string }>> => {
    try {
        const ai = getAiClient();
        const currentYear = getCurrentYear();
        
        const prompt = `You are a visual trends expert. Generate 12 trending image styles for ${currentYear}. 
        
        Focus on:
        - Current visual trends in photography and digital art
        - Styles that work well for AI image generation
        - Mix of photography, digital art, and design styles
        - Styles that appeal to business owners and content creators
        
        Return EXACTLY 12 styles as a JSON array. Each style must have:
        - name: Short catchy name (2-3 words max)
        - description: Brief 4-6 word description
        - prompt: Detailed 15-25 word prompt optimized for AI image generation
        
        Examples of good styles: Cinematic Drama, 3D Render, Neon Cyberpunk, Watercolor Dream, Golden Hour, Vintage Film, etc.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: injectDateContext(prompt),
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        styles: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    prompt: { type: Type.STRING }
                                },
                                required: ["name", "description", "prompt"]
                            }
                        }
                    },
                    required: ["styles"]
                }
            }
        });
        
        const parsed = JSON.parse(response.text.trim());
        return parsed.styles || [];
        
    } catch (error) {
        console.error('[getTrendingImageStyles] Error:', error);
        // Fallback to hardcoded styles if AI fails
        return [
            { name: "Cinematic", description: "Dramatic film lighting", prompt: "Cinematic photograph with dramatic lighting, film grain, shallow depth of field, moody atmosphere" },
            { name: "Minimalist", description: "Clean simple design", prompt: "Minimalist design with clean lines, simple composition, pastel colors, lots of negative space" },
            { name: "3D Render", description: "Modern CGI aesthetic", prompt: "Photorealistic 3D render with perfect lighting, raytracing, reflections, ultra-detailed textures, commercial quality" },
            { name: "Neon Cyberpunk", description: "Futuristic neon vibes", prompt: "Neon cyberpunk aesthetic with bright purple and blue lighting, rain-soaked streets, futuristic cityscape" },
            { name: "Watercolor", description: "Soft painted look", prompt: "Soft watercolor painting with flowing colors, artistic brushstrokes, gentle gradients, dreamy atmosphere" },
            { name: "Golden Hour", description: "Warm sunset glow", prompt: "Golden hour photography with warm sunlight, long shadows, beautiful bokeh, magical atmosphere" },
            { name: "Vintage Film", description: "Retro camera aesthetic", prompt: "Vintage film photography with grain, faded colors, nostalgic feel, analog camera aesthetic" },
            { name: "Pop Art", description: "Bold graphic style", prompt: "Pop art style with bold colors, high contrast, comic book aesthetic, halftone dots, vibrant energy" },
            { name: "Studio Portrait", description: "Professional headshot", prompt: "Professional studio portrait with soft lighting, clean background, sharp focus, commercial photography quality" },
            { name: "Dark Moody", description: "Dramatic shadows", prompt: "Dark moody photography with dramatic shadows, low key lighting, mysterious atmosphere, cinematic noir" },
            { name: "Pastel Dream", description: "Soft candy colors", prompt: "Pastel dream aesthetic with soft pink, blue, purple tones, whimsical feel, cotton candy vibes" },
            { name: "Abstract Art", description: "Creative patterns", prompt: "Abstract art with flowing shapes, vibrant colors, creative composition, modern artistic style" }
        ];
    }
};