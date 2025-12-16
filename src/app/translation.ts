// Type definitions for the translation app
// These types ensure type safety throughout the application

export type Provider = 'openai' | 'anthropic';

export interface Language {
    code: string;
    name: string;
}

export interface TranslationRequest {
    text: string;
    sourceLanguage: string;
    targetLanguage: string;
    provider: Provider;
}

export interface TranslationResponse {
    translatedText: string;
    provider: Provider;
}

export interface JsonTranslationRequest {
    jsonData: JsonValue;
    sourceLanguage: string;
    targetLanguage: string;
    provider: Provider;
}

// Define a proper type for JSON values to avoid 'any'
export type JsonValue =
    | string
    | number
    | boolean
    | null
    | JsonObject
    | JsonArray;

export interface JsonObject {
    [key: string]: JsonValue;
}

export interface JsonArray extends Array<JsonValue> {}

export interface JsonTranslationResponse {
    translatedJson: JsonValue;
    provider: Provider;
}

export interface ApiError {
    message: string;
    code?: string;
}