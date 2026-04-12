import React, { useState, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { Plus, BookOpen, Play, Pencil, Check, X, Trash2, CheckSquare, Square, ArrowLeft, AlignLeft } from 'lucide-react';

const LANGUAGES = [
  { id: 'english', name: 'Inglés', icon: '🇺🇸', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'spanish', name: 'Español', icon: '🇪🇸', color: 'bg-red-50 text-red-700 border-red-200' },
  { id: 'german', name: 'Alemán', icon: '🇩🇪', color: 'bg-amber-50 text-amber-700 border-amber-200' }
];

export default function Home() {
  const { 
    texts, collections, apps, activeLanguage, activeCategory, activeCollectionId, 
    setActiveLanguage, setActiveCategory, setActiveCollection, goBackHome, 
    isAdmin, saveText, updateText, deleteText, saveCollection, saveApp, deleteCollection, navigate 
  } = useAppStore();
  
  const [showAll, setShowAll] = useState(false);
  const [selectedTextIds, setSelectedTextIds] = useState([]);
  const [editingTextId, setEditingTextId] = useState(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showRawInput, setShowRawInput] = useState(false);
  const [rawTextValue, setRawTextValue] = useState('');

  // === LEVEL 1: LANGUAGES VIEW ===
  if (!activeLanguage) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold">Mis Idiomas</h2>
          <p className="text-slate-500">Selecciona el idioma que deseas gestionar o estudiar.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {LANGUAGES.map(l => (
            <button 
              key={l.id} 
              onClick={() => setActiveLanguage(l.id)}
              className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 hover:shadow-md hover:-translate-y-1 transition-all ${l.color}`}
            >
              <span className="text-6xl mb-4">{l.icon}</span>
              <h3 className="text-2xl font-bold">{l.name}</h3>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // === LEVEL 2: CATEGORY VIEW (CARDS vs APPS) ===
  if (activeLanguage && !activeCategory) {
    const langData = LANGUAGES.find(l => l.id === activeLanguage);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={goBackHome} className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded-full transition-colors">
             <ArrowLeft size={24}/>
          </button>
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">{langData?.icon} {langData?.name}</h2>
            <p className="text-slate-500">¿Qué sección deseas explorar?</p>
          </div>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-6 mt-8">
          <button 
            onClick={() => setActiveCategory('CARDS')}
            className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white border-2 border-slate-200 hover:border-primary-400 hover:shadow-md hover:-translate-y-1 transition-all group"
          >
            <div className="bg-primary-50 text-primary-600 p-6 rounded-2xl mb-6 group-hover:bg-primary-100 transition-colors">
              <BookOpen size={48} />
            </div>
            <h3 className="text-3xl font-bold text-slate-800">Cards</h3>
            <p className="text-slate-500 mt-2">Colecciones y textos de estudio</p>
          </button>
          
          <button 
            onClick={() => setActiveCategory('APPS')}
            className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white border-2 border-slate-200 hover:border-primary-400 hover:shadow-md hover:-translate-y-1 transition-all group"
          >
            <div className="bg-indigo-50 text-indigo-600 p-6 rounded-2xl mb-6 group-hover:bg-indigo-100 transition-colors">
              <Play size={48} />
            </div>
            <h3 className="text-3xl font-bold text-slate-800">Apps</h3>
            <p className="text-slate-500 mt-2">Aplicaciones interactivas</p>
          </button>
        </div>
      </div>
    );
  }

  // === LEVEL 3B: APPS VIEW ===
  if (activeLanguage && activeCategory === 'APPS') {
    const langData = LANGUAGES.find(l => l.id === activeLanguage);
    const currentApps = (apps || []).filter(a => a.language === activeLanguage);
    
    const handleCreateApp = async () => {
      if(!newCollectionName.trim()) return;
      await saveApp({ name: newCollectionName.trim(), language: activeLanguage, createdAt: Date.now() });
      setNewCollectionName('');
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveCategory(null)} className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded-full transition-colors">
               <ArrowLeft size={24}/>
            </button>
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-2">{langData?.icon} Apps de {langData?.name}</h2>
              <p className="text-slate-500">Gestor de aplicaciones para este idioma.</p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3 shadow-sm">
            <input 
              type="text" 
              placeholder="Nombre de la nueva App..." 
              value={newCollectionName}
              onChange={e => setNewCollectionName(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 w-full"
              onKeyDown={e => { if (e.key === 'Enter') handleCreateApp() }}
            />
            <button 
              onClick={handleCreateApp}
              disabled={!newCollectionName.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg whitespace-nowrap w-full sm:w-auto transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus size={18} /> Crear App
            </button>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {currentApps.length === 0 ? (
            <div className="col-span-full bg-slate-50 p-12 rounded-xl text-center border-2 border-dashed border-slate-200">
               <Play size={48} className="mx-auto text-slate-300 mb-4" />
               <h4 className="text-lg font-medium text-slate-700">No hay Apps</h4>
               <p className="text-slate-500">Aún no hay apps creadas para este idioma.</p>
            </div>
          ) : currentApps.map(a => (
            <div 
              key={a.id} 
              onClick={() => navigate('APP_VIEW', { activeAppId: a.id })}
              className="bg-white border-2 border-slate-200 p-6 rounded-2xl flex items-center gap-4 text-left group transition-all hover:border-indigo-400 hover:shadow-md cursor-pointer"
            >
              <div className="bg-indigo-50 text-indigo-600 p-4 rounded-xl group-hover:bg-indigo-100 transition-colors">
                <Play size={28} />
              </div>
              <div>
                <h4 className="font-bold text-xl text-slate-800">{a.name}</h4>
                <p className="text-sm text-slate-500 mt-1">Aplicación nativa</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // === LEVEL 3A: COLLECTIONS VIEW ===
  if (activeLanguage && activeCategory === 'CARDS' && !activeCollectionId) {
    const langData = LANGUAGES.find(l => l.id === activeLanguage);
    const currentCollections = collections.filter(c => c.language === activeLanguage);
    
    const handleCreateCollection = async () => {
      if(!newCollectionName.trim()) return;
      await saveCollection({ name: newCollectionName.trim(), language: activeLanguage, createdAt: Date.now() });
      setNewCollectionName('');
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveCategory(null)} className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded-full transition-colors">
               <ArrowLeft size={24}/>
            </button>
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-2">{langData?.icon} Colecciones de {langData?.name}</h2>
              <p className="text-slate-500">Administra tus agrupaciones de textos.</p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3 shadow-sm">
            <input 
              type="text" 
              placeholder="Nombre de nueva colección..." 
              value={newCollectionName}
              onChange={e => setNewCollectionName(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 w-full"
              onKeyDown={e => { if (e.key === 'Enter') handleCreateCollection() }}
            />
            <button 
              onClick={handleCreateCollection}
              disabled={!newCollectionName.trim()}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-lg whitespace-nowrap w-full sm:w-auto transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus size={18} /> Crear Colección
            </button>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {currentCollections.length === 0 ? (
            <div className="col-span-full bg-slate-50 p-12 rounded-xl text-center border-2 border-dashed border-slate-200">
               <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
               <h4 className="text-lg font-medium text-slate-700">No hay colecciones</h4>
               <p className="text-slate-500">Aún no hay colecciones creadas para este idioma.</p>
            </div>
          ) : currentCollections.map(c => {
            const textsInCollection = texts.filter(t => t.collectionId === c.id).length;
            return (
            <div
              key={c.id}
              className="bg-white border-2 border-slate-200 hover:border-primary-400 p-6 rounded-2xl flex items-center justify-between gap-4 text-left group transition-all hover:shadow-md relative"
            >
              <div 
                className="flex items-center gap-4 cursor-pointer flex-1"
                onClick={() => setActiveCollection(c.id)}
              >
                <div className="bg-primary-50 text-primary-600 p-4 rounded-xl group-hover:bg-primary-100 transition-colors">
                  <BookOpen size={28} />
                </div>
                <div>
                  <h4 className="font-bold text-xl text-slate-800">{c.name}</h4>
                  <p className="text-sm text-slate-500 mt-1">{textsInCollection} textos listos</p>
                </div>
              </div>
              {isAdmin && textsInCollection === 0 && (
                <button 
                  onClick={(e) => {
                     e.stopPropagation();
                     if(confirm(`¿Estás seguro de eliminar la colección "${c.name}" de manera permanente?`)) {
                         deleteCollection(c.id);
                     }
                  }}
                  className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors z-10 block"
                  title="Eliminar colección (debido a que está vacía)"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          )})}
        </div>
      </div>
    );
  }

  // === LEVEL 3: TEXTS VIEW (Old Home Screen) ===
  const langData = LANGUAGES.find(l => l.id === activeLanguage);
  const collectionData = collections.find(c => c.id === activeCollectionId);
  const currentLangCollections = collections.filter(c => c.language === activeLanguage);
  
  // Filtrar textos solo de esta colección
  const currentTexts = texts.filter(t => t.collectionId === activeCollectionId);
  const displayedTexts = showAll ? currentTexts : currentTexts.slice(0, 5);

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

  const handleProcessRawText = async () => {
    if (!rawTextValue.trim()) return;
    
    const lines = rawTextValue.split('\n');
    let currentText = null;
    const extractedTexts = [];
    
    const calculateStars = (spanishPhrase) => {
       const cleanStr = spanishPhrase.replace(/[^\w\sáéíóúÁÉÍÓÚñÑüÜ]/g, '').trim();
       if (!cleanStr) return 1;
       const words = cleanStr.split(/\s+/);
       return words.length === 1 ? 1 : 2;
    };

    for (let line of lines) {
       let trimmed = line.trim();
       if (!trimmed) continue;
       
       if (trimmed.startsWith('@')) {
           if (currentText) extractedTexts.push(currentText);
           currentText = {
               title: trimmed.substring(1).trim(),
               cards: []
           };
       } else if (trimmed.includes(';')) {
           if (!currentText) {
               currentText = {
                   title: `Texto sin título - ${new Date().toLocaleTimeString()}`,
                   cards: []
               };
           }
           
           const parts = trimmed.split(';');
           if (parts.length >= 2) {
               const spanish = parts[0].trim();
               const english = parts.slice(1).join(';').trim();
               if (spanish && english) {
                   currentText.cards.push({
                       id: crypto.randomUUID(),
                       front: spanish,
                       back: english,
                       isActive: false,
                       stars: calculateStars(spanish)
                   });
               }
           }
       }
    }
    
    if (currentText) extractedTexts.push(currentText);
    
    if (extractedTexts.length === 0) {
       alert("No se encontró ningún formato válido. Usa '@titulo' y 'español ; ingles'.");
       return;
    }
    
    for (let t of extractedTexts) {
       if (t.cards.length === 0) continue;
       
       const newTextPayload = {
          id: t.title,
          title: t.title,
          collectionId: activeCollectionId,
          cards: t.cards
       };
       
       const exists = texts.some(tx => tx.id.toLowerCase() === newTextPayload.id.toLowerCase());
       if (exists) {
           newTextPayload.id = `${newTextPayload.id} - ${crypto.randomUUID().substring(0, 4)}`;
       }
       
       await saveText(newTextPayload);
    }
    
    alert(`¡Se crearon ${extractedTexts.length} textos con éxito!`);
    setRawTextValue('');
    setShowRawInput(false);
  };

  const handleSelectAll = () => {
    if (selectedTextIds.length === currentTexts.length) {
      setSelectedTextIds([]);
    } else {
      setSelectedTextIds(currentTexts.map(t => t.id));
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
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveCollection(null)} className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded-full transition-colors flex-shrink-0">
             <ArrowLeft size={24}/>
          </button>
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">{collectionData?.name}</h2>
            <p className="text-slate-500 flex items-center gap-1">
               {langData?.icon} Colección de {langData?.name}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <button 
                onClick={() => setShowRawInput(!showRawInput)}
                className="flex flex-1 sm:flex-none items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
              >
                <AlignLeft size={18} />
                <span className="hidden sm:inline">Crear usando texto</span>
              </button>
              <button 
                onClick={() => navigate('CREATE_TEXT')}
                className="flex flex-1 sm:flex-none items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Crear usando tarjetas</span>
              </button>
            </>
          )}
        </div>
      </div>

      {showRawInput && (
        <div className="bg-white p-5 rounded-xl shadow-sm border-2 border-primary-200 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Importación Rápida por Texto</label>
            <button onClick={() => setShowRawInput(false)} className="text-slate-400 hover:text-red-500"><X size={18}/></button>
          </div>
          <p className="text-xs text-slate-500 mb-3 font-medium">
            Formato soportado:<br/>
            <span className="font-mono bg-slate-100 px-2 py-1.5 rounded-md block mt-1 text-slate-800">
              @Mi Nuevo Texto<br/>
              hola ; hello<br/>
              buenos días ; good morning
            </span>
          </p>
          <textarea 
            value={rawTextValue}
            onChange={e => setRawTextValue(e.target.value)}
            className="w-full h-48 bg-slate-50 px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 transition-all font-mono text-sm resize-y"
            placeholder="Pega aquí el texto..."
          ></textarea>
          <div className="flex justify-end mt-3">
            <button 
              onClick={handleProcessRawText}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
            >
              Procesar y Guardar
            </button>
          </div>
        </div>
      )}

      {/* LISTA DE TEXTOS */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold">Tus Textos ({currentTexts.length})</h3>
            {isAdmin && currentTexts.length > 0 && (
              <button 
                onClick={handleSelectAll}
                className="text-sm font-medium text-slate-500 hover:text-primary-600 transition-colors"
              >
                {selectedTextIds.length === currentTexts.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && selectedTextIds.length > 0 && (
              <button 
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors"
                title={`Eliminar ${selectedTextIds.length} seleccionado(s)`}
              >
                <Trash2 size={16} /> Eliminar seleccionados
              </button>
            )}
            {currentTexts.length > 5 && (
              <button 
                onClick={() => setShowAll(!showAll)}
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                {showAll ? 'Mostrar menos' : 'Ver todos'}
              </button>
            )}
          </div>
        </div>

        {currentTexts.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center">
            <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
            <h4 className="text-lg font-medium text-slate-700 mb-2">La colección está vacía</h4>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">Comienza agregando tu primer texto con sus tarjetas para empezar a estudiar.</p>
            {isAdmin && (
              <button 
                onClick={() => navigate('CREATE_TEXT')}
                className="inline-flex items-center gap-2 text-primary-700 bg-primary-50 px-5 py-2.5 rounded-lg font-medium hover:bg-primary-100 transition-colors"
              >
                <Plus size={18} /> Crear mi primer texto
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {displayedTexts.map(text => {
              const isSelected = selectedTextIds.includes(text.id);
              return (
              <div key={text.id} className={`bg-white p-5 rounded-xl shadow-sm border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isSelected ? 'border-primary-400 bg-primary-50/50' : 'border-slate-200 hover:border-primary-200'}`}>
                <div className="flex items-start sm:items-center gap-4 flex-1">
                  {isAdmin && (
                    <button 
                      onClick={() => handleToggleSelect(text.id)}
                      className={`mt-1 sm:mt-0 flex-shrink-0 transition-colors ${isSelected ? 'text-primary-600' : 'text-slate-300 hover:text-primary-500'}`}
                    >
                      {isSelected ? <CheckSquare size={24} /> : <Square size={24} />}
                    </button>
                  )}
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
                        {isAdmin && (
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
                        )}
                      </div>
                    )}
                    <p className="text-sm text-slate-500 mt-1">{text.cards?.length || 0} tarjetas</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:ml-auto w-full sm:w-auto mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 justify-end">
                  {isAdmin && (
                    <>
                      <select
                        value={text.collectionId || ''}
                        onChange={(e) => updateText({ ...text, collectionId: e.target.value })}
                        className="text-[10px] sm:text-xs font-bold uppercase text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer transition-colors max-w-[120px] truncate"
                        title="Mover a otra colección"
                      >
                        {currentLangCollections.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2 mr-1 sm:border-r sm:border-l border-slate-200 px-3" title={text.isPrivate ? "Este texto solo lo ven los administradores" : "Este texto lo ven todos los usuarios"}>
                      <span className={`text-[10px] sm:text-xs font-bold uppercase transition-colors ${text.isPrivate ? 'text-amber-500' : 'text-primary-500'}`}>
                        {text.isPrivate ? 'Solo Admin' : 'Compartido'}
                      </span>
                      <button
                        role="switch"
                        onClick={() => updateText({ ...text, isPrivate: !text.isPrivate })}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${text.isPrivate ? 'bg-amber-600' : 'bg-primary-500'}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${text.isPrivate ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    </>
                  )}
                  {isAdmin && (
                    <button 
                      onClick={() => handleDeleteIndividual(text.id, text.title)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent"
                      title="Eliminar texto"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
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
