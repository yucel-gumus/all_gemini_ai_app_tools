import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { applyPalette, GIFEncoder, quantize } from 'gifenc';
import './MagicGif.css';

const MagicGif: React.FC = () => {
    const [prompt, setPrompt] = useState('a shiba inu eating ice-cream');
    const [frames, setFrames] = useState<string[]>([]);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'frames' | 'output'>('frames');
    const [resultGif, setResultGif] = useState<string | null>(null);

    const generationContainerRef = useRef<HTMLDivElement>(null);
    const promptInputRef = useRef<HTMLInputElement>(null);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        return (
            <div className="text-red-500 text-center">
                API key is not configured. Please set VITE_GEMINI_API_KEY in your .env file.
            </div>
        )
    }
    const ai = new GoogleGenAI({ apiKey });

    const parseError = (error: unknown) => {
        if (typeof error === 'string') {
            const regex = /{"error":(.*)}/gm;
            const m = regex.exec(error);
            if (m && m[1]) {
                try {
                    const e = JSON.parse(m[1]);
                    return e.message;
                } catch (e) {
                    return error;
                }
            }
        } else if (error instanceof Error) {
            return error.message;
        }
        return 'An unknown error occurred.';
    }

    const createGifFromPngs = async (
        imageUrls: string[],
        targetWidth = 1024,
        targetHeight = 1024,
    ) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to create canvas context');
        }
        const gif = GIFEncoder();
        const fps = 4;
        const fpsInterval = 1 / fps;
        const delay = fpsInterval * 1000;

        for (const url of imageUrls) {
            const img = new Image();
            img.src = url;
            await new Promise((resolve) => {
                img.onload = resolve;
            });
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            ctx.fillStyle = '#ffffff';
            ctx.clearRect(0, 0, targetWidth, targetHeight);
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            const data = ctx.getImageData(0, 0, targetWidth, targetHeight).data;
            const format = 'rgb444';
            const palette = quantize(data, 256, { format });
            const index = applyPalette(data, palette, format);
            gif.writeFrame(index, targetWidth, targetHeight, { palette, delay });
        }

        gif.finish();
        const buffer = gif.bytesView();
        const blob = new Blob([buffer], { type: 'image/gif' });
        return URL.createObjectURL(blob);
    }

    const run = async (value: string) => {
        setFrames([]);
        setResultGif(null);
        setActiveTab('frames');
        setStatus('Generating frames...');
        setLoading(true);

        try {
            const expandPromptResponse = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: value,
                config: {
                    temperature: 1,
                    systemInstruction: `**Generate simple, animated doodle GIFs on white from user input, prioritizing key visual identifiers in an animated doodle style with ethical considerations.**
**Core GIF:** Doodle/cartoonish (simple lines, stylized forms, no photorealism), subtle looping motion (primary subject(s) only: wiggle, shimmer, etc.), white background, lighthearted/positive tone (playful, avoids trivializing serious subjects), uses specified colors (unless monochrome/outline requested).
**Input Analysis:** Identify subject (type, specificity), prioritize visual attributes (hair C/T, skin tone neutrally if discernible/needed, clothes C/P, accessories C, facial hair type, other distinct features neutrally for people; breed, fur C/P for animals; key parts, colors for objects), extract text (content, style hints described, display as requested: speech bubble [format: 'Speech bubble says "[Text]" is persistent.'], caption/title [format: 'with the [title/caption] "[Text]" [position]'], or text-as-subject [format: 'the word "[Text]" in [style/color description]']), note style modifiers (e.g., "pencil sketch," "monochrome"), and action (usually "subtle motion"). If the subject or description is too vague, add specific characteristics to make it more unique and detailed.
**Prompt Template:** "[Style Descriptor(s)] [Subject Description with Specificity, Attributes, Colors, Skin Tone if applicable] [Text Component if applicable and NOT speech bubble]. [Speech Bubble Component if applicable]"
**Template Notes:** '[Style Descriptor(s)]' includes "cartoonish" or "doodle style" (especially for people) plus any user-requested modifiers. '[Subject Description...]' combines all relevant subject and attribute details. '[Text Component...]' is for captions, titles, or text-as-subject only. '[Speech Bubble Component...]' is for speech bubbles only (mutually exclusive with Text Component).
**Key Constraints:** No racial labels. Neutral skin tone descriptors when included. Cartoonish/doodle style always implied, especially for people. One text display method only.`,
                },
            });

            const expandedPrompt = `A doodle animation on a white background of ${expandPromptResponse.text}. Subtle motion but nothing else moves.`;
            const style = `Simple, vibrant, varied-colored doodle/hand-drawn sketch`;

            const response = await ai.models.generateContentStream({
                model: 'gemini-2.0-flash-preview-image-generation',
                contents: `Generate at least 10 square, white-background doodle animation frames with smooth, fluid, vibrantly colored motion depicting ${expandedPrompt}.

*Mandatory Requirements (Compacted):**

**Style:** ${style}.
**Background:** Plain solid white (no background colors/elements). Absolutely no black background.
**Content & Motion:** Clearly depict **{{prompt}}** action with colored, moving subject (no static images). If there's an action specified, it should be the main difference between frames.
**Frame Count:** At least 5 frames showing continuous progression and at most 10 frames.
**Format:** Square image (1:1 aspect ratio).
**Cropping:** Absolutely no black bars/letterboxing; colorful doodle fully visible against white.
**Output:** Actual image files for a smooth, colorful doodle-style GIF on a white background. Make sure every frame is different enough from the previous one.`,
                config: {
                    temperature: 1,
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });

            const newImages: string[] = [];
            let frameCount = 0;

            for await (const chunk of response) {
                if (chunk.candidates && chunk.candidates[0].content?.parts) {
                    for (const part of chunk.candidates[0].content.parts) {
                        if (part.inlineData) {
                            frameCount++;
                            setStatus(`Generated frame ${frameCount}`);
                            const src = `data:image/png;base64,${part.inlineData.data}`;
                            newImages.push(src);
                            setFrames(prev => [...prev, src]);
                        }
                    }
                }
            }

            if (frameCount < 2) {
                setStatus('Failed to generate any frames. Try another prompt.');
                setLoading(false);
                return false;
            }

            setStatus('Creating GIF...');
            const gifUrl = await createGifFromPngs(newImages);
            setResultGif(gifUrl);
            setActiveTab('output');
            setTimeout(() => {
                if (generationContainerRef.current) {
                    generationContainerRef.current.scrollIntoView({ behavior: 'smooth' });
                }
            }, 50);

            setStatus('Done!');
            setLoading(false);
            return true;

        } catch (error) {
            const msg = parseError(error);
            console.error('Error generating animation:', error);
            setStatus(`Error generating animation: ${msg}`);
            setLoading(false);
            return false;
        }
    }

    const handleGenerate = async () => {
        if (prompt) {
            const retries = 3;
            for (let i = 0; i < retries; i++) {
                if (await run(prompt)) {
                    console.log('Done.');
                    return;
                } else {
                    console.log(`Retrying...`);
                }
            }
            console.log('Giving up :(');
            setStatus('Failed to generate animation after multiple retries.');
        }
    };

    useEffect(() => {
        if (promptInputRef.current) {
            promptInputRef.current.focus();
            promptInputRef.current.select();
        }
    }, []);

    const handleDownload = () => {
        if (resultGif) {
            const a = document.createElement('a');
            a.href = resultGif;
            a.download = 'magical-animation.gif';
            a.click();
        }
    }

    return (
        <div className="app-container">
            <header>
                <h1>Magical GIF Maker</h1>
                <p>Turn your ideas into fun animated doodles</p>
            </header>

            <div className="input-container">
                <div className="input-field">
                    <i className="fas fa-wand-magic-sparkles input-icon"></i>
                    <input
                        ref={promptInputRef}
                        type="text"
                        id="prompt-input"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleGenerate();
                            }
                        }}
                        placeholder="Describe your animation..."
                    />
                </div>
                <button id="generate-button" className={`generate-button ${loading ? 'loading' : ''}`} onClick={handleGenerate} disabled={loading}>
                    <span>Generate Magic</span>
                    <i className="fas fa-sparkles"></i>
                </button>
            </div>

            <div className="generation-container" ref={generationContainerRef}>
                <div className="tabs">
                    <button className={`tab-button ${activeTab === 'frames' ? 'active' : ''}`} onClick={() => setActiveTab('frames')}>Frames</button>
                    <button className={`tab-button ${activeTab === 'output' ? 'active' : ''}`} onClick={() => setActiveTab('output')}>Output</button>
                </div>

                <div className={`tab-content ${activeTab === 'frames' ? 'active' : ''}`} id="frames-content">
                    <div className="frames-container" id="frames-container">
                        {frames.map((frame, index) => (
                            <div key={index} className="frame appear">
                                <div className="frame-number">{index + 1}</div>
                                <img src={frame} alt={`frame ${index + 1}`} width="1024" height="1024" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`tab-content ${activeTab === 'output' ? 'active' : ''}`} id="output-content">
                    <div className="result-container" id="result-container" style={{ display: activeTab === 'output' ? 'flex' : 'none' }}>
                        {resultGif && (
                             <div className="result-wrapper appear">
                                <img src={resultGif} alt="Generated GIF" className="result-image" />
                                <button className="download-button" onClick={handleDownload}>
                                    <i className="fas fa-download"></i>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="status-container">
                <div className="status-display" id="status-display">{status}</div>
            </div>
        </div>
    );
};

export default MagicGif;
