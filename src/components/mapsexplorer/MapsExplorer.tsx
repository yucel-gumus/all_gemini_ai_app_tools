import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapsExplorer.css';

// Fix for default markers in Leaflet with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const systemInstructions = `Dünya hakkında derin bir ilgiye sahip, yardımsever bir seyahat rehberi gibi davran. Görevin, konuşmayla ilgili bir yeri haritada önermek ve seçilen yer hakkında ilginç bilgiler vermek. Şaşırtıcı ve keyifli öneriler sunmayı hedefle: bilindik yerler yerine, az bilinen, sıra dışı yerleri seç. Zararlı veya güvenli olmayan sorulara cevap verme.

Önce, bir yerin neden ilginç olduğunu iki cümleyle açıkla. Sonra, uygunsa, kullanıcıya o yeri haritada göstermek için 'recommendPlace( location, caption )' fonksiyonunu çağır. Kullanıcı daha fazla bilgi isterse cevabını genişletebilirsin.`;

const presets = [
  ['❄️ Soğuk', 'Gerçekten soğuk olan bir yer nerede?'],
  ['🗿 Antik', 'Zengin antik tarihe sahip bir yer öner'],
  ['🗽 Metropol', 'İlginç büyük bir şehir göster'],
  [
    '🌿 Doğa',
    'Güzel doğası ve yeşilliği olan bir yere götür beni. Neden özel?',
  ],
  [
    '🏔️ Uzak',
    'Dünyadan uzaklaşmak istesem, dünyanın en uzak yerlerinden biri neresi? Oraya nasıl gidilir?',
  ],
  [
    '🌌 Sıradışı',
    'Tamamen gerçeküstü bir yer düşün, neresi? Ne onu bu kadar sıradışı yapıyor?',
  ],
];

const recommendPlaceFunctionDeclaration: FunctionDeclaration = {
  name: 'recommendPlace',
  parameters: {
    type: Type.OBJECT,
    description: 'Shows the user a map of the place provided.',
    properties: {
      location: {
        type: Type.STRING,
        description: 'Give a specific place, including country name.',
      },
      caption: {
        type: Type.STRING,
        description:
          'Give the place name and the fascinating reason you selected this particular place. Keep the caption to one or two sentences maximum',
      },
    },
    required: ['location', 'caption'],
  },
};

const MapsExplorer: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentMarkerRef = useRef<L.Marker | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([20, 0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap katkıda bulunanlar'
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const renderMap = (location: string) => {
    // Don't make API calls for invalid locations
    if (!location || location === '%' || location.trim() === '') {
      return;
    }

    if (!mapInstanceRef.current) return;

    // Add delay between requests to avoid rate limiting
    setTimeout(() => {
      // Use OpenStreetMap Nominatim service to geocode the location
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`, {
        headers: {
          'User-Agent': 'MapExplorer/1.0'
        }
      })
        .then(response => response.json())
        .then(data => {
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            mapInstanceRef.current?.setView([lat, lon], 13);
            
            // Remove existing marker if any
            if (currentMarkerRef.current) {
              currentMarkerRef.current.remove();
            }
            
            // Add new marker
            if (mapInstanceRef.current) {
              currentMarkerRef.current = L.marker([lat, lon]).addTo(mapInstanceRef.current);
            }
          }
        })
        .catch(error => console.error('Konum bulunamadı:', error));
    }, 1000);
  };

  const generateContent = async (prompt: string) => {
    setIsLoading(true);
    setCaption('');

    try {
      // API anahtarını environment variable'dan al
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment variables.');
      }

      const ai = new GoogleGenAI({ vertexai: false, apiKey });

      const response = await ai.models.generateContentStream({
        model: 'gemini-2.0-flash-exp',
        contents: `${systemInstructions} ${prompt}`,
        config: {
          temperature: 2, // High temperature for answer variety
          tools: [{ functionDeclarations: [recommendPlaceFunctionDeclaration] }],
        },
      });

      for await (const chunk of response) {
        const fns = chunk.functionCalls ?? [];
        for (const fn of fns) {
          if (fn.name === 'recommendPlace' && fn.args) {
            const location = fn.args.location as string;
            const captionText = fn.args.caption as string;
            renderMap(location);
            setCaption(captionText);
          }
        }
      }
    } catch (error: any) {
      console.error('Bir hata oluştu:', error);
      setCaption('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetClick = async (preset: string[]) => {
    await generateContent(preset[1]);
  };

  return (
    <div className="maps-explorer-container">
      <div className="maps-explorer-presets-container">
        <span className="maps-explorer-take-me-somewhere">
          {isLoading ? 'Harika bir yer arıyorum...' : 'Beni bir yerlere götür...'}
        </span>
        <div className="maps-explorer-presets">
          {presets.map((preset, index) => (
            <button
              key={index}
              onClick={() => handlePresetClick(preset)}
              disabled={isLoading}
              className="maps-explorer-preset-button"
            >
              {preset[0]}
            </button>
          ))}
        </div>
      </div>
      
      <div className="maps-explorer-map-container">
        <div ref={mapRef} className="maps-explorer-map" />
      </div>
      
      {caption && (
        <div className="maps-explorer-caption">
          {caption}
        </div>
      )}
    </div>
  );
};

export default MapsExplorer; 