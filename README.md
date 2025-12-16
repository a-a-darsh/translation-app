# AI Translation App - GT Take Home Assignment

A sophisticated translation web application built with Next.js 15, TypeScript, and TailwindCSS that leverages OpenAI and Anthropic AI models to translate both plain text and JSON data structures.

## 🚀 Features

### Core Functionality
- **Text Translation**: Translate plain text between 20+ languages
- **JSON Translation**: Translate all string values in JSON objects while preserving structure
- **Provider Selection**: Choose between OpenAI GPT-3.5 and Anthropic Claude models
- **Language Support**: 20+ languages including English, Spanish, French, German, Chinese, Japanese, and more

### User Interface
- **Tabbed Interface**: Separate tabs for text and JSON translation
- **Language Selection**: Dropdown menus for source and target languages
- **Swap Languages**: Quick button to swap source and target languages
- **Provider Selection**: Choose your preferred AI translation provider
- **Example JSON**: Load example JSON data for testing
- **Dark Mode**: Automatic system-based dark mode support
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Technical Features
- **Type Safety**: Full TypeScript implementation with strict typing
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Visual feedback during translation operations
- **Input Validation**: JSON validation with helpful error messages
- **Clean Architecture**: Modular code structure with separation of concerns

## 🛠 Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript with strict configuration
- **Styling**: TailwindCSS with custom design system
- **AI Providers**: 
  - OpenAI SDK (GPT-3.5-turbo)
  - Anthropic SDK (Claude-3-haiku)
- **Proxy**: GT Hiring Proxy Service
- **Fonts**: Geist Sans & Mono from Next.js

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Main page component
│   └── globals.css        # Global styles
├── components/            # React components
│   └── TranslationInterface.tsx  # Main translation UI
├── lib/                   # Utility functions and services
│   └── translationService.ts     # Translation API service
├── types/                 # TypeScript type definitions
│   └── translation.ts     # Translation-related types
├── config/               # Configuration files
│   └── languages.ts      # Language and provider configurations
├── public/               # Static assets
├── .env.local           # Environment variables (create this)
├── package.json         # Project dependencies
├── next.config.js       # Next.js configuration
├── tailwind.config.js   # TailwindCSS configuration
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- GT Hiring Proxy authentication token

### Installation

1. **Clone or download the project files**
   ```bash
   # Navigate to the project directory
   cd ai-translation-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   PROXY_TOKEN=your-provided-token-here
   OPENAI_BASE_URL=https://hiring-proxy.gtx.dev/openai
   ANTHROPIC_BASE_URL=https://hiring-proxy.gtx.dev/anthropic
   ```
   
   Replace `your-provided-token-here` with your actual GT Hiring Proxy token.

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open the app**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 Usage Guide

### Text Translation
1. Select the "Text Translation" tab
2. Choose your translation provider (OpenAI or Anthropic)
3. Select source and target languages
4. Enter text in the input field
5. Click "Translate Text" to get the translation
6. View the translated text in the output area

### JSON Translation
1. Select the "JSON Translation" tab
2. Choose your translation provider and languages
3. Enter valid JSON in the input field (or use "Load Example")
4. Click "Translate JSON" to translate all string values
5. View the translated JSON in the output area

### Key Features
- **Language Swapping**: Use the "Swap" button to quickly switch source and target languages
- **Clear All**: Reset all inputs and outputs
- **Example Data**: Load sample JSON for testing
- **Error Messages**: Clear error messages for invalid inputs or API failures
- **Provider Switching**: Compare translations between OpenAI and Anthropic

## 🔧 API Integration

The app uses the GT Hiring Proxy to access AI models:

### OpenAI Integration
- **Model**: GPT-3.5-turbo
- **Endpoint**: https://hiring-proxy.gtx.dev/openai
- **Temperature**: 0.3 (for consistent translations)
- **Max Tokens**: 1000

### Anthropic Integration
- **Model**: Claude-3-haiku-20240307
- **Endpoint**: https://hiring-proxy.gtx.dev/anthropic
- **Temperature**: 0.3 (for consistent translations)
- **Max Tokens**: 1000

### JSON Translation Logic
The app recursively traverses JSON objects:
- **String values**: Translated using the selected AI provider
- **Numbers, booleans, null**: Preserved as-is
- **Arrays**: Each element is processed recursively
- **Objects**: All property values are processed recursively
- **Keys**: Never translated (preserves structure)

## 🎨 Design Decisions

### Color Palette
- **Primary**: Blue (#3b82f6) for actions and highlights
- **Background**: Light gray (#fafafa) for light mode, dark (#0a0a0a) for dark mode
- **Text**: High contrast for accessibility
- **Borders**: Subtle gray tones for visual separation

### Typography
- **Primary Font**: Geist Sans (modern, readable)
- **Code Font**: Geist Mono (for JSON display)
- **Sizes**: Responsive scaling for different screen sizes

### User Experience
- **Tabbed Interface**: Clear separation between text and JSON translation
- **Loading States**: Visual feedback during API calls
- **Error Handling**: User-friendly error messages
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Automatic system preference detection

## 🧪 Testing

### Manual Testing Checklist
- [ ] Text translation with different language pairs
- [ ] JSON translation with nested structures
- [ ] Provider switching functionality
- [ ] Language swapping feature
- [ ] Error handling for invalid JSON
- [ ] Loading states during API calls
- [ ] Responsive design on mobile devices
- [ ] Dark mode toggle functionality

### Example Test Cases
```json
// Simple JSON
{
  "greeting": "Hello, world!",
  "question": "How are you?"
}

// Nested JSON
{
  "user": {
    "name": "John Doe",
    "bio": "Software developer",
    "interests": ["coding", "music", "travel"]
  },
  "messages": [
    {"text": "Hello there!"},
    {"text": "How's your day?"}
  ]
}
```

## 🚀 Deployment

### Vercel Deployment (Recommended)
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Environment Variables for Deployment
Make sure to set these in your deployment platform:
- `PROXY_TOKEN`: Your GT Hiring Proxy token
- `OPENAI_BASE_URL`: https://hiring-proxy.gtx.dev/openai
- `ANTHROPIC_BASE_URL`: https://hiring-proxy.gtx.dev/anthropic

## 🤝 Code Quality

### TypeScript Best Practices
- Strict typing throughout the application
- No `any` types used
- Proper interface definitions for all data structures
- Type guards for API responses

### React Best Practices
- Functional components with hooks
- Proper state management
- Memoization where beneficial
- Clean component separation

### Code Organization
- **Separation of Concerns**: Business logic separated from UI
- **Modular Architecture**: Reusable components and utilities
- **Type Safety**: Comprehensive TypeScript definitions
- **Error Handling**: Centralized error handling with user feedback

## 📝 Assumptions & Decisions

1. **Client-Side API Calls**: Using `dangerouslyAllowBrowser: true` for direct API access
2. **Translation Quality**: Lower temperature (0.3) for more consistent translations
3. **JSON Structure**: Keys are never translated to preserve data structure
4. **Error Messages**: User-friendly messages instead of technical details
5. **Responsive Design**: Mobile-first approach with TailwindCSS
6. **Dark Mode**: System preference-based automatic switching

## 🔮 Future Improvements

### Enhanced Features
- **Translation History**: Save and view previous translations
- **Batch Translation**: Translate multiple texts at once
- **File Upload**: Support for uploading JSON files
- **Language Detection**: Auto-detect source language
- **Translation Memory**: Cache common translations
- **Export Options**: Save translations to file

### Technical Enhancements
- **Rate Limiting**: Handle API rate limits gracefully
- **Retry Logic**: Automatic retry for failed requests
- **Performance Optimization**: Implement caching strategies
- **Testing Suite**: Add comprehensive unit and integration tests
- **CI/CD Pipeline**: Automated testing and deployment
- **Monitoring**: Add error tracking and performance monitoring

### UI/UX Improvements
- **Keyboard Shortcuts**: Quick actions with keyboard
- **Drag & Drop**: JSON file drag and drop support
- **Split View**: Compare translations side by side
- **Custom Themes**: User-selectable color schemes
- **Accessibility**: Enhanced screen reader support

## 🆘 Troubleshooting

### Common Issues

1. **API Token Issues**
   - Ensure `PROXY_TOKEN` is set correctly in `.env.local`
   - Check that the token has proper permissions

2. **JSON Validation Errors**
   - Verify JSON syntax is correct
   - Use the "Load Example" button to see valid format

3. **Translation API Errors**
   - Check network connectivity
   - Verify proxy endpoints are accessible
   - Review browser console for detailed error messages

4. **Build Errors**
   - Run `npm run build` to check for TypeScript errors
   - Ensure all dependencies are installed
   - Check for missing environment variables

### Debug Mode
Enable debug logging by setting:
```javascript
// In translationService.ts
console.log('API Request:', request);
console.log('API Response:', response);
```

## 📄 License

This project is created for the GT Take Home Assignment.

---

**Built with ❤️ using Next.js, TypeScript, and AI models**