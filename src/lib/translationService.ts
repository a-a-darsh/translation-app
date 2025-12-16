// Translation service that handles API calls to OpenAI and Anthropic
// This service acts as a bridge between our app and the AI providers

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { 
  TranslationRequest, 
  TranslationResponse, 
  JsonTranslationRequest, 
  JsonTranslationResponse,
  Provider,
  ApiError,
  JsonValue,
  JsonObject,
  JsonArray
} from '../types/translation';

// Initialize API clients with proxy settings
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_PROXY_TOKEN || process.env.PROXY_TOKEN || '',
  baseURL: process.env.NEXT_PUBLIC_OPENAI_BASE_URL || process.env.OPENAI_BASE_URL,
  dangerouslyAllowBrowser: true // Required for client-side usage
});

const anthropic = new Anthropic({
  apiKey: process.env.NEXT_PUBLIC_PROXY_TOKEN || process.env.PROXY_TOKEN || '',
  baseURL: process.env.NEXT_PUBLIC_ANTHROPIC_BASE_URL || process.env.ANTHROPIC_BASE_URL,
  dangerouslyAllowBrowser: true // Required for client-side usage
});

/**
 * Translates plain text using the selected AI provider
 * @param request - Translation request with text, languages, and provider
 * @returns Promise with translated text
 */
export async function translateText(request: TranslationRequest): Promise<TranslationResponse> {
  try {
    const { text, sourceLanguage, targetLanguage, provider } = request;
    
    // Create the translation prompt
    const prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}. 
    Only return the translation, no additional text or explanations.
    
    Text to translate: "${text}"`;

    let translatedText: string;

    if (provider === 'openai') {
      // Use OpenAI's GPT model for translation
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator. Translate text accurately and naturally. Return only the translation without any additional text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent translations
        max_tokens: 1000
      });

      translatedText = response.choices[0]?.message?.content?.trim() || '';
      
    } else if (provider === 'anthropic') {
      // Use Anthropic's Claude model for translation
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      translatedText = response.content[0]?.type === 'text' ? response.content[0].text.trim() : '';
    } else {
      throw new Error('Invalid provider selected');
    }

    if (!translatedText) {
      throw new Error('No translation received from the API');
    }

    return {
      translatedText,
      provider
    };

  } catch (error) {
    console.error('Translation error:', error);
    throw {
      message: error instanceof Error ? error.message : 'Translation failed',
      code: 'TRANSLATION_ERROR'
    } as ApiError;
  }
}

/**
 * Recursively translates all string values in a JSON object
 * @param obj - The JSON object to translate
 * @param sourceLanguage - Source language code
 * @param targetLanguage - Target language code
 * @param provider - AI provider to use
 * @returns Promise with translated JSON object
 */
async function translateJsonRecursive(
  obj: JsonValue, 
  sourceLanguage: string, 
  targetLanguage: string, 
  provider: Provider
): Promise<JsonValue> {
  if (typeof obj === 'string') {
    // Translate string values
    const translation = await translateText({
      text: obj,
      sourceLanguage,
      targetLanguage,
      provider
    });
    return translation.translatedText;
  } else if (Array.isArray(obj)) {
    // Recursively translate array elements
    const translatedArray: JsonArray = [];
    for (const item of obj) {
      translatedArray.push(await translateJsonRecursive(item, sourceLanguage, targetLanguage, provider));
    }
    return translatedArray;
  } else if (typeof obj === 'object' && obj !== null) {
    // Recursively translate object properties
    const translatedObj: JsonObject = {};
    for (const [key, value] of Object.entries(obj)) {
      translatedObj[key] = await translateJsonRecursive(value, sourceLanguage, targetLanguage, provider);
    }
    return translatedObj;
  } else {
    // Return non-string values as-is (numbers, booleans, null, etc.)
    return obj;
  }
}

/**
 * Translates a JSON object while preserving its structure
 * @param request - JSON translation request
 * @returns Promise with translated JSON
 */
export async function translateJson(request: JsonTranslationRequest): Promise<JsonTranslationResponse> {
  try {
    const { jsonData, sourceLanguage, targetLanguage, provider } = request;

    // Validate JSON input
    if (!jsonData || typeof jsonData !== 'object') {
      throw new Error('Invalid JSON data provided');
    }

    // Translate the JSON recursively
    const translatedJson = await translateJsonRecursive(jsonData, sourceLanguage, targetLanguage, provider);

    return {
      translatedJson,
      provider
    };

  } catch (error) {
    console.error('JSON translation error:', error);
    throw {
      message: error instanceof Error ? error.message : 'JSON translation failed',
      code: 'JSON_TRANSLATION_ERROR'
    } as ApiError;
  }
}

/**
 * Validates JSON string format
 * @param jsonString - String to validate
 * @returns Parsed JSON object if valid, throws error if invalid
 */
export function validateJson(jsonString: string): JsonValue {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    throw {
      message: 'Invalid JSON format. Please check your syntax.',
      code: 'INVALID_JSON'
    } as ApiError;
  }
}