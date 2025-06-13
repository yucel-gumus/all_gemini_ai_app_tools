import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Content, Modality } from '@google/genai';
import { LoaderCircle, SendHorizontal, Trash2, X } from 'lucide-react';
import './CoDrawing.css';

const parseError = (error: string): string => {
  const regex = /{"error":(.*)}/gm;
  const match = regex.exec(error);
  try {
    if (match && match[1]) {
      const errorObj = JSON.parse(match[1]);
      return errorObj.message || error;
    }
    return error;
  } catch (e) {
    return error;
  }
};

const CoDrawing: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#000000');
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load background image when generatedImage changes
  useEffect(() => {
    if (generatedImage && canvasRef.current) {
      const img = new window.Image();
      img.onload = () => {
        backgroundImageRef.current = img;
        drawImageToCanvas();
      };
      img.src = generatedImage;
    }
  }, [generatedImage]);

  // Initialize canvas with white background when component mounts
  useEffect(() => {
    if (canvasRef.current) {
      initializeCanvas();
    }
  }, []);

  // Initialize canvas with white background
  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill canvas with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Draw the background image to the canvas
  const drawImageToCanvas = () => {
    if (!canvasRef.current || !backgroundImageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill with white background first
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the background image
    ctx.drawImage(
      backgroundImageRef.current,
      0,
      0,
      canvas.width,
      canvas.height,
    );
  };

  // Get the correct coordinates based on canvas scaling
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();

    // Calculate the scaling factor between the internal canvas size and displayed size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;

    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0]?.clientX || 0;
      clientY = e.touches[0]?.clientY || 0;
    } else {
      // Mouse event
      clientX = e.nativeEvent.offsetX;
      clientY = e.nativeEvent.offsetY;
    }

    // Apply the scaling to get accurate coordinates
    return {
      x: (clientX - (('touches' in e) ? rect.left : 0)) * scaleX,
      y: (clientY - (('touches' in e) ? rect.top : 0)) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { x, y } = getCoordinates(e);

    // Prevent default behavior to avoid scrolling on touch devices
    if ('touches' in e) {
      e.preventDefault();
    }

    // Start a new path without clearing the canvas
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    // Prevent default behavior to avoid scrolling on touch devices
    if ('touches' in e) {
      e.preventDefault();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { x, y } = getCoordinates(e);

    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill with white instead of just clearing
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setGeneratedImage(null);
    backgroundImageRef.current = null;
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPenColor(e.target.value);
  };

  const openColorPicker = () => {
    if (colorInputRef.current) {
      colorInputRef.current.click();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      openColorPicker();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canvasRef.current) return;

    setIsLoading(true);

    try {
      // API anahtarını environment variable'dan al
      const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
      if (!apiKey) {
        throw new Error('Google AI API key not found. Please set VITE_GOOGLE_AI_API_KEY in your environment variables.');
      }

      const ai = new GoogleGenAI({ apiKey });

      // Get the drawing as base64 data
      const canvas = canvasRef.current;

      // Create a temporary canvas to add white background
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      // Fill with white background
      tempCtx.fillStyle = '#FFFFFF';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      // Draw the original canvas content on top of the white background
      tempCtx.drawImage(canvas, 0, 0);

      const drawingData = tempCanvas.toDataURL('image/png').split(',')[1];

      let contents: Content[] = [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ];

      if (drawingData) {
        contents = [
          {
            role: 'user',
            parts: [{ inlineData: { data: drawingData, mimeType: 'image/png' } }],
          },
          {
            role: 'user',
            parts: [
              {
                text: `${prompt}. Keep the same minimal line doodle style.`,
              },
            ],
          },
        ];
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-preview-image-generation',
        contents,
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error('No response received from AI');
      }

      const parts = candidates[0].content?.parts;
      if (!parts) {
        throw new Error('No content parts in response');
      }

      let imageData: string | null = null;
      let textResponse = '';

      for (const part of parts) {
        if (part.text) {
          textResponse = part.text;
          console.log('Received text response:', part.text);
                 } else if (part.inlineData?.data) {
           imageData = part.inlineData.data;
           console.log('Received image data, length:', imageData.length);
        }
      }

      if (imageData) {
        const imageUrl = `data:image/png;base64,${imageData}`;
        setGeneratedImage(imageUrl);
      } else {
        console.error('No image data received');
        setErrorMessage('No image was generated. Please try again.');
        setShowErrorModal(true);
      }
    } catch (error: any) {
      console.error('Error submitting drawing:', error);
      setErrorMessage(error.message || 'An unexpected error occurred.');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Close the error modal
  const closeErrorModal = () => {
    setShowErrorModal(false);
  };

  // Add touch event prevention function
  useEffect(() => {
    // Function to prevent default touch behavior on canvas
    const preventTouchDefault = (e: TouchEvent) => {
      if (isDrawing) {
        e.preventDefault();
      }
    };

    // Add event listener when component mounts
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('touchstart', preventTouchDefault, {
        passive: false,
      });
      canvas.addEventListener('touchmove', preventTouchDefault, {
        passive: false,
      });
    }

    // Remove event listener when component unmounts
    return () => {
      if (canvas) {
        canvas.removeEventListener('touchstart', preventTouchDefault);
        canvas.removeEventListener('touchmove', preventTouchDefault);
      }
    };
  }, [isDrawing]);

  return (
    <div className="codrawing-container">
      <main className="codrawing-main">
        {/* Header section with title and tools */}
        <div className="codrawing-header">
          <div>
            <h1 className="codrawing-title">
              Gemini Co-Drawing
            </h1>
            <p className="codrawing-subtitle">
              Built with{' '}
              <a
                className="codrawing-link"
                href="https://ai.google.dev/gemini-api/docs/image-generation"
                target="_blank"
                rel="noopener noreferrer">
                Gemini 2.0 native image generation
              </a>
            </p>
          </div>

          <menu className="codrawing-toolbar">
            <button
              type="button"
              className="codrawing-color-button"
              onClick={openColorPicker}
              onKeyDown={handleKeyDown}
              aria-label="Open color picker"
              style={{ backgroundColor: penColor }}>
              <input
                ref={colorInputRef}
                type="color"
                value={penColor}
                onChange={handleColorChange}
                className="codrawing-color-input"
                aria-label="Select pen color"
              />
            </button>
            <button
              type="button"
              onClick={clearCanvas}
              className="codrawing-clear-button">
              <Trash2
                className="w-5 h-5 text-gray-700"
                aria-label="Clear Canvas"
              />
            </button>
          </menu>
        </div>

        {/* Canvas section */}
        <div className="codrawing-canvas-container">
          <canvas
            ref={canvasRef}
            width={960}
            height={540}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="codrawing-canvas"
          />
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="codrawing-form">
          <div className="codrawing-input-container">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Add your change..."
              className="codrawing-input"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="codrawing-submit-button">
              {isLoading ? (
                <LoaderCircle
                  className="w-5 sm:w-6 h-5 sm:h-6 animate-spin"
                  aria-label="Loading"
                />
              ) : (
                <SendHorizontal
                  className="w-5 sm:w-6 h-5 sm:h-6"
                  aria-label="Submit"
                />
              )}
            </button>
          </div>
        </form>
      </main>

      {/* Error Modal */}
      {showErrorModal && (
        <div className="codrawing-modal-overlay">
          <div className="codrawing-modal">
            <div className="codrawing-modal-header">
              <h3 className="codrawing-modal-title">
                Failed to generate
              </h3>
              <button
                onClick={closeErrorModal}
                className="codrawing-modal-close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="codrawing-modal-content">
              {parseError(errorMessage)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoDrawing; 