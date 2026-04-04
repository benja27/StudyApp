import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { ArrowLeft, Plus, Trash2, Save, FileText, X } from 'lucide-react';
import { parseTextsFromCSV } from '../utils/csvParser';

export default function TextCreator() {
  const { saveText, texts, navigate } = useAppStore();
  const [title, setTitle] = useState('');
  const [cards, setCards] = useState([
    { id: crypto.randomUUID(), front: '', back: '', isActive: false, stars: 1 }
  ]);
  const [showCSVPaste, setShowCSVPaste] = useState(false);
  const [pastedCSV, setPastedCSV] = useState('');

  const handleProcessCSV = () => {
    if (!pastedCSV.trim()) return;
    const lines = pastedCSV.trim().split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length === 0) return;

    let possibleTitle = '';
    let csvDataToParse = lines;

    if (lines[0].startsWith('#')) {
      possibleTitle = lines[0].replace(/^#/, '').trim();
      csvDataToParse = lines.slice(1);
    }
    
    const parsed = parseTextsFromCSV(csvDataToParse.join('\n'));
    if (parsed.length > 0) {
      if (possibleTitle) setTitle(possibleTitle);
      
      const newCards = [];
      parsed.forEach(t => {
         t.cards.forEach(c => newCards.push({...c, id: crypto.randomUUID()}));
      });
      
      if (newCards.length > 0) {
        setCards(newCards);
        alert('Tarjetas importadas correctamente en el editor.');
        setShowCSVPaste(false);
        setPastedCSV('');
      } else {
        alert('No se detectaron tarjetas válidas en el formato CSV.');
      }
    } else {
        alert('No se detectaron textos válidos.');
    }
  };

  const addCard = () => {
    setCards([...cards, { id: crypto.randomUUID(), front: '', back: '', isActive: false, stars: 1 }]);
  };

  const updateCard = (id, field, value) => {
    setCards(cards.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCard = (id) => {
    if (cards.length > 1) {
      setCards(cards.filter(c => c.id !== id));
    }
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      alert('Por favor agrega un título al texto.');
      return;
    }
    
    // Easter Egg detection
    const w = trimmedTitle.toLowerCase();
    const isMitchVariant = ['mitch', 'michell', 'mich', 'michel', 'mitchell', 'michy'].includes(w);
    
    if (isMitchVariant) {
      setTitle(''); // reset
      navigate('EASTER_EGG');
      return;
    }

    // Check if title already exists to avoid collisions since title is the ID
    const exists = texts.some(t => t.id.toLowerCase() === trimmedTitle.toLowerCase());
    if (exists) {
      alert('Ya existe un texto con este título en la biblioteca.');
      return;
    }

    const validCards = cards.filter(c => c.front.trim() && c.back.trim());
    if (validCards.length === 0) {
      alert('Por favor agrega al menos una tarjeta válida (frente y reverso).');
      return;
    }

    const newText = {
      id: trimmedTitle, // "usando su título como identificador"
      title: trimmedTitle,
      cards: validCards
    };

    await saveText(newText);
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
        <h2 className="text-2xl font-bold flex-1">Crear texto nuevo</h2>
        <button 
          onClick={() => setShowCSVPaste(!showCSVPaste)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
        >
          <FileText size={18} /> Pegar desde CSV
        </button>
      </div>

      {showCSVPaste && (
        <div className="bg-white p-5 rounded-xl shadow-sm border-2 border-primary-200 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Pegar Formato CSV</label>
            <button onClick={() => setShowCSVPaste(false)} className="text-slate-400 hover:text-red-500"><X size={18}/></button>
          </div>
          <p className="text-xs text-slate-500 mb-3 font-medium">Puedes usar la primera línea con <strong>#Titulo del Texto</strong>. Ej:<br/>
          <span className="font-mono bg-slate-100 px-2 py-1 rounded block mt-1">#titulo<br/>title,spanish,english,stars<br/>Bienvenida AMX,"parte en spanish","parte en ingles",2</span></p>
          <textarea 
            value={pastedCSV}
            onChange={e => setPastedCSV(e.target.value)}
            className="w-full h-40 bg-slate-50 px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 transition-all font-mono text-sm resize-y"
            placeholder="Pega aquí el contenido CSV con el formato indicado..."
          ></textarea>
          <div className="flex justify-end mt-3">
            <button 
              onClick={handleProcessCSV}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
            >
              Procesar CSV
            </button>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Título del Texto</label>
        <input 
          type="text" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Saludos y Presentaciones"
          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-lg"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Tarjetas de Estudio ({cards.length})</h3>
        </div>

        {cards.map((card, index) => (
          <div key={card.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative group animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute -left-3 -top-3 bg-slate-800 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ring-4 ring-slate-50">
              {index + 1}
            </div>
            
            {cards.length > 1 && (
              <button 
                onClick={() => removeCard(card.id)}
                className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors p-1"
                title="Eliminar tarjeta"
              >
                <Trash2 size={20} />
              </button>
            )}

            <div className="grid md:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Español (Familiar o Regla)</label>
                <textarea 
                  value={card.front}
                  onChange={(e) => updateCard(card.id, 'front', e.target.value)}
                  placeholder="Ej: Hola, ¿cómo estás?"
                  rows={2}
                  className="w-full bg-slate-50 px-4 py-3 rounded-lg border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Inglés (Traducción objetivo)</label>
                <textarea 
                  value={card.back}
                  onChange={(e) => updateCard(card.id, 'back', e.target.value)}
                  placeholder="Ej: Hello, how are you?"
                  rows={2}
                  className="w-full bg-slate-50 px-4 py-3 rounded-lg border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Dificultad (Estrellas)</span>
              <div className="flex bg-slate-100 p-1 rounded-lg gap-1 border border-slate-200">
                {[1, 2, 3].map(s => (
                  <button
                    key={s}
                    onClick={() => updateCard(card.id, 'stars', s)}
                    className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${card.stars === s ? 'bg-amber-100 text-amber-700 shadow-sm border border-amber-300 transform scale-105' : 'text-slate-500 hover:bg-slate-200 border border-transparent'}`}
                    type="button"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button 
          onClick={addCard}
          className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-primary-700 px-5 py-3 rounded-xl font-semibold transition-colors border-2 border-primary-100 border-dashed"
        >
          <Plus size={20} />
          Agregar otra tarjeta
        </button>
        <button 
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-xl font-semibold transition-colors shadow-sm"
        >
          <Save size={20} />
          Guardar Texto en Biblioteca
        </button>
      </div>
    </div>
  );
}
