import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';

export default function TextCreator() {
  const { saveText, texts, navigate } = useAppStore();
  const [title, setTitle] = useState('');
  const [cards, setCards] = useState([
    { id: crypto.randomUUID(), front: '', back: '', isActive: false, stars: 1 }
  ]);

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
        <h2 className="text-2xl font-bold">Crear texto nuevo</h2>
      </div>

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
