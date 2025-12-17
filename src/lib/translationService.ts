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
  JsonArray,
  Model
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

function normOneLine(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function looksUntranslated(args: {
  original: string;
  translated: string;
  sourceLanguage: string;
  targetLanguage: string;
}): boolean {
  const { original, translated, sourceLanguage, targetLanguage } = args;

  if (!original.trim() || !translated.trim()) return false;
  if (sourceLanguage.trim() === targetLanguage.trim()) return false;

  // If output is identical to input, it very likely wasn’t translated.
  return normOneLine(original) === normOneLine(translated);
}

/**
 * Translates plain text using the selected AI provider
 * Also checks if input matches selected source language; if not,
 * performs phonetic (not semantic) conversion into the selected source language’s writing system,
 * then translates that result to the target language (often nonsense).
 */
export async function translateText(request: TranslationRequest): Promise<TranslationResponse> {
  try {
    const { text, sourceLanguage, targetLanguage, provider, model } = request;

    const systemInstruction = `
    You are a language detection + translation pipeline.
    Return VALID JSON ONLY with EXACT keys:
    {
      "detectedLanguage": string,
      "languageMismatch": boolean,
      "suggestedText": string,
      "translatedText": string
    }
    
    DEFINITIONS (CRITICAL)
    - "Language mismatch" ONLY means: the input is actually written in a different human language than the selected sourceLanguage.
    - If the user intended the selected sourceLanguage but typed it in the wrong script (keyboard layout mistake or phonetic wrong-script),
      that is NOT a language mismatch. In that case: languageMismatch MUST be false, and suggestedText contains the corrected sourceLanguage text.
    - suggestedText MUST be "" unless you performed a real conversion that produces a DIFFERENT string than the original input.
    
    ==================================================
    STEP 1 — DETECT + CORRECT INPUT (IN THIS ORDER)
    ==================================================
    
    Input:
    - selected sourceLanguage
    - user input text
    
    Your job in Step 1 is to decide:
    (A) Is the input normal and valid for the source language (i.e. Correct Script = True, Valid words = True). If the input meets these conditions, skip to the Translation Step.
    (B) If the above fails, check is it actually another language? (languageMismatch = true)
    (C) If the above fails, is it the selected sourceLanguage but written incorrectly (wrong script / wrong keyboard)? (languageMismatch = false, suggestedText set)
    (D) Or is it gibberish? (languageMismatch = false, suggestedText="")
    
    Always follow checks in this exact order:
    
    --------------------------------------------------
    1) KEYBOARD LAYOUT MAPPING CHECK (DO THIS FIRST)
    --------------------------------------------------
    Condition: The input text appears to be typed using the keyboard layout of a different script than sourceLanguage.
    
    Action:
    - Treat the input characters as literal key presses on the OTHER keyboard layout.
    - Remap those key positions into the keyboard layout for sourceLanguage.
    - If the literal mapped string becomes readable/coherent in sourceLanguage:
      - detectedLanguage = sourceLanguage
      - languageMismatch = false
      - suggestedText = mapped string (trim + normalize spaces only)
      - STOP Step 1.
    
    If mapping does not produce readable sourceLanguage text:
    - suggestedText = ""
    - Continue.
    
    --------------------------------------------------
    2) PHONETIC WRONG-SCRIPT CHECK (ONLY IF #1 FAILED)
    --------------------------------------------------
    Condition: The input is in the wrong script for sourceLanguage, but phonetically resembles sourceLanguage.
    
    Action:
    - Convert the input into the normal writing system of sourceLanguage, preserving pronunciation (NOT semantic translation).
    - If conversion is plausible:
      - detectedLanguage = sourceLanguage
      - languageMismatch = false
      - suggestedText = {input text written in source script}
      - STOP Step 1.
    
    Examples (sourceLanguage=English):
    - input "핼로" -> detectedLanguage="English", languageMismatch=false, suggestedText="hello"
    
    
    Examples (sourceLanguage=Japanese):
    - input "konnichiwa" or "kon'nichiwa" -> detectedLanguage="Japanese", languageMismatch=false, suggestedText="こんにちは"
    
    IMPORTANT:
    - This is NOT a language mismatch. languageMismatch MUST remain false.
    
    --------------------------------------------------
    3) TRUE LANGUAGE CHECK (ONLY IF #1 AND #2 FAILED)
    --------------------------------------------------
    If the input is valid, meaningful text in some other language (not sourceLanguage):
      - detectedLanguage = that other language
      - languageMismatch = true
      - suggestedText = ""   (do NOT "correct" it)
      - STOP Step 1.
    
    --------------------------------------------------
    4) GIBBERISH CHECK (ONLY IF NONE OF THE ABOVE APPLY)
    --------------------------------------------------
    If the input is gibberish / not meaningful in any language:
      - detectedLanguage = sourceLanguage
      - languageMismatch = false
      - suggestedText = ""
      - STOP Step 1.
    
    ==================================================
    STEP 2 — TRANSLATION
    ==================================================
    Rules:
    - Determine sourceTextForTranslation:
      - If suggestedText != "" use suggestedText
      - Else use original input text
    - Translate sourceTextForTranslation from sourceLanguage -> targetLanguage.
    - translatedText MUST be in targetLanguage (script + language).
    
    IMPORTANT:
    - Even if detectedLanguage != sourceLanguage (languageMismatch=true), you MUST still produce translatedText.
      (Translate the original input as-is into targetLanguage.)
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
        model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userContent }
        ],
      });

      const raw = response.choices[0]?.message?.content?.trim() || '';
      result = safeParseAiJson(raw);
      console.log(result)

      if (!result) {
        // Fallback: if model didn't produce valid JSON, do a normal translation
        const fallback = await openai.chat.completions.create({
          model,
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

        });

        const translatedText = fallback.choices[0]?.message?.content?.trim() || '';
        if (!translatedText) throw new Error('No translation received from the API');

        return { translatedText, provider, detectedLanguage: sourceLanguage, languageMismatch: false, suggestedText: '' };
      }
    } else if (provider === 'anthropic') {
      const response = await anthropic.messages.create({
        model,
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
          model,
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

    // Normalize suggestedText contract:
    if (result.languageMismatch) {
      const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
      if (!result.suggestedText || norm(result.suggestedText) === norm(text)) {
        result.suggestedText = '';
      }
    }
    let suggested : string = result.suggestedText;
    if (suggested === userContent) {
      result.suggestedText = '';
    }

    let verify = await openai.responses.create({
    model,
    instructions:  `You are a verification and correction function.
                    
                    Rules (must follow exactly):
                    - Output ONLY the final translated text.
                    - Do NOT include labels, prefixes, explanations, or quotes.
                    - Do NOT include words like "Translation", "Corrected", or similar.
                    - If the attempt is already in the target language, output it unchanged.
                    - If it is not, output the corrected translation in the target language.`,
    input: `Source: ${sourceLanguage} Target: ${targetLanguage}.\n\nTranslation Attempt:\n${result.translatedText}`
    })
    result.translatedText = verify.output_text

    // NEW: If the model "translated" by returning the original text, retry with a strict translator.
    if (result.suggestedText === result.translatedText) {
      if (provider === 'openai') {
        const retry = await openai.responses.create({
          model,
          instructions:
            'You are a professional translator. Translate accurately and naturally. Return ONLY the translation. Do not repeat the input.',
          input: `Translate from ${sourceLanguage} to ${targetLanguage}.\n\nText:\n${text}`
        });

        const retryText = getOpenAIResponseText(retry);
        if (retryText) {
          result.translatedText = retryText;
        }
      } else if (provider === 'anthropic') {
        const retry = await anthropic.messages.create({
          model,
          max_tokens: 1000,
          temperature: 0.2,
          messages: [
            {
              role: 'user',
              content:
                `Translate from ${sourceLanguage} to ${targetLanguage}. ` +
                `Return ONLY the translation. Do not repeat the input.\n\nText:\n${text}`
            }
          ]
        });

        const retryText =
          retry.content[0]?.type === 'text' ? retry.content[0].text.trim() : '';
        if (retryText) {
          result.translatedText = retryText;
        }
      }
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
 * @param model - Model to use
 * @returns Promise with translated JSON object
 */
async function translateJsonRecursive(
    obj: JsonValue,
    sourceLanguage: string,
    targetLanguage: string,
    provider: Provider,
    model: Model
): Promise<JsonValue> {
  if (typeof obj === 'string') {
    // Translate string values
    const translation = await translateText({
      text: obj,
      sourceLanguage,
      targetLanguage,
      provider,
      model
    });
    return translation.translatedText;
  } else if (Array.isArray(obj)) {
    // Recursively translate array elements
    const translatedArray: JsonArray = [];
    for (const item of obj) {
      translatedArray.push(await translateJsonRecursive(item, sourceLanguage, targetLanguage, provider, model));
    }
    return translatedArray;
  } else if (typeof obj === 'object' && obj !== null) {
    // Recursively translate object properties
    const translatedObj: JsonObject = {};
    for (const [key, value] of Object.entries(obj)) {
      translatedObj[key] = await translateJsonRecursive(value, sourceLanguage, targetLanguage, provider, model);
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
    const { jsonData, sourceLanguage, targetLanguage, provider, model } = request;

    // Validate JSON input
    if (!jsonData || typeof jsonData !== 'object') {
      throw new Error('Invalid JSON data provided');
    }

    // Translate the JSON recursively
    const translatedJson = await translateJsonRecursive(jsonData, sourceLanguage, targetLanguage, provider, model);

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

type OpenAIResponsesLike = {
  output_text?: string;
  output?: Array<{
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

function getOpenAIResponseText(response: unknown): string {
  const r = response as OpenAIResponsesLike;

  if (typeof r.output_text === 'string') return r.output_text.trim();

  const joined =
      Array.isArray(r.output)
          ? r.output
              .flatMap((item) => (Array.isArray(item?.content) ? item.content : []))
              .filter((c) => c?.type === 'output_text' && typeof c?.text === 'string')
              .map((c) => c.text as string)
              .join('')
          : '';

  return joined.trim();
}

