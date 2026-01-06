
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { RedditPost, GeneratedContent } from "../types";

const API_KEY = process.env.API_KEY || '';

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: API_KEY });
};

/**
 * Uses Gemini with Google Search grounding to find trending Reddit topics.
 */
export const fetchTrendingRedditTopics = async (subreddit: string = 'all'): Promise<RedditPost[]> => {
  const ai = getGeminiClient();
  const prompt = `Find 5 trending and interesting posts from Reddit (specifically r/${subreddit} or similar). 
  Return a list of these posts with their title, author, a brief summary of why it's trending, and an estimated score.
  Focus on visually interesting or emotionally engaging topics that would work well for Instagram.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const structuredResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Transform the following information into a valid JSON array of objects with keys: "id", "title", "subreddit", "author", "score", "url", "summary". 
      Information: ${response.text}`,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(structuredResponse.text || '[]');
  } catch (error) {
    console.error("Error fetching trending topics:", error);
    return [];
  }
};

/**
 * Generates an image and a caption based on a Reddit post.
 * Now includes clickbait text overlay instructions for the image generation.
 */
export const generateContentForPost = async (post: RedditPost): Promise<GeneratedContent> => {
  const ai = getGeminiClient();
  
  // 1. Generate Caption and Hashtags
  const captionResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Create a witty, engaging Instagram caption for a post based on this Reddit topic: "${post.title}". 
    The topic summary is: ${post.summary}. 
    Include 10 relevant hashtags. Format as JSON with keys "caption" and "hashtags" (array).`,
    config: {
      responseMimeType: "application/json",
    }
  });

  const { caption, hashtags } = JSON.parse(captionResponse.text || '{"caption": "", "hashtags": []}');

  // 2. Generate Image with Clickbait Text Overlay
  const imagePrompt = `Create a viral, high-engagement Instagram post visual for: "${post.title}". 
  
  VISUAL STYLE:
  - Artistic, vibrant, and high-contrast.
  - Social media thumbnail aesthetic (YouTube/Instagram style).
  - Use a shocking or intriguing visual hook related to: ${post.summary}.
  
  TEXT OVERLAY REQUIREMENTS:
  - Include BIG, BOLD, eye-catching clickbait-style text integrated into the image.
  - The text should be a high-impact hook like "YOU WON'T BELIEVE THIS!", "BENGALURU'S BIGGEST SECRET", or a summary of the post's core hook.
  - Use bright colors (yellow, red, or white with black outlines) for the text to ensure it's readable.
  - The text should feel like it belongs on a high-engagement social media post.
  
  High definition, 4k, cinematic lighting.`;

  const imageResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: imagePrompt,
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  let imageUrl = '';
  if (imageResponse.candidates?.[0]?.content?.parts) {
    for (const part of imageResponse.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }
  }

  return { imageUrl, caption, hashtags };
};
