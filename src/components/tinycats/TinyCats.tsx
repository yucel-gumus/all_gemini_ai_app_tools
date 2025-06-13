import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { marked } from 'marked';
import './TinyCats.css';

const TinyCats: React.FC = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [slides, setSlides] = useState<Array<{ text: string; imageUrl: string }>>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const examples = [
    'Explain how neural networks work.',
    'Explain how The Matrix works.',
    'Explain how spaghettification works.',
  ];

  const additionalInstructions = `
Use a fun story about lots of tiny cats as a metaphor.
Keep sentences short but conversational, casual, and engaging.
Generate a cute, minimal illustration for each sentence with black ink on white background.
No commentary, just begin your explanation.
Keep going until you're done.`;

  const parseError = (errorMessage: string): string => {
    const regex = /{"error":(.*)}/gm;
    const match = regex.exec(errorMessage);
    try {
      if (match && match[1]) {
        const errorObj = JSON.parse(match[1]);
        return errorObj.message;
      }
      return errorMessage;
    } catch (e) {
      return errorMessage;
    }
  };

  const generateExplanation = async (message: string) => {
    setIsLoading(true);
    setError('');
    setSlides([]);
    setInput('');

    try {
      // API anahtarını environment variable'dan al
      const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
      if (!apiKey) {
        throw new Error('Google AI API key not found. Please set VITE_GOOGLE_AI_API_KEY in your environment variables.');
      }

      const ai = new GoogleGenAI({ apiKey });
      const chat = ai.chats.create({
        model: 'gemini-2.0-flash-preview-image-generation',
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
        history: [],
      });

      const result = await chat.sendMessageStream({
        message: message + additionalInstructions,
      });

      let currentText = '';
      let currentImage: string | null = null;
      const newSlides: Array<{ text: string; imageUrl: string }> = [];

      for await (const chunk of result) {
        for (const candidate of chunk.candidates ?? []) {
          for (const part of candidate.content?.parts ?? []) {
            if (part.text) {
              currentText += part.text;
            } else if (part.inlineData) {
              currentImage = `data:image/png;base64,${part.inlineData.data}`;
            }

            if (currentText && currentImage) {
              newSlides.push({
                text: currentText,
                imageUrl: currentImage,
              });
              setSlides([...newSlides]);
              currentText = '';
              currentImage = null;
            }
          }
        }
      }

      if (currentImage) {
        newSlides.push({
          text: currentText,
          imageUrl: currentImage,
        });
        setSlides([...newSlides]);
      }
    } catch (err: any) {
      const errorMessage = parseError(err.message || err.toString());
      setError(`Something went wrong: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        generateExplanation(input);
      }
    }
  };

  const handleExampleClick = (example: string) => {
    if (!isLoading) {
      generateExplanation(example);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <div className="tinycats-container">
      <h1>Explain Things with Lots of Tiny Cats</h1>
      
      <p>Examples:</p>
      <ul className="tinycats-examples">
        {examples.map((example, index) => (
          <li key={index} onClick={() => handleExampleClick(example)}>
            {example}
          </li>
        ))}
      </ul>
      
      <p>or enter your own prompt:</p>
      <textarea
        ref={textareaRef}
        className="tinycats-input"
        placeholder="Enter some prompt and press Enter."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
      />
      
      {error && (
        <div className="tinycats-error">
          {error}
        </div>
      )}
      
      {slides.length > 0 && (
        <div className="tinycats-slideshow">
          {slides.map((slide, index) => (
            <div key={index} className="tinycats-slide">
              <img src={slide.imageUrl} alt={`Slide ${index + 1}`} />
              <div dangerouslySetInnerHTML={{ __html: marked.parse(slide.text) }} />
            </div>
          ))}
        </div>
      )}
      
      {isLoading && (
        <div className="tinycats-loading">
          <p>Generating explanation with tiny cats... 🐱</p>
        </div>
      )}
    </div>
  );
};

export default TinyCats; 