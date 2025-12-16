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

type AiLanguageCheckResult = {
  detectedLanguage: string;
  languageMismatch: boolean;
  suggestedText: string; // empty string if no mismatch
  translatedText: string;
};

function safeParseAiJson(text: string): AiLanguageCheckResult | null {
  try {
    const parsed = JSON.parse(text);

    if (
        parsed &&
        typeof parsed.detectedLanguage === 'string' &&
        typeof parsed.languageMismatch === 'boolean' &&
        typeof parsed.suggestedText === 'string' &&
        typeof parsed.translatedText === 'string'
    ) {
      return parsed as AiLanguageCheckResult;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Translates plain text using the selected AI provider
 * Also checks if input matches selected source language; if not,
 * performs phonetic (not semantic) conversion into the selected source language’s writing system,
 * then translates that result to the target language (often nonsense).
 */
export async function translateText(request: TranslationRequest): Promise<TranslationResponse> {
  try {
    const { text, sourceLanguage, targetLanguage, provider } = request;

    const systemInstruction = `
You are a language detector + strict translation pipeline.

Goal:
1) Detect the actual language of the user's input text. 
   - When the script given is different than the input language's script and the text in that script does not phonetically resemble the input language: first check if the characters in the incorrect script correspond to correct characters on any common keyboard layouts. For example, 'ㅎㄷㅅ ㅡㄷ ㅐㅕㅅ ㅐㄹ ㅗㄷㄱㄷ' is in Hangul script, but maps to 'Get me out of here' on a standard qwerty keyboard. In this case, languageMismatch is True and suggestedText is 'Get me out of here'.
   - If the previous case fails, convert it phonetically to the selected input language. If the text phonetically resembles the selected input language but is in the wrong script, languageMismatch = False. For example if my input language is english and I write 핼로, this is still clearly 'hello' even if it is in the wrong script, so language mismatch = False. In this case, the detected language is english even if it is written in hangeul.
2) Compare it to the user's selected source language.
3) If the input language does NOT match the selected source language:
   - Create a PHONETIC transliteration of the input into the WRITING SYSTEM typically used for the selected source language (language mismatch is true and suggested text is '')
   - This is NOT a semantic translation. Preserve approximate pronunciation.
   - Then translate THAT phonetic string into the target language.
  If it matches:
   - Translate the original input text from selected source language to target language normally.

Output MUST be valid JSON only, with EXACT keys:
{
  "detectedLanguage": string,
  "languageMismatch": boolean,
  "suggestedText": string,
  "translatedText": string
}

Rules:
- "detectedLanguage" should be a human language name (e.g. "English", "Korean", "Japanese"). 
If the given phonetically resembles the selected input language, but is in the wrong script, detectedLanguage == sourceLanguage. For example, if you write Japanese in latin script, or english in katakana, detectedLanguage would be "Japanese" and "English" respectively.
- "languageMismatch" is true iff detectedLanguage differs from the selected source language. Example: "콘니치와" when input language is "Japanese" => languageMismatch = FALSE because the word is japanese even if it is written using the korean alphabet. Example: "안녕하세요" when input language is "Japanese" => languageMismatch = TRUE because the word is korean. 
- "suggestedText" must contain the phonetic transliteration ONLY if the input text when converted to the right script phonetically resembles the input language. clean up the string to be correctly spelled in the input language (for example, "하이" given as input with english selected would mean "phoneticTextUsed" should be "Hi"). If the script and selected input language are both correct (meaning no phonetic conversion) it should be "".
- Do NOT include any extra keys or commentary.
- ALWAYS check for keyboard mapped equivalence before translating the phonetic string. "좀ㅅ ㅑㄴ ㅕㅔ" = "what is up"
- If the input is gibberish, detectedLanguage = sourceLanguage && DO NOT set "suggestedText" to a non-empty string.
`.trim();

    const userContent = `
Selected source language: ${sourceLanguage}
Target language: ${targetLanguage}

User input:
${text}
`.trim();

    let result: AiLanguageCheckResult | null = null;
    if (provider === 'openai') {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userContent }
        ],
        temperature: 0.2,
        max_tokens: 900
      });

      const raw = response.choices[0]?.message?.content?.trim() || '';
      result = safeParseAiJson(raw);
      console.log(result)

      if (!result) {
        // Fallback: if model didn't produce valid JSON, do a normal translation
        const fallback = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                  'You are a professional translator. Translate text accurately and naturally. Return only the translation without any additional text.'
            },
            {
              role: 'user',
              content: `Translate from ${sourceLanguage} to ${targetLanguage}. Text: "${text}"`
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        });

        const translatedText = fallback.choices[0]?.message?.content?.trim() || '';
        if (!translatedText) throw new Error('No translation received from the API');

        return { translatedText, provider, detectedLanguage: sourceLanguage, languageMismatch: false, suggestedText: '' };
      }
    } else if (provider === 'anthropic') {
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 900,
        temperature: 0.2,
        messages: [
          {
            role: 'user',
            content: `${systemInstruction}\n\n${userContent}`
          }
        ]
      });

      const raw =
          response.content[0]?.type === 'text' ? response.content[0].text.trim() : '';
      result = safeParseAiJson(raw);

      if (!result) {
        // Simple fallback
        const fallback = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1000,
          temperature: 0.3,
          messages: [
            {
              role: 'user',
              content: `Translate the following text from ${sourceLanguage} to ${targetLanguage}. Only return the translation.\n\nText: "${text}"`
            }
          ]
        });

        const translatedText =
            fallback.content[0]?.type === 'text' ? fallback.content[0].text.trim() : '';
        if (!translatedText) throw new Error('No translation received from the API');

        return { translatedText, provider, detectedLanguage: sourceLanguage, languageMismatch: false, suggestedText: '' };
      }
    } else {
      throw new Error('Invalid provider selected');
    }

    if (!result.translatedText) {
      throw new Error('No translation received from the API');
    }

    return {
      translatedText: result.translatedText,
      provider,
      detectedLanguage: result.detectedLanguage,
      languageMismatch: result.languageMismatch,
      suggestedText: result.suggestedText
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

// ... existing code ...

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

// ... existing code ...

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