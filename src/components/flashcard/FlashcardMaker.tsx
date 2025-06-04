import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Send, Loader2 } from 'lucide-react';

interface Flashcard {
  term: string;
  definition: string;
}

const FlashcardMaker: React.FC = () => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const topicInputRef = useRef<HTMLTextAreaElement>(null);

  const generateFlashcards = async () => {
    const topic = topicInputRef.current?.value.trim();
    
    if (!topic) {
      setError('Please enter a topic or some terms and definitions.');
      setFlashcards([]);
      return;
    }

    setError('Generating flashcards...');
    setFlashcards([]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Generate a list of flashcards for the topic of "${topic}". Each flashcard should have a term and a concise definition. Format the output as a list of "Term: Definition" pairs, with each pair on a new line. Ensure terms and definitions are distinct and clearly separated by a single colon. Here's an example output:
      Hello: Hola
      Goodbye: Adiós`;

      const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
      });

      const responseText = result?.text ?? '';

      if (responseText) {
        const newFlashcards: Flashcard[] = responseText
          .split('\n')
          .map((line) => {
            const parts = line.split(':');
            if (parts.length >= 2 && parts[0].trim()) {
              const term = parts[0].trim();
              const definition = parts.slice(1).join(':').trim();
              if (definition) {
                return { term, definition };
              }
            }
            return null;
          })
          .filter((card): card is Flashcard => card !== null)
          .slice(0, 10); // Limit to 10 cards

        if (newFlashcards.length > 0) {
          setError('');
          setFlashcards(newFlashcards);
        } else {
          setError('No valid flashcards could be generated from the response. Please check the format.');
        }
      } else {
        setError('Failed to generate flashcards or received an empty response. Please try again.');
      }
    } catch (error: unknown) {
      console.error('Error generating content:', error);
      const detailedError = (error as Error)?.message || 'An unknown error occurred';
      setError(`An error occurred: ${detailedError}`);
      setFlashcards([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Flashcard Maker</h1>
        <p className="text-gray-600 mb-6">
          Enter a topic and let AI generate flashcards to help you learn and memorize information.
        </p>

        <div className="space-y-4">
          <textarea
            ref={topicInputRef}
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            placeholder="Enter a topic (e.g., 'Spanish Vocabulary', 'Chemistry Terms', 'History Dates')..."
            rows={3}
          />

          <button
            onClick={generateFlashcards}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg
              hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed
              flex items-center justify-center gap-2 font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Send size={20} />
                <span>Generate Flashcards</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {flashcards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flashcards.map((flashcard, index) => (
            <div
              key={index}
              className="group h-48 [perspective:1000px]"
            >
              <div className="relative w-full h-full transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                {/* Front of card */}
                <div className="absolute inset-0 bg-white rounded-xl shadow-lg p-6 border border-gray-100 [backface-visibility:hidden]">
                  <div className="flex flex-col h-full">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Term</h3>
                    <p className="text-gray-700 flex-grow">{flashcard.term}</p>
                  </div>
                </div>
                {/* Back of card */}
                <div className="absolute inset-0 bg-purple-50 rounded-xl shadow-lg p-6 border border-purple-100 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <div className="flex flex-col h-full">
                    <h3 className="text-lg font-semibold text-purple-900 mb-2">Definition</h3>
                    <p className="text-purple-700 flex-grow">{flashcard.definition}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlashcardMaker;
