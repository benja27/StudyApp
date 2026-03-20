import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { ArrowLeft, Download } from 'lucide-react';

export default function CsvGenerator() {
  const { navigate } = useAppStore();
  const [inputText, setInputText] = useState('');

  const handleGenerate = () => {
    if (!inputText.trim()) {
      alert("Por favor, ingresa texto para generar el CSV.");
      return;
    }

    const lines = inputText.split(/\r?\n/).map(line => line.trim());
    let title = '';
    const spanishParts = [];
    const englishParts = [];
    
    let isEnglishSection = false;

    for (const line of lines) {
      if (line.startsWith('#')) {
        title = line.substring(1).trim();
      } else if (line === '$') {
        isEnglishSection = true;
      } else if (line !== '') {
        if (isEnglishSection) {
          englishParts.push(line);
        } else {
          spanishParts.push(line);
        }
      }
    }

    if (!title) {
      alert("No se encontró el título. Asegúrate de incluir '#titulo'.");
      return;
    }

    if (spanishParts.length === 0 || englishParts.length === 0) {
      alert("Faltan textos en español o inglés. Asegúrate de separar con '$'.");
      return;
    }

    const maxLen = Math.max(spanishParts.length, englishParts.length);
    let csvOutput = "title,spanish,english\n";

    const escapeCSV = (str) => {
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    for (let i = 0; i < maxLen; i++) {
      const sp = spanishParts[i] || '';
      const en = englishParts[i] || '';
      csvOutput += `${escapeCSV(title)},${escapeCSV(sp)},${escapeCSV(en)}\n`;
    }

    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${title || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('HOME')}
          className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">Generador CSV</h2>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Pega tu texto aquí</label>
          <p className="text-xs text-slate-500 mb-2">Formato: #titulo, luego frases en español, luego $ y por último frases en inglés. Usa puntos aislados para respetar los párrafos.</p>
          <textarea 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={"#titulo\nfrase español 1\n.\n$\nenglish phrase 1\n."}
            className="w-full h-64 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none font-mono text-sm leading-relaxed"
          ></textarea>
        </div>

        <button 
          onClick={handleGenerate}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-sm"
        >
          <Download size={20} />
          Descargar CSV
        </button>
      </div>
    </div>
  );
}
