
# AI Translation App

A Next.js + React + TypeScript translation app that supports **text translation** and **JSON translation**, using multiple AI providers (OpenAI + Anthropic) and multiple models per provider.

---

## Brief description of the implementation

### 1) Provider + model selection
- The UI lets you pick an AI **provider** (OpenAI / Anthropic) and then a **model** from that provider.
- A safety guard ensures the selected model always belongs to the selected provider (otherwise it falls back to the provider’s default model).

### 2) Text translation pipeline
- Text translation runs through a detection + correction + translation pipeline designed to handle:
  - Language mismatch (e.g., input language differs from selected “source language”)
  - Script mismatch 
- The API output is strict JSON containing:
  - detectedLanguage
  - languageMismatch (typing valid words from another language)
  - suggestedText (If the language is correct, but there are errors such as wrong script or typos)
  - translatedText

### 3) OpenAI Responses API
- OpenAI calls use the **Responses API** (`client.responses.create`) rather than Chat Completions.
- Because Responses can return text in different shapes, a helper is used to extract the final text safely.

### 4) JSON translation
- JSON translation accepts a pasted JSON document.
- It parses JSON locally first; if parsing fails, the UI shows an error message.
- Translation is applied **only to string values**:
  - Object keys are preserved exactly as-is and are never sent to the model.
  - Each string is translated via a separate `translateText()` request.

---

## Assumptions / decisions

- **Gibberish/fake-word Handling:** For non-words, the input is phonetically transliterated to the selected input language's phonetic system. I wanted to give the user more control over their translator, and I assume if they have selected that language, they want their fake word to be pronounced according to that phonetic system. I've attempted many times with traditional translators in translating non-words from one phonetic system to another, but this is something that none of the popular translators do well. So for example if I try a made up word like "Rihellambra", and choose an input language other than English, I get this:
  <img width="1358" height="327" alt="image" src="https://github.com/user-attachments/assets/d8681bbc-ea77-4369-8b68-d29880d56985" />
 *(in Hangul it says Flame. It gives the same translation for multiple, unrelated languages. For languages do transliterate it, it is almost always according to the english phonetic system---even if I have selected Polish as my input*
  <img width="1304" height="308" alt="image" src="https://github.com/user-attachments/assets/b4a5b228-da53-43f7-868b-3b30fef13b91" />
  *In Hangul it says 'Wimitaseu', even though in Polish `W` is pronounced as `V` in english, requiring `ㅂ` (B) for accurate transliteration from Polish phonetics.*
- **Languages can be typed with any script:** Historically languages have been and continue to be written in many different scripts. It is artificially limiting on many popular translators when trying to type non-latin alphabet languages with the latin alphabet, or vice versa. For example, if you use OCR on Turkish writing older than a century, most translators would not be able to make sense of it due to it using the Arabic script (modern Turkish uses Latin). To take advantage of the flexibility of LLMs, I separated script and word detection and you can write any language in any alphabet. Not only will it translate your phrase phonetically, it will give you a suggestion to write it in the normal script---useful for languages like Japanese where children do not learn much of the most common script until age 9.
<img width="449" height="989" alt="image" src="https://github.com/user-attachments/assets/6c8834db-3fa7-4e6a-a3de-e2938b01c4df" />
  *(Arabic in latin to Korean)*
---

## How to run the project locally

### Prereqs
- Node.js (18+ recommended for Next.js 15)
- npm

### Install
```
bash
npm install
```
### Configure environment variables
Create a `.env.local` file in the project root and set:
```
PROXY_TOKEN=[API KEY]
OPENAI_BASE_URL=https://hiring-proxy.gtx.dev/openai
ANTHROPIC_BASE_URL=https://hiring-proxy.gtx.dev/anthropic
```
### Run dev server
```
bash
npm run dev
```
Then open:
- http://localhost:3000

---

## Any challenges faced

- **Responses API output parsing:** The OpenAI Responses API can deliver text in different response shapes (`output_text` vs nested content arrays), so extracting the final output reliably required a small helper.
- **LLM consistency:** Even with strict instructions, models sometimes return:
  - redundant `suggestedText` (identical to input)
    - A common problem was the LLM suggesting "Did you mean こんにちは?" when the input was exactly "こんにちは".
  - The same input but in a different script (rather than the input translated to the target language).
  - unchanged “translations” for some strings inside JSON
  - Straight up wrong values, despite clear instruction
    - I stopped making much use of languageMismatch because I couldn't reliably tell when the LLM would return what.
  - Sometimes the LLM would just not translate some parts:
 ```
"key1": "To be or not to be", #<---
"key2": "それが問題です",
"key3": {
"key4": "こんにちは、世界！",
"key5": "Typescriptは素晴らしいです！"
},
"do_not_translate_this_key": "ただ、この値を翻訳してください！"
}
```
  - 
  These required guardrails (post-processing + validation) to make behavior more predictable.

---

## What I would improve with more time

1) **Move provider calls to server routes**
   - Use Next.js route handlers so secrets never reach the browser
   - Add request rate limiting and abuse protection

2) **Pre-processing**
   - The biggest hurdle was due to giving the model one huge instruction and trying to get it to return every value correctly at once
   - With more time I would preprocess the input, extracting information such as Language, Script, phonetic representation, so we can do the logic in discreet steps rather than having the LLM unreliably handle everything and all at once.

3) **Detection of Keyboard mappings**
   - I tried to add the feature for detecting when the user types a language according to their keyboard layout but in the wrong mode, but for some reason I could never get the API LLM to understand.
     - For example, many Korean social media usernames are like "rlmwlals". This looks like gibberish, but on a standard Qwerty layout with Hangul mode on, it directly maps to "김지민" which is a common name (R and ㄱ share the same key, and so on).
     - Google Translate handles this flawlessly, and Is an issue that multi script typers run into a lot (forgetting to switch to the right language mode).
   - Add language-aware checks and optional user toggles
4) **Better Detection of Typos**
   - I didn't put much distinct effort in suggesting typos like I suggest script mistakes. The LLM understands it anyway,  but I think some pre processing or specific typo detection steps would be helpful for language learners (as it was for me when using Google translate to learn words when learning Korean).
---
```
