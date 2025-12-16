// Main translation interface component
// This component handles both text and JSON translation with a clean, intuitive UI

'use client';

import { useState } from 'react';
import {
  TranslationRequest,
  TranslationResponse,
  JsonTranslationRequest,
  JsonTranslationResponse,
  Provider,
  ApiError
} from '../types/translation';
import { translateText, translateJson, validateJson } from '../lib/translationService';
import { supportedLanguages, providers, defaultLanguages, defaultProvider } from '../config/languages';

export default function TranslationInterface() {
  // State management for the translation interface
  const [activeTab, setActiveTab] = useState<'text' | 'json'>('text');
  const [inputText, setInputText] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [translatedJson, setTranslatedJson] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState(defaultLanguages.source);
  const [targetLanguage, setTargetLanguage] = useState(defaultLanguages.target);
  const [provider, setProvider] = useState<Provider>(defaultProvider);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [languageSuggestion, setLanguageSuggestion] = useState<{
    detectedLanguage: string;
    languageMismatch: boolean;
    suggestedText?: string;
  } | null>(null);

  /**
   * Handles text translation
   * Takes input text, source/target languages, and provider to get translation
   */
  const handleTextTranslation = async () => {
    if (!inputText.trim()) {
      setError('Please enter text to translate');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTranslatedText('');
    setLanguageSuggestion(null);

    try {
      const request: TranslationRequest = {
        text: inputText,
        sourceLanguage,
        targetLanguage,
        provider
      };

      const response: TranslationResponse = await translateText(request);
      console.log(response);
      setTranslatedText(response.translatedText);
      if (response.detectedLanguage == request.sourceLanguage) {
        setLanguageSuggestion({
          detectedLanguage: request.sourceLanguage,
          languageMismatch: false,
          suggestedText: response.suggestedText
        });
      }
      else {
        setLanguageSuggestion({
          detectedLanguage: response.detectedLanguage || request.sourceLanguage,
          languageMismatch: true,
          suggestedText: response.suggestedText || undefined
        });
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Translation failed');
    } finally {
      setIsLoading(false);
    }
  };

  // ... existing code ...

  const swapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setLanguageSuggestion(null);
  };

  const clearAll = () => {
    setInputText('');
    setJsonInput('');
    setTranslatedText('');
    setTranslatedJson('');
    setError(null);
    setLanguageSuggestion(null);
  };

  // ... existing code ...

  return (
      <div className="w-full max-w-6xl mx-auto p-6 bg-white dark:bg-zinc-900 rounded-lg shadow-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            AI Translation App
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Translate text and JSON using OpenAI and Anthropic models
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-6 border-b border-zinc-200 dark:border-zinc-700">
          <button
              onClick={() => setActiveTab('text')}
              className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'text'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-zinc-500 hover:text-zinc-700'
              }`}
          >
            Text Translation
          </button>
          <button
              onClick={() => setActiveTab('json')}
              className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'json'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-zinc-500 hover:text-zinc-700'
              }`}
          >
            JSON Translation
          </button>
        </div>

        {/* Provider Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Translation Provider
          </label>
          <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as Provider)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
            ))}
          </select>
        </div>

        {/* Language Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Source Language
            </label>
            <select
                value={sourceLanguage}
                onChange={(e) => {
                  setSourceLanguage(e.target.value);
                  setLanguageSuggestion(null);
                }}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {supportedLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
                onClick={swapLanguages}
                className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Swap
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Target Language
            </label>
            <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {supportedLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
        )}

        {/* Text Translation Tab */}
        {activeTab === 'text' && (
            <div className="space-y-6">
              {/* Input Section */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Text to Translate
                </label>
                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter the text you want to translate..."
                    className="w-full h-32 px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    disabled={isLoading}
                />
              </div>

              {/* Translate Button */}
              <button
                  onClick={handleTextTranslation}
                  disabled={isLoading || !inputText.trim()}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? 'Translating...' : 'Translate Text'}
              </button>
              {/* Change text Button */}
              {languageSuggestion?.suggestedText && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md text-sm">
                    <div className="text-amber-900 dark:text-amber-200">
                      Did you mean{' '}
                      <button
                          type="button"
                          className="underline font-medium"
                          onClick={() => {
                            setInputText(languageSuggestion?.suggestedText || 'Error');
                            setLanguageSuggestion(null);
                          }}
                      >
                        {languageSuggestion?.suggestedText}
                      </button>
                    ?
                  </div>
                </div>
              )}

              {/* "Did you mean...?" Suggestion */}
              {languageSuggestion?.languageMismatch === true && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md text-sm">
                    <div className="text-amber-900 dark:text-amber-200">
                      Did you mean{' '}
                      <button
                          type="button"
                          className="underline font-medium"
                          onClick={() => {
                            setSourceLanguage(languageSuggestion.detectedLanguage);
                            setLanguageSuggestion(null);
                          }}
                      >
                        {languageSuggestion.detectedLanguage}
                      </button>
                      ?
                    </div>
                  </div>
              )}
              {/* Output Section */}
              {translatedText && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Translated Text
                    </label>
                    <div className="w-full h-32 px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-md bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white overflow-y-auto">
                      {translatedText}
                    </div>
                  </div>
              )}
            </div>
        )}

        {/* ... existing code ... */}
      </div>
  );
}