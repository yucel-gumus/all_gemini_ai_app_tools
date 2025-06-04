import React from 'react';
import { Copy, Check } from 'lucide-react';

interface CodePreviewProps {
  output: {
    id: number;
    code: string;
  };
  onCodeChange: (id: number, newCode: string) => void;
  fullResponse: string;
}

const CodePreview: React.FC<CodePreviewProps> = ({ output, onCodeChange, fullResponse }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(output.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderSketch = (code: string) => {
    const formattedCodeResponse = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=512, initial-scale=1.0">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"></script>
        <title>p5.js Sketch</title>
        <style> body {padding: 0; margin: 0;} </style>
      </head>
      <body>
      <script>
        window.onerror = function(message, source, lineno, colno, error) {
          document.body.innerHTML += '<h3>🔴Error:</h3><pre>' + message + '</pre>';
        };
        ${code}
      </script>
      </body>
      </html>
    `;

    return (
      <iframe
        srcDoc={formattedCodeResponse}
        title="p5.js Sketch"
        width="100%"
        height="300"
        style={{ border: 'none' }}
      />
    );
  };

  return (
    <div className="mb-4 p-6 rounded-3xl bg-gray-100">
      {renderSketch(output.code)}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors"
        >
          {copied ? (
            <>
              <Check size={16} className="text-green-500" />
              <span className="text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={16} />
              <span>Copy Code</span>
            </>
          )}
        </button>
        <span className="text-sm text-gray-500">#{output.id}</span>
      </div>
    </div>
  );
};

export default CodePreview; 