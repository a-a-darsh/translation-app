// Language configuration for the translation app
// This file contains all supported languages with their codes and names

import { Language, Provider, Model } from '../types/translation';

/**
 * List of supported languages for translation
 * Each language has a code (used by APIs) and a human-readable name
 */
export const supportedLanguages: Language[] = [
    { code: 'English', name: 'English' },
    { code: 'Spanish', name: 'Spanish' },
    { code: 'French', name: 'French' },
    { code: 'German', name: 'German' },
    { code: 'Italian', name: 'Italian' },
    { code: 'Portuguese', name: 'Portuguese' },
    { code: 'Dutch', name: 'Dutch' },
    { code: 'Russian', name: 'Russian' },
    { code: 'Chinese', name: 'Chinese' },
    { code: 'Japanese', name: 'Japanese' },
    { code: 'Korean', name: 'Korean' },
    { code: 'Arabic', name: 'Arabic' },
    { code: 'Hindi', name: 'Hindi' },
    { code: 'Turkish', name: 'Turkish' },
    { code: 'Polish', name: 'Polish' },
    { code: 'Swedish', name: 'Swedish' },
    { code: 'Norwegian', name: 'Norwegian' },
    { code: 'Danish', name: 'Danish' },
    { code: 'Finnish', name: 'Finnish' },
    { code: 'Greek', name: 'Greek' }
];

/**
 * Available AI providers for translation
 * Each provider has an ID and display name
 */
export const providers = [
    { id: 'openai' as Provider, name: 'OpenAI' },
    { id: 'anthropic' as Provider, name: 'Anthropic' }
];

/**
 * Models available per provider
 */
export const providerModels: Record<Provider, Array<{ id: Model; name: string }>> = {
    openai: [
        { id: 'gpt-3.5-turbo', name: 'GPT‑3.5 Turbo' },
        { id: 'gpt-4o-mini', name: 'GPT‑4o mini' },
        { id: 'gpt-5-mini', name: 'GPT‑5-mini' }
    ],
    anthropic: [
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
        { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet (latest)' }
    ]
};

/**
 * Default language selections
 */
export const defaultLanguages = {
    source: 'English',
    target: 'Spanish'
};

/**
 * Default provider selection
 */
export const defaultProvider: Provider = 'openai';

export const defaultModelByProvider: Record<Provider, Model> = {
    openai: 'gpt-3.5-turbo',
    anthropic: 'claude-3-haiku-20240307'
};