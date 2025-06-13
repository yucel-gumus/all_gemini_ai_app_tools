# AI Tools - React Application

A modern web application that provides AI-powered tools for learning and development. Built with React, TypeScript, and Vite.

## Features

### Flashcard Maker
- Generate flashcards from any topic using AI
- Interactive 3D flip animation
- Responsive design for all devices
- Maximum 10 cards per generation
- Clean and modern UI

### Image to Code
- Convert images to interactive p5.js sketches
- Multiple code generation options
- Real-time preview
- Sample images available
- Advanced settings for customization

### Magic GIF Maker
- Create animated GIFs from text descriptions
- AI-powered image generation
- Customizable animation settings
- Download generated GIFs

### Dictation App
- Voice-to-text transcription
- AI-powered text enhancement
- Real-time recording
- Export transcribed notes

### Tiny Cats Explainer
- Explain complex topics using fun cat metaphors
- AI-generated illustrations for each explanation
- Interactive slideshow format
- Educational and entertaining content

### Co-Drawing
- Collaborative drawing with AI assistance
- Real-time canvas drawing interface
- AI-enhanced artwork generation
- Touch and mouse support
- Color picker and drawing tools

### Maps Explorer
- AI-powered travel recommendations
- Interactive world map with Leaflet
- Discover unique and fascinating places
- Turkish language travel guide
- Preset categories for exploration

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Google Gemini AI API
- Lucide Icons
- Leaflet (for interactive maps)

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd my-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory and add your API keys:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

Note: 
- Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- The Google AI API key is specifically needed for the Tiny Cats Explainer feature

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
my-app/
├── src/
│   ├── components/
│   │   ├── flashcard/
│   │   │   └── FlashcardMaker.tsx
│   │   ├── imagetocode/
│   │   │   ├── ImageToCode.tsx
│   │   │   ├── CodePreview.tsx
│   │   │   └── ErrorModal.tsx
│   │   ├── magicgif/
│   │   │   └── magicGif.tsx
│   │   ├── dictation/
│   │   │   └── DictationApp.tsx
│   │   ├── tinycats/
│   │   │   ├── TinyCats.tsx
│   │   │   └── TinyCats.css
│   │   ├── codrawing/
│   │   │   ├── CoDrawing.tsx
│   │   │   └── CoDrawing.css
│   │   ├── mapsexplorer/
│   │   │   ├── MapsExplorer.tsx
│   │   │   └── MapsExplorer.css
│   │   └── Navbar.tsx
│   ├── App.tsx
│   └── main.tsx
├── public/
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
