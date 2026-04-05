import { useState, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { Plus, BookOpen, Play, Upload, FileText, Pencil, Check, X, Trash2, CheckSquare, Square, FileCode2 } from 'lucide-react';
import { parseTextsFromCSV } from '../utils/csvParser';

export default function Home() {
  const { texts, saveText, updateText, deleteText, navigate, startStudySession } = useAppStore();
  const [showAll, setShowAll] = useState(false);
  const [selectedTextIds, setSelectedTextIds] = useState([]);
  const [editingTextId, setEditingTextId] = useState(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const fileInputRef = useRef(null);

  const displayedTexts = showAll ? texts : texts.slice(0, 5);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvContent = event.target.result;
      const parsedTexts = parseTextsFromCSV(csvContent);
      
      if (parsedTexts.length === 0) {
        alert("No se encontraron textos válidos en el archivo CSV.");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      let importedCount = 0;
      for (const t of parsedTexts) {
        const currentTexts = useAppStore.getState().texts;
        const exists = currentTexts.find(existing => existing.id.toLowerCase() === t.id.toLowerCase());
        
        if (!exists) {
          await saveText(t);
        } else {
          const combinedCards = [...exists.cards, ...t.cards];
          await updateText({ ...exists, cards: combinedCards });
        }
        importedCount++;
      }
      
      alert(`Se importaron o actualizaron ${importedCount} textos correctamente desde el CSV.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleSaveTitle = async (textToEdit) => {
    if (!editTitleValue.trim() || editTitleValue.trim() === textToEdit.title) {
      setEditingTextId(null);
      return;
    }
    await updateText({ ...textToEdit, title: editTitleValue.trim() });
    setEditingTextId(null);
  };

  const handleToggleSelect = (id) => {
    if (selectedTextIds.includes(id)) {
      setSelectedTextIds(selectedTextIds.filter(t => t !== id));
    } else {
      setSelectedTextIds([...selectedTextIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedTextIds.length === texts.length) {
      setSelectedTextIds([]);
    } else {
      setSelectedTextIds(texts.map(t => t.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (confirm(`¿Estás seguro de eliminar los ${selectedTextIds.length} textos seleccionados de manera permanente?`)) {
      for (const id of selectedTextIds) {
        await deleteText(id);
      }
      setSelectedTextIds([]);
    }
  };

  const handleDeleteIndividual = async (id, title) => {
    if (confirm(`¿Estás seguro de eliminar el texto "${title}" de manera permanente?`)) {
      await deleteText(id);
      setSelectedTextIds(selectedTextIds.filter(selectedId => selectedId !== id));
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Mi Biblioteca</h2>
          <p className="text-slate-500">Gestiona tus textos y tarjetas de estudio.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex-1 sm:flex-none"
          >
            <Upload size={20} />
            <span className="hidden sm:inline">Importar CSV</span>
          </button>
          <button 
            onClick={() => navigate('GENERATE_CSV')}
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex-1 sm:flex-none"
          >
            <FileText size={20} />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button 
            onClick={() => navigate('IMPORT_JSON')}
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex-1 sm:flex-none"
          >
            <FileCode2 size={20} />
            <span className="hidden sm:inline">JSON</span>
          </button>
          <button 
            onClick={() => navigate('CREATE_TEXT')}
            className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex-1 sm:flex-none"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Crear texto</span>
          </button>
        </div>
      </div>


      {/* LISTA DE TEXTOS */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold">Tus Textos ({texts.length})</h3>
            {texts.length > 0 && (
              <button 
                onClick={handleSelectAll}
                className="text-sm font-medium text-slate-500 hover:text-primary-600 transition-colors"
              >
                {selectedTextIds.length === texts.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            {selectedTextIds.length > 0 && (
              <button 
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors"
                title={`Eliminar ${selectedTextIds.length} seleccionado(s)`}
              >
                <Trash2 size={16} /> Eliminar seleccionados
              </button>
            )}
            {texts.length > 5 && (
              <button 
                onClick={() => setShowAll(!showAll)}
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                {showAll ? 'Mostrar menos' : 'Ver todos'}
              </button>
            )}
          </div>
        </div>

        {texts.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center">
            <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
            <h4 className="text-lg font-medium text-slate-700 mb-2">La biblioteca está vacía</h4>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">Comienza agregando tu primer texto con sus tarjetas para empezar a estudiar.</p>
            <button 
              onClick={() => navigate('CREATE_TEXT')}
              className="inline-flex items-center gap-2 text-primary-700 bg-primary-50 px-5 py-2.5 rounded-lg font-medium hover:bg-primary-100 transition-colors"
            >
              <Plus size={18} /> Crear mi primer texto
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {displayedTexts.map(text => {
              const isSelected = selectedTextIds.includes(text.id);
              return (
              <div key={text.id} className={`bg-white p-5 rounded-xl shadow-sm border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isSelected ? 'border-primary-400 bg-primary-50/50' : 'border-slate-200 hover:border-primary-200'}`}>
                <div className="flex items-start sm:items-center gap-4 flex-1">
                  <button 
                    onClick={() => handleToggleSelect(text.id)}
                    className={`mt-1 sm:mt-0 flex-shrink-0 transition-colors ${isSelected ? 'text-primary-600' : 'text-slate-300 hover:text-primary-500'}`}
                  >
                    {isSelected ? <CheckSquare size={24} /> : <Square size={24} />}
                  </button>
                  <div className="flex-1">
                    {editingTextId === text.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="text"
                          autoFocus
                          value={editTitleValue}
                          onChange={e => setEditTitleValue(e.target.value)}
                          className="text-lg font-bold text-slate-800 bg-slate-50 border border-primary-500 rounded-md px-2 py-1 w-full max-w-sm outline-none"
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveTitle(text);
                            if (e.key === 'Escape') setEditingTextId(null);
                          }}
                        />
                        <button onClick={() => handleSaveTitle(text)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-md" title="Guardar"><Check size={18} /></button>
                        <button onClick={() => setEditingTextId(null)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md" title="Cancelar"><X size={18} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <h4 className="text-lg font-bold text-slate-800">{text.title}</h4>
                        <button 
                          onClick={() => {
                            setEditingTextId(text.id);
                            setEditTitleValue(text.title);
                          }} 
                          className="p-1 text-slate-400 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Editar título"
                        >
                          <Pencil size={18} />
                        </button>
                      </div>
                    )}
                    <p className="text-sm text-slate-500 mt-1">{text.cards?.length || 0} tarjetas</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 justify-end">
                  <button 
                    onClick={() => handleDeleteIndividual(text.id, text.title)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent"
                    title="Eliminar texto"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button 
                    onClick={() => navigate('TEXT_DETAILS', { activeTextId: text.id })}
                    className="px-5 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-primary-700 hover:border-primary-300 transition-colors whitespace-nowrap"
                  >
                    Abrir texto
                  </button>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}
