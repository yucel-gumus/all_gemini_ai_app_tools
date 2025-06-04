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

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Google Gemini AI API
- Lucide Icons

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

3. Create a `.env.local` file in the root directory and add your Google Gemini API key:
```env
VITE_GEMINI_API_KEY=your_api_key_here
```

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
