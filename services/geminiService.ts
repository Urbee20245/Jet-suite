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
                            sourceModule: { type: Type.STRING }
                        },
                        required: ["title", "description", "effort", "sourceModule"]
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
                    sourceModule: { type: Type.STRING }
                },
                required: ["title", "description", "whyItMatters", "effort", "sourceModule"]
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

export const generateSocialPosts = async (businessType: string, topic: string, tone: string, platforms: string[]) => {
    try {
        const ai = getAiClient();
        const currentMonthYear = getCurrentMonthYear();
        const basePrompt = `You are a social media manager. Generate distinct posts for a '${businessType}'. Topic: '${topic}'. Tone: '${tone}'. Platforms: ${platforms.join(', ')}. Use ${currentMonthYear} context.`;
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
        - Niche/Topic: "${request.videoTopic}"
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
```

<dyad-write path="tools/JetImage.tsx" description="Restoring JetImage functionality, removing watermarks/daily limits, implementing monthly credits, and adding YouTube thumbnail generator.">
import React, { useState, useRef, useEffect } from 'react';
import type { Tool, ProfileData } from '../types';
import { generateImage, getTrendingImageStyles, generateYoutubeThumbnailPrompt } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { HowToUse } from '../components/HowToUse';
import { ArrowUpTrayIcon, XCircleIcon, ArrowDownTrayIcon, SparklesIcon, ArrowPathIcon } from '../components/icons/MiniIcons';
import { getSupabaseClient } from '../integrations/supabase/client';

interface JetImageProps {
  tool: Tool;
  profileData: ProfileData;
}

type ImageSize = '1K' | '2K' | '4K';
type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

interface Style {
  name: string;
  description: string;
  prompt: string;
}

export const JetImage: React.FC<JetImageProps> = ({ tool, profileData }) => {
  const [prompt, setPrompt] = useState('google nano banana'); // Set initial prompt for testing
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHowTo, setShowHowTo] = useState(true);
  const [activeTab, setActiveTab] = useState<'standard' | 'youtube'>('standard');

  // Input image for image-to-image
  const [inputImage, setInputImage] = useState<{ base64: string; mimeType: string; dataUrl: string; } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trending styles
  const [trendingStyles, setTrendingStyles] = useState<Style[]>([]);
  const [isLoadingStyles, setIsLoadingStyles] = useState(true);
  const [isRefreshingStyles, setIsRefreshingStyles] = useState(false);
  
  // YouTube thumbnail
  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [youtubeNiche, setYoutubeNiche] = useState('');
  const [youtubeEmotion, setYoutubeEmotion] = useState('');
  const [loadingYoutube, setLoadingYoutube] = useState(false);
  
  // MONTHLY CREDIT SYSTEM (60 generations per month)
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [creditsLimit, setCreditsLimit] = useState(60);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const MONTHLY_CREDIT_LIMIT = 60;

  // Load monthly credits
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoadingCredits(false);
      return;
    }
    
    const loadCredits = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoadingCredits(false);
          return;
        }

        const currentMonthYear = new Date().toISOString().slice(0, 7); // "YYYY-MM"

        const { data: creditRecord } = await supabase
          .from('user_credits')
          .select('*')
          .eq('user_id', user.id)
          .eq('month_year', currentMonthYear)
          .maybeSingle();

        if (creditRecord) {
          setCreditsUsed(creditRecord.credits_used);
          setCreditsLimit(creditRecord.credits_limit);
        } else {
          const { data: newRecord } = await supabase
            .from('user_credits')
            .insert({
              user_id: user.id,
              month_year: currentMonthYear,
              credits_used: 0,
              credits_limit: MONTHLY_CREDIT_LIMIT
            })
            .select()
            .single();

          if (newRecord) {
            setCreditsUsed(0);
            setCreditsLimit(MONTHLY_CREDIT_LIMIT);
          }
        }
      } catch (err) {
        console.error('[JetImage] Error loading credits:', err);
      } finally {
        setLoadingCredits(false);
      }
    };

    loadCredits();
  }, [profileData.user.id]);

  // Fetch trending styles
  const fetchStyles = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshingStyles(true);
    else setIsLoadingStyles(true);
    
    try {
      const cached = localStorage.getItem('jetimage_trending_styles');
      const now = new Date().getTime();

      if (cached && !forceRefresh) {
        const { timestamp, styles } = JSON.parse(cached);
        if (now - timestamp < 24 * 60 * 60 * 1000) { // 24 hours
          setTrendingStyles(styles);
          setIsLoadingStyles(false);
          return;
        }
      }

      const styles = await getTrendingImageStyles(forceRefresh);
      setTrendingStyles(styles);
      localStorage.setItem('jetimage_trending_styles', JSON.stringify({ timestamp: now, styles }));
    } catch (e) {
      console.error("Failed to fetch trending styles:", e);
      setTrendingStyles([]);
    } finally {
      setIsLoadingStyles(false);
      setIsRefreshingStyles(false);
    }
  };

  useEffect(() => {
    fetchStyles();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const imageObject = {
          dataUrl: dataUrl,
          base64: dataUrl.split(',')[1],
          mimeType: file.type,
        };
        setInputImage(imageObject);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearInputImage = () => {
    setInputImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (creditsUsed >= creditsLimit) {
      setError(`Monthly limit reached! You've used all ${creditsLimit} generations this month. Your limit resets on the 1st of next month.`);
      return;
    }
    
    if (!prompt) {
      setError('Please enter a prompt to describe the image you want to generate.');
      return;
    }
    
    setError('');
    setLoading(true);
    setGeneratedImageUrl(null);
    
    try {
      const base64Data = await generateImage(prompt, imageSize, aspectRatio, inputImage || undefined);
      setGeneratedImageUrl(`data:image/png;base64,${base64Data}`);
      
      // Increment credits
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const currentMonthYear = new Date().toISOString().slice(0, 7);
        const newCreditsUsed = creditsUsed + 1;
        
        await supabase
          .from('user_credits')
          .update({ 
            credits_used: newCreditsUsed,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('month_year', currentMonthYear);
        
        setCreditsUsed(newCreditsUsed);
      }
      
    } catch (err: any) {
      console.error(err);
      setError('Failed to generate image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleYoutubeGenerate = async () => {
    if (creditsUsed >= creditsLimit) {
      setError(`Monthly limit reached! You've used all ${creditsLimit} generations this month. Your limit resets on the 1st of next month.`);
      return;
    }
    
    if (!youtubeTitle) {
      setError('Please enter a video title.');
      return;
    }
    
    setError('');
    setLoadingYoutube(true);
    setGeneratedImageUrl(null);
    
    try {
      // Generate optimized prompt
      const thumbnailPrompt = await generateYoutubeThumbnailPrompt({
        videoTitle: youtubeTitle,
        videoTopic: youtubeNiche,
        businessName: profileData.business.business_name,
        brandTone: profileData.brandDnaProfile?.brand_tone.primary_tone || 'professional',
        brandColors: profileData.brandDnaProfile?.visual_identity.primary_colors || ['#3B82F6', '#8B5CF6'],
      });
      
      // Generate image with YouTube thumbnail optimization
      const enhancedPrompt = `YOUTUBE THUMBNAIL (16:9 FORMAT):
${thumbnailPrompt}

CRITICAL REQUIREMENTS:
- Bold, eye-catching text overlay with the title
- High contrast colors for visibility
- Emotion-triggering facial expressions or dramatic visuals
- Professional thumbnail quality that stops scrolling
- Clear focal point
- Vibrant, saturated colors`;

      const base64Data = await generateImage(enhancedPrompt, '4K', '16:9');
      setGeneratedImageUrl(`data:image/png;base64,${base64Data}`);
      
      // Increment credits
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const currentMonthYear = new Date().toISOString().slice(0, 7);
        const newCreditsUsed = creditsUsed + 1;
        
        await supabase
          .from('user_credits')
          .update({ 
            credits_used: newCreditsUsed,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('month_year', currentMonthYear);
        
        setCreditsUsed(newCreditsUsed);
      }
      
    } catch (err: any) {
      console.error(err);
      setError('Failed to generate thumbnail. Please try again.');
    } finally {
      setLoadingYoutube(false);
    }
  };
  
  const handleDownload = () => {
    if (!generatedImageUrl) return;
    
    const a = document.createElement('a');
    a.href = generatedImageUrl;
    a.download = `${prompt.substring(0, 30).replace(/\s/g, '_') || 'jetimage'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const nextResetDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const creditsRemaining = creditsLimit - creditsUsed;

  return (
    <div>
      {showHowTo && (
        <HowToUse toolName={tool.name} onDismiss={() => setShowHowTo(false)}>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Generate up to {MONTHLY_CREDIT_LIMIT} AI images per month (resets monthly).</li>
            <li>Use trending styles or write custom prompts.</li>
            <li>Upload an image for image-to-image transformation.</li>
            <li>Create high-CTR YouTube thumbnails with built-in templates.</li>
            <li>Download unlimited times after generation.</li>
          </ul>
        </HowToUse>
      )}
      
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg relative">
        {/* NEW COMPACT CREDIT BADGE */}
        {!loadingCredits && (
            <div className={`absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                creditsUsed >= creditsLimit 
                    ? 'bg-red-100 text-red-800 border border-red-300' 
                    : 'bg-accent-purple/10 text-accent-purple border border-accent-purple/30'
            }`}>
                <SparklesIcon className="w-4 h-4" />
                <span>{creditsRemaining} Generations</span>
            </div>
        )}
        {loadingCredits && (
            <div className="absolute top-4 right-4 h-7 w-24 bg-gray-100 rounded-full animate-pulse"></div>
        )}
        {/* END NEW COMPACT CREDIT BADGE */}

        <div className="flex items-center gap-4 mb-4">
            <JetProductIcon className="w-8 h-8 text-accent-purple" />
            <div>
                <p className="text-brand-text-muted mb-1">{tool.description}</p>
                <p className="text-sm text-brand-text-muted">
                    Replaces: <span className="text-accent-purple font-semibold">Product Photography & Designer ($1,000-3,000/mo)</span>
                </p>
            </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-brand-border">
          <button
            onClick={() => setActiveTab('standard')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'standard'
                ? 'text-accent-purple border-accent-purple'
                : 'text-brand-text-muted border-transparent hover:text-brand-text'
            }`}
          >
            Standard Image Generator
          </button>
          <button
            onClick={() => setActiveTab('youtube')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'youtube'
                ? 'text-accent-purple border-accent-purple'
                : 'text-brand-text-muted border-transparent hover:text-brand-text'
            }`}
          >
            YouTube Thumbnail Generator
          </button>
        </div>

        {/* STANDARD IMAGE GENERATOR */}
        {activeTab === 'standard' && (
          <form onSubmit={handleSubmit}>
            {/* Upload Base Image */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-brand-text mb-2">Upload Base Image (Optional)</label>
              {inputImage ? (
                <div className="relative group w-32 h-32">
                  <img src={inputImage.dataUrl} alt="Input preview" className="w-full h-full object-cover rounded-lg border-2 border-brand-border" />
                  <button type="button" onClick={clearInputImage} className="absolute -top-2 -right-2 bg-white rounded-full text-red-500 hover:text-red-700 transition-transform group-hover:scale-110">
                    <XCircleIcon className="w-7 h-7" />
                  </button>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-brand-border rounded-lg p-6 text-center cursor-pointer hover:border-accent-purple hover:bg-brand-light transition-colors">
                  <ArrowUpTrayIcon className="w-8 h-8 mx-auto text-brand-text-muted" />
                  <p className="mt-2 text-sm text-brand-text">Click to upload</p>
                  <p className="text-xs text-brand-text-muted">PNG or JPG</p>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                </div>
              )}
            </div>

            {/* Trending Styles */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-brand-text">Trending Styles</label>
                <button
                  type="button"
                  onClick={() => fetchStyles(true)}
                  disabled={isRefreshingStyles}
                  className="flex items-center gap-1 text-xs text-accent-purple hover:text-accent-purple/80 disabled:opacity-50"
                >
                  <ArrowPathIcon className={`w-4 h-4 ${isRefreshingStyles ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              {isLoadingStyles ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="p-3 bg-brand-light border border-brand-border rounded-lg h-24 animate-pulse">
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {trendingStyles.map(style => (
                    <button
                      type="button"
                      key={style.name}
                      onClick={() => setPrompt(style.prompt)}
                      className={`p-3 bg-brand-light border rounded-lg text-left hover:border-accent-purple transition-colors ${
                        prompt === style.prompt ? 'border-accent-purple bg-accent-purple/5' : 'border-brand-border'
                      }`}
                      title={style.prompt}
                    >
                      <p className="text-xs font-bold text-brand-text">{style.name}</p>
                      <p className="text-[10px] text-brand-text-muted mt-1 line-clamp-2">{style.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Prompt */}
            <div className="mb-6">
              <label htmlFor="prompt" className="block text-sm font-medium text-brand-text mb-2">
                {inputImage ? 'Describe how to change the image' : 'Describe the image you want'}
              </label>
              <textarea
                id="prompt"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={inputImage ? "e.g., 'make this a watercolor painting'" : "e.g., 'A futuristic cityscape at sunset, neon lights'"}
                className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
              />
            </div>

            {/* Image Size */}
            <div className="mb-6">
              <span className="block text-sm font-medium text-brand-text mb-2">Image Size</span>
              <div className="flex space-x-2">
                {(['1K', '2K', '4K'] as ImageSize[]).map(size => (
                  <button
                    type="button"
                    key={size}
                    onClick={() => setImageSize(size)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      imageSize === size
                        ? 'bg-accent-purple text-white shadow'
                        : 'bg-brand-light text-brand-text-muted hover:bg-gray-200'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="mb-6">
              <span className="block text-sm font-medium text-brand-text mb-2">Aspect Ratio</span>
              <div className="flex space-x-2">
                {(['1:1', '16:9', '4:3', '3:4', '9:16'] as AspectRatio[]).map(ratio => (
                  <button
                    type="button"
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      aspectRatio === ratio
                        ? 'bg-accent-purple text-white shadow'
                        : 'bg-brand-light text-brand-text-muted hover:bg-gray-200'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            
            <button
              type="submit"
              disabled={loading || creditsUsed >= creditsLimit || loadingCredits}
              className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating Image...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  Generate Image
                </>
              )}
            </button>

            {creditsUsed >= creditsLimit && (
              <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⚠️</div>
                  <div>
                    <p className="text-sm font-bold text-red-800">Monthly Limit Reached</p>
                    <p className="text-xs text-red-700 mt-1">
                      You've used all {creditsLimit} generations for {new Date().toLocaleDateString('en-US', { month: 'long' })}. 
                      Your limit will reset on {nextResetDate}.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        )}

        {/* YOUTUBE THUMBNAIL GENERATOR */}
        {activeTab === 'youtube' && (
          <form onSubmit={(e) => { e.preventDefault(); handleYoutubeGenerate(); }}>
            <div className="mb-6">
              <label htmlFor="youtubeTitle" className="block text-sm font-medium text-brand-text mb-2">
                Video Title <span className="text-red-500">*</span>
              </label>
              <input
                id="youtubeTitle"
                type="text"
                value={youtubeTitle}
                onChange={(e) => setYoutubeTitle(e.target.value)}
                placeholder="e.g., 'How I Made $10,000 in 30 Days'"
                className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="youtubeNiche" className="block text-sm font-medium text-brand-text mb-2">
                Niche/Category (Optional)
              </label>
              <input
                id="youtubeNiche"
                type="text"
                value={youtubeNiche}
                onChange={(e) => setYoutubeNiche(e.target.value)}
                placeholder="e.g., 'Finance', 'Gaming', 'Cooking'"
                className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="youtubeEmotion" className="block text-sm font-medium text-brand-text mb-2">
                Target Emotion (Optional)
              </label>
              <input
                id="youtubeEmotion"
                type="text"
                value={youtubeEmotion}
                onChange={(e) => setYoutubeEmotion(e.target.value)}
                placeholder="e.g., 'Excited', 'Shocked', 'Curious'"
                className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
              />
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            
            <button
              type="submit"
              disabled={loadingYoutube || creditsUsed >= creditsLimit || loadingCredits}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {loadingYoutube ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating Thumbnail...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  Generate YouTube Thumbnail
                </>
              )}
            </button>

            {creditsUsed >= creditsLimit && (
              <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⚠️</div>
                  <div>
                    <p className="text-sm font-bold text-red-800">Monthly Limit Reached</p>
                    <p className="text-xs text-red-700 mt-1">
                      Your limit will reset on {nextResetDate}.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
      
      {(loading || loadingYoutube) && <Loader />}
      
      {generatedImageUrl && (
        <div className="mt-6 bg-brand-card p-6 rounded-xl shadow-lg border border-brand-border">
          <h3 className="text-2xl font-bold mb-4 text-brand-text">Generated Image</h3>
          <img src={generatedImageUrl} alt={prompt || youtubeTitle} className="rounded-lg w-full h-auto max-w-2xl mx-auto border border-brand-border" />
          
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 bg-accent-blue hover:bg-accent-blue/80 text-white font-bold py-3 px-6 rounded-lg transition shadow-lg"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Download Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
};