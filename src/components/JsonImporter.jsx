import { useState, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { ArrowLeft, Upload, FileCode2, Save } from 'lucide-react';

export default function JsonImporter() {
  const { navigate, saveText, updateText, texts } = useAppStore();
  const [jsonInput, setJsonInput] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setJsonInput(content);
      processJson(content);
    };
    reader.readAsText(file);
  };

  const processJson = (text) => {
    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        alert("El formato JSON es incorrecto. Debe ser un arreglo de textos.");
        setParsedData(null);
        return;
      }
      
      let validTexts = [];
      for (const t of data) {
        if (!t.title || !t.cards) continue;
        const validCards = Array.isArray(t.cards) ? t.cards.filter(c => c.front && c.back) : [];
        if (validCards.length > 0) {
          validTexts.push({
            id: t.title, // Maintaining consistency
            title: t.title,
            cards: validCards.map(c => ({
              id: c.id || crypto.randomUUID(),
              front: c.front,
              back: c.back,
              isActive: typeof c.isActive === 'boolean' ? c.isActive : false,
              stars: Number.isInteger(c.stars) && c.stars >= 1 && c.stars <= 3 ? c.stars : 1
            }))
          });
        }
      }

      if (validTexts.length > 0) {
        setParsedData(validTexts);
      } else {
        alert("No se detectaron textos válidos en el JSON proporcionado.");
        setParsedData(null);
      }
    } catch (err) {
      alert("Error al analizar el JSON. Verifica que la sintaxis sea correcta.");
      setParsedData(null);
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedData) return;
    
    let imported = 0;
    for (const t of parsedData) {
      const exists = texts.find(existing => existing.id.toLowerCase() === t.id.toLowerCase());
      if (exists) {
        const combinedCards = [...exists.cards, ...t.cards];
        await updateText({ ...exists, cards: combinedCards });
      } else {
        await saveText(t);
      }
      imported++;
    }
    
    alert(`Se importaron/actualizaron ${imported} textos exitosamente.`);
    navigate('HOME');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('HOME')}
          className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold flex-1">Importar desde JSON</h2>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-tight">Cargar archivo .json</label>
          <input 
            type="file" 
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 w-full sm:w-auto px-5 py-3 rounded-xl font-bold transition-colors shadow-sm"
          >
            <Upload size={18} /> Seleccionar archivo
          </button>
        </div>

        <div className="relative mt-8">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-white text-sm text-slate-500 font-medium">O pega el texto directamente</span>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-slate-700 uppercase tracking-tight">Texto JSON</label>
            <button 
              onClick={() => processJson(jsonInput)}
              disabled={!jsonInput.trim()}
              className="px-4 py-1.5 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
            >
              Procesar y Previsualizar
            </button>
          </div>
          <textarea 
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value);
              setParsedData(null); // reset preview on change
            }}
            placeholder={`[\n  {\n    "title": "Mi Texto",\n    "cards": [\n      { "front": "Hola", "back": "Hello", "stars": 1 }\n    ]\n  }\n]`}
            className="w-full h-48 bg-slate-50 px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-mono text-sm resize-y"
          />
        </div>
      </div>

      {parsedData && (
        <div className="bg-primary-50 p-6 rounded-xl border border-primary-200 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 mb-4">
            <FileCode2 className="text-primary-600" size={24} />
            <h3 className="text-xl font-bold text-primary-900">Vista Previa</h3>
          </div>
          <p className="text-slate-700 mb-4 font-medium">Se han detectado <strong>{parsedData.length}</strong> texto(s) listo(s) para importar:</p>
          
          <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
            {parsedData.map((t, idx) => (
              <div key={idx} className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-800">{t.title}</span>
                <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{t.cards.length} tarjeta(s)</span>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button 
              onClick={handleConfirmImport}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-sm"
            >
              <Save size={20} />
              Confirmar e Importar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
