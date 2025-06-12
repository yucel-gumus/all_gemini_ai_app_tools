import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { marked } from 'marked';
import './DictationApp.css';

// Assuming Font Awesome is loaded globally in your project
const DictationApp: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [rawTranscription, setRawTranscription] = useState('');
    const [polishedNote, setPolishedNote] = useState('');
    const [noteTitle, setNoteTitle] = useState('Untitled Note');
    const [status, setStatus] = useState('Ready to record');
    const [activeTab, setActiveTab] = useState<'note' | 'raw'>('note');
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [timer, setTimer] = useState('00:00.00');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserNodeRef = useRef<AnalyserNode | null>(null);
    const waveformDataArrayRef = useRef<Uint8Array | null>(null);
    const waveformDrawingIdRef = useRef<number | null>(null);
    const timerIntervalIdRef = useRef<number | null>(null);
    const recordingStartTimeRef = useRef<number>(0);

    const polishedNoteRef = useRef<HTMLDivElement>(null);
    const rawTranscriptionRef = useRef<HTMLDivElement>(null);
    const editorTitleRef = useRef<HTMLDivElement>(null);
    const liveWaveformCanvasRef = useRef<HTMLCanvasElement>(null);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const genAI = useRef(new GoogleGenAI({ apiKey: apiKey || '' }));

    const setupCanvasDimensions = useCallback(() => {
        if (!liveWaveformCanvasRef.current) return;
        const canvas = liveWaveformCanvasRef.current;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx?.scale(dpr, dpr);
    }, []);

    useEffect(() => {
        document.body.className = theme === 'light' ? 'light-mode' : '';
        localStorage.setItem('theme', theme);
    }, [theme]);
    
    useEffect(() => {
        setupCanvasDimensions();
        window.addEventListener('resize', setupCanvasDimensions);
        return () => window.removeEventListener('resize', setupCanvasDimensions);
    }, [setupCanvasDimensions]);

    if (!apiKey) {
        return <div className="text-red-500 text-center p-8">API key is not configured. Please set VITE_GEMINI_API_KEY in your .env file.</div>;
    }

    const createNewNote = () => {
        setRawTranscription('');
        setPolishedNote('');
        setNoteTitle('Untitled Note');
        setStatus('Ready to record');
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        }
    };

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    const processAudio = async (audioBlob: Blob) => {
        if (audioBlob.size === 0) {
            setStatus('No audio data captured.');
            return;
        }
        setStatus('Converting audio...');
        const base64Audio = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
        });

        if (!base64Audio) {
            setStatus('Failed to convert audio.');
            return;
        }

        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        await getTranscription(base64Audio, mimeType);
    };

    const getTranscription = async (base64Audio: string, mimeType: string) => {
        try {
            setStatus('Getting transcription...');
            const contents = [
                {text: 'Generate a complete, detailed transcript of this audio.'},
                {inlineData: {mimeType: mimeType, data: base64Audio}},
            ];

            const response = await genAI.current.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: contents,
            });

            const transcription = response.text || '';
            setRawTranscription(transcription);
            setStatus('Transcription complete. Polishing note...');
            await getPolishedNote(transcription);
        } catch (error) {
            console.error("Error getting transcription:", error);
            setStatus('Error getting transcription.');
        }
    };
    
    const getPolishedNote = async (transcription: string) => {
        if (!transcription.trim()) {
            setStatus('No transcription to polish.');
            return;
        }
        try {
            setStatus('Polishing note...');
            const prompt = `Take this raw transcription and create a polished, well-formatted note.
                    Remove filler words (um, uh, like), repetitions, and false starts.
                    Format any lists or bullet points properly. Use markdown formatting for headings, lists, etc.
                    Maintain all the original content and meaning.
                    Raw transcription:
                    ${transcription}`;
            
            const response = await genAI.current.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [{text: prompt}],
            });
            const polished = response.text || '';
            
            setPolishedNote(marked.parse(polished) as string);
            
            const titleMatch = polished.match(/^#\s+(.*)/);
            if (titleMatch && titleMatch[1]) {
                setNoteTitle(titleMatch[1]);
            } else {
                 const firstLine = polished.split('\n')[0];
                 setNoteTitle(firstLine.substring(0, 50));
            }
            setStatus('Note polished. Ready for next recording.');

        } catch (error) {
            console.error("Error polishing note:", error);
            setStatus('Error polishing note.');
        }
    };

    const drawLiveWaveform = useCallback(() => {
        if (!isRecording || !analyserNodeRef.current || !waveformDataArrayRef.current || !liveWaveformCanvasRef.current) {
             if (waveformDrawingIdRef.current) cancelAnimationFrame(waveformDrawingIdRef.current);
             return;
        }
    
        waveformDrawingIdRef.current = requestAnimationFrame(drawLiveWaveform);
        analyserNodeRef.current.getByteFrequencyData(waveformDataArrayRef.current);
    
        const canvas = liveWaveformCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
    
        const { width, height } = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, width, height);
    
        const bufferLength = analyserNodeRef.current.frequencyBinCount;
        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;
        
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-recording').trim() || '#ff3b30';

        for (let i = 0; i < bufferLength; i++) {
            const barHeight = waveformDataArrayRef.current[i];
            ctx.fillRect(x, height - barHeight / 2, barWidth, barHeight / 2);
            x += barWidth + 1;
        }
    }, [isRecording]);

    const startRecording = async () => {
        try {
            setStatus('Requesting microphone...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserNodeRef.current = audioContextRef.current.createAnalyser();
            analyserNodeRef.current.fftSize = 256;
            const bufferLength = analyserNodeRef.current.frequencyBinCount;
            waveformDataArrayRef.current = new Uint8Array(bufferLength);
            source.connect(analyserNodeRef.current);

            audioChunksRef.current = [];
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = event => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                processAudio(audioBlob);
                stream.getTracks().forEach(track => track.stop());
                audioContextRef.current?.close();
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
            setStatus('Recording...');

            recordingStartTimeRef.current = Date.now();
            timerIntervalIdRef.current = window.setInterval(() => {
                 const elapsedMs = Date.now() - recordingStartTimeRef.current;
                 const totalSeconds = Math.floor(elapsedMs / 1000);
                 const minutes = Math.floor(totalSeconds / 60);
                 const seconds = totalSeconds % 60;
                 const hundredths = Math.floor((elapsedMs % 1000) / 10);
                 setTimer(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`);
            }, 50);

            drawLiveWaveform();
        } catch (error) {
            console.error('Error starting recording:', error);
            setStatus('Microphone access denied.');
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
        setStatus('Processing audio...');
        if (timerIntervalIdRef.current) clearInterval(timerIntervalIdRef.current);
        if (waveformDrawingIdRef.current) cancelAnimationFrame(waveformDrawingIdRef.current);
    };

    const toggleRecording = () => {
        if (isRecording) stopRecording();
        else startRecording();
    };

    return (
        <div className={`dictation-app-container ${theme}-mode`}>
            <div className="main-content">
                <div className="note-area">
                    <div className="note-header">
                        <div ref={editorTitleRef} className="editor-title" contentEditable={!isRecording} onBlur={e => setNoteTitle(e.currentTarget.textContent || 'Untitled Note')} suppressContentEditableWarning>
                            {noteTitle}
                        </div>
                        <div className="tab-navigation-container">
                             <div className="tab-navigation">
                                <button className={`tab-button ${activeTab === 'note' ? 'active' : ''}`} onClick={() => setActiveTab('note')}>Polished</button>
                                <button className={`tab-button ${activeTab === 'raw' ? 'active' : ''}`} onClick={() => setActiveTab('raw')}>Raw</button>
                             </div>
                        </div>
                    </div>
                    <div className="note-content-wrapper">
                        <div
                            id="polishedNote"
                            ref={polishedNoteRef}
                            className={`note-content ${activeTab === 'note' ? 'active' : ''}`}
                            dangerouslySetInnerHTML={{ __html: polishedNote || '<p>Your polished notes will appear here...</p>' }}
                        ></div>
                        <div
                            id="rawTranscription"
                            ref={rawTranscriptionRef}
                            className={`note-content ${activeTab === 'raw' ? 'active' : ''}`}
                        >
                            {rawTranscription || 'Raw transcription will appear here...'}
                        </div>
                    </div>
                </div>
                <div className={`recording-interface ${isRecording ? 'is-live' : ''}`}>
                     {isRecording ? (
                        <>
                           <div className="live-recording-title">{noteTitle}</div>
                           <canvas ref={liveWaveformCanvasRef}></canvas>
                           <div className="live-recording-timer">{timer}</div>
                        </>
                    ) : (
                         <div className="status-indicator">
                            <span className="status-text">{status}</span>
                        </div>
                    )}
                    <div className="recording-controls">
                         <button className="action-button" onClick={toggleTheme} title="Toggle Theme">
                            <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
                        </button>
                        <button onClick={toggleRecording} className={`record-button ${isRecording ? 'recording' : ''}`} title={isRecording ? 'Stop Recording' : 'Start Recording'}>
                            <div className="record-button-inner">
                                <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
                            </div>
                            <svg className="record-waves" viewBox="0 0 200 200">
                                <circle className="wave wave1" cx="100" cy="100" r="40" />
                                <circle className="wave wave2" cx="100" cy="100" r="70" />
                                <circle className="wave wave3" cx="100" cy="100" r="100" />
                            </svg>
                            <span className="record-text">{isRecording ? 'Stop' : 'Record'}</span>
                        </button>
                        <button className="action-button" onClick={createNewNote} title="New Note / Clear">
                            <i className="fas fa-file"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DictationApp; 