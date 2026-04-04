import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { ArrowLeft, Play, Save, CheckSquare, Square, Trash2, Pencil, X, Download, Plus } from 'lucide-react';

export default function TextDetails() {
  const { texts, activeTextId, updateText, deleteText, navigate, startStudySession } = useAppStore();
  const text = texts.find(t => t.id === activeTextId);

  // Mantenemos una copia local para la edición
  const [cards, setCards] = useState(text ? [...text.cards] : []);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Estado para la edición en línea de tarjetas
  const [editingCardId, setEditingCardId] = useState(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');
  const [inlineStars, setInlineStars] = useState(1);

  if (!text) {
    return (
      <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-slate-200">
        <p className="text-slate-500 mb-4 text-lg">Texto no encontrado.</p>
        <button onClick={() => navigate('HOME')} className="text-primary-600 font-semibold hover:underline bg-primary-50 px-4 py-2 rounded-lg">Volver a la biblioteca</button>
      </div>
    );
  }

  const handleToggleActive = (id) => {
    setCards(cards.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
    setHasChanges(true);
  };

  const handleEditClick = (card) => {
    setEditingCardId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
  };

  const handleSaveEdit = (id) => {
    setCards(cards.map(c => c.id === id ? { ...c, front: editFront, back: editBack } : c));
    setEditingCardId(null);
    setHasChanges(true);
  };

  const handeSetStars = (id, stars) => {
    setCards(cards.map(c => c.id === id ? { ...c, stars } : c));
    setHasChanges(true);
  };

  const activeStars = [1, 2, 3].filter(s => {
    const cardsOfStar = cards.filter(c => c.stars === s);
    return cardsOfStar.length > 0 && cardsOfStar.every(c => c.isActive);
  });

  const toggleStarFilter = (s) => {
    const cardsOfStar = cards.filter(c => c.stars === s);
    if (cardsOfStar.length === 0) return;

    const wasActive = activeStars.includes(s);
    setCards(cards.map(c => c.stars === s ? { ...c, isActive: !wasActive } : c));
    setHasChanges(true);
  };

  const handleDeleteCard = (id) => {
    if (confirm("¿Estás seguro de eliminar esta tarjeta por completo? Esta acción requerirá guardar el archivo para completarse definitivamente.")) {
      setCards(cards.filter(c => c.id !== id));
      setHasChanges(true);
    }
  };

  const handleSelectAll = (active) => {
    setCards(cards.map(c => ({ ...c, isActive: active })));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await updateText({ ...text, cards });
    setHasChanges(false);
  };

  const handleStartStudy = () => {
    const activeCards = cards.filter(c => c.isActive);
    if (activeCards.length === 0) {
      alert("No hay tarjetas seleccionadas (en lista) para estudiar. Activa al menos una.");
      return;
    }
    // Pasamos el contexto del título al estudiar
    const cardsToStudy = activeCards.map(c => ({...c, textTitle: text.title}));
    startStudySession(cardsToStudy);
  };

  const handleDeleteText = async () => {
    if (confirm("¿Estás seguro de eliminar este texto por completo? Esta acción no se puede deshacer.")) {
      await deleteText(text.id);
      navigate('HOME');
    }
  };

  const escapeCSV = (str) => {
    if (!str) return '';
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleDownloadCSV = () => {
    let csvOutput = "title,spanish,english,stars\n";
    cards.forEach(card => {
      csvOutput += `${escapeCSV(text.title)},${escapeCSV(card.front)},${escapeCSV(card.back)},${card.stars || 1}\n`;
    });
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${text.title}.csv`;
    link.click();
  };

  const handleAddInlineCard = () => {
    if (!editFront.trim() || !editBack.trim()) {
      alert("Por favor llena ambos textos para crear la tarjeta.");
      return;
    }
    const newCard = {
      id: crypto.randomUUID(),
      front: editFront,
      back: editBack,
      isActive: true, // starts active by default
      stars: inlineStars
    };
    setCards([...cards, newCard]);
    setEditFront('');
    setEditBack('');
    setInlineStars(1);
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (hasChanges && !confirm("Tienes cambios sin guardar. ¿Deseas salir de todas formas?")) return;
              navigate('HOME');
            }}
            className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-slate-800">{text.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 px-3 py-2 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg text-sm font-semibold transition-colors shadow-sm whitespace-nowrap"
            title="Exportar tarjetas a CSV"
          >
            <Download size={18} className="hidden sm:inline" /> CSV
          </button>
          <button 
            onClick={handleDeleteText}
            className="p-2.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-100"
            title="Eliminar texto por completo"
          >
            <Trash2 size={20} />
          </button>
          
          <button 
            onClick={handleStartStudy}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm"
          >
            <Play size={18} /> Iniciar Estudio local
          </button>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col xl:flex-row justify-between xl:items-center gap-4">
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4 w-full xl:w-auto">
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button 
              onClick={() => handleSelectAll(true)}
              className="text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors"
            >
              Seleccionar todas
            </button>
            <button 
              onClick={() => handleSelectAll(false)}
              className="text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors"
            >
              Ninguna
            </button>
          </div>

          <div className="hidden sm:block w-px h-6 bg-slate-200 shrink-0"></div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Filtrar:</span>
            <div className="flex bg-slate-100 p-1 rounded-lg gap-1 border border-slate-200">
              {[1, 2, 3].map(s => {
                const hasCards = cards.some(c => c.stars === s);
                const isActive = activeStars.includes(s);
                return (
                  <button 
                    key={s} 
                    onClick={() => toggleStarFilter(s)}
                    disabled={!hasCards}
                    className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-1 ${!hasCards ? 'opacity-50 cursor-not-allowed hidden sm:flex' : isActive ? 'bg-amber-100 text-amber-700 border border-amber-300 shadow-sm transform scale-105' : 'text-slate-500 hover:bg-slate-200 border border-transparent'}`}
                    title={!hasCards ? `No hay tarjetas con ${s} estrella${s > 1 ? 's' : ''}` : `Seleccionar tarjetas de ${s} estrella${s > 1 ? 's' : ''}`}
                  >
                     {s} ★
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between xl:justify-end gap-4 w-full xl:w-auto mt-2 xl:mt-0">
          <div className="flex text-sm text-slate-500 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 shrink-0">
            Activas: <span className="font-bold text-slate-800 ml-1">{cards.filter(c => c.isActive).length} / {cards.length}</span>
          </div>

          {hasChanges && (
            <button 
              onClick={handleSave}
              className="flex items-center justify-center gap-2 bg-primary-100 text-primary-700 hover:bg-primary-200 hover:text-primary-800 px-6 py-2 rounded-lg font-bold transition-colors shrink-0"
            >
              <Save size={18} /> Guardar cambios
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        {cards.map((card) => (
          <div key={card.id} className={`bg-white p-4 sm:p-5 rounded-xl border-2 transition-all flex flex-col sm:flex-row sm:items-center gap-4 group relative ${card.isActive ? 'border-primary-400 shadow-sm' : 'border-slate-200 opacity-70 hover:opacity-100'}`}>
            {editingCardId !== card.id && (
              <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEditClick(card)}
                  className="p-1.5 text-slate-400 hover:text-primary-600 bg-white rounded-full shadow-sm border border-slate-200"
                  title="Editar contenido"
                >
                  <Pencil size={14} />
                </button>
                <button 
                  onClick={() => handleDeleteCard(card.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 bg-white rounded-full shadow-sm border border-slate-200"
                  title="Eliminar tarjeta"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
            <button 
              onClick={() => handleToggleActive(card.id)}
              className="flex-shrink-0 text-slate-400 hover:text-primary-600 transition-colors self-start sm:self-auto mt-1 sm:mt-0"
              title={card.isActive ? 'Desactivar de la lista' : 'Agregar a la lista'}
            >
              {card.isActive ? <CheckSquare size={28} className="text-primary-500" /> : <Square size={28} />}
            </button>
            
            <div className="flex-1 grid md:grid-cols-2 gap-4 w-full">
              {editingCardId === card.id ? (
                <>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-primary-500 font-bold uppercase tracking-wider block mb-1">Editando Español</span>
                    <textarea 
                      value={editFront} 
                      onChange={e => setEditFront(e.target.value)} 
                      className="w-full h-full min-h-[80px] text-slate-800 text-sm md:text-base font-medium bg-slate-50 border border-primary-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none" 
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-primary-500 font-bold uppercase tracking-wider block mb-1">Editando Inglés</span>
                    <textarea 
                      value={editBack} 
                      onChange={e => setEditBack(e.target.value)} 
                      className="w-full text-slate-800 text-sm md:text-base min-h-[80px] bg-slate-50 border border-primary-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none mb-2" 
                    />
                    <div className="flex items-center justify-end gap-2 mt-auto">
                      <button onClick={() => setEditingCardId(null)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg text-sm font-medium transition-colors"><X size={14}/> Cancelar</button>
                      <button onClick={() => handleSaveEdit(card.id)} className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white hover:bg-primary-700 rounded-lg text-sm font-medium transition-colors"><Save size={14}/> Guardar</button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Español</span>
                    <p className="text-slate-800 text-sm md:text-base font-medium whitespace-pre-wrap">{card.front}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Inglés</span>
                    <p className="text-slate-800 leading-snug text-sm md:text-base whitespace-pre-wrap">{card.back}</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-1 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-4 min-w-[100px]">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${card.isActive ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'}`}>
                {card.isActive ? 'En lista' : 'No en lista'}
              </span>
              <div className="flex items-center gap-1 mt-1 bg-slate-50 p-1 rounded-full border border-slate-100">
                {[1, 2, 3].map(s => (
                  <button
                    key={s}
                    onClick={() => handeSetStars(card.id, s)}
                    className={`w-6 h-6 rounded-full text-xs font-bold transition-colors flex items-center justify-center ${card.stars === s ? 'bg-amber-100 text-amber-700 border border-amber-300 shadow-sm' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}
                    title={`${s} estrella${s > 1 ? 's' : ''}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
        
        {/* INLINE CARD CREATION FORM */}
        <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border-2 border-dashed border-slate-300 mt-4 flex flex-col gap-4">
          <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Añadir nueva tarjeta rápidamente</h4>
          <div className="flex-1 grid md:grid-cols-2 gap-4 w-full">
            <div className="flex flex-col">
              <span className="text-[10px] text-primary-500 font-bold uppercase tracking-wider block mb-1">Español</span>
              <textarea 
                value={editingCardId === 'NEW' ? editFront : ''} 
                onChange={e => {
                  if(editingCardId !== 'NEW') { setEditingCardId('NEW'); setEditBack(''); setInlineStars(1); }
                  setEditFront(e.target.value);
                }} 
                onClick={() => { if(editingCardId !== 'NEW') { setEditingCardId('NEW'); setEditFront(''); setEditBack(''); setInlineStars(1); } }}
                placeholder="Escribe el lado en español..."
                className="w-full min-h-[80px] text-slate-800 text-sm md:text-base font-medium bg-white border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none" 
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-primary-500 font-bold uppercase tracking-wider block mb-1">Inglés</span>
              <textarea 
                value={editingCardId === 'NEW' ? editBack : ''} 
                onChange={e => {
                  if(editingCardId !== 'NEW') { setEditingCardId('NEW'); setEditFront(''); setInlineStars(1); }
                  setEditBack(e.target.value);
                }} 
                onClick={() => { if(editingCardId !== 'NEW') { setEditingCardId('NEW'); setEditFront(''); setEditBack(''); setInlineStars(1); } }}
                placeholder="Escribe el lado en inglés..."
                className="w-full min-h-[80px] text-slate-800 text-sm md:text-base font-medium bg-white border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none" 
              />
            </div>
          </div>
          {editingCardId === 'NEW' && (
            <>
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Dificultad de la tarjeta:</span>
                <div className="flex bg-slate-100 p-1 rounded-lg gap-1 border border-slate-200">
                  {[1, 2, 3].map(s => (
                    <button
                      key={s}
                      onClick={() => setInlineStars(s)}
                      className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${inlineStars === s ? 'bg-amber-100 text-amber-700 shadow-sm border border-amber-300 transform scale-105' : 'text-slate-500 hover:bg-slate-200 border border-transparent'}`}
                      type="button"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button 
                  onClick={() => { setEditingCardId(null); setEditFront(''); setEditBack(''); setInlineStars(1); }} 
                  className="px-4 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddInlineCard} 
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg text-sm font-bold transition-colors shadow-sm"
                >
                  <Plus size={16} /> Añadir Tarjeta
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
