// Language configuration for the translation app
// This file contains all supported languages with their codes and names

import { Language, Provider } from '../types/translation';

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
    { id: 'openai' as Provider, name: 'OpenAI GPT-3.5' },
    { id: 'anthropic' as Provider, name: 'Anthropic Claude' }
];

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