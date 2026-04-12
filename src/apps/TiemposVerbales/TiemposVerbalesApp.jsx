import React, { useState, useEffect } from 'react';
import diccionario from './diccionario.json';
import { Dices, ListPlus, BookOpen, Calculator } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

export default function TiemposVerbalesApp({ appData }) {
  const { texts } = useAppStore();

  // App Modes
  const [appMode, setAppMode] = useState('textos'); // 'textos' | 'formulas'

  // Tiempos State
  const [selectedTenses, setSelectedTenses] = useState([]);
  const [generatedTense, setGeneratedTense] = useState('Tiempo verbal');
  
  // Base State (Textos Mode)
  const [selectedTextId, setSelectedTextId] = useState('');
  const [displayedPhrase, setDisplayedPhrase] = useState('Selecciona un cuento');

  // Formulas State (Formulas Mode)
  const formulas = ['Artículo + Sustantivo + Verbo'];
  const [activeFormula, setActiveFormula] = useState(formulas[0]);
  const [formulaElements, setFormulaElements] = useState([]);

  const tenses = [
    'Presente simple', 'Pasado simple', 'Futuro simple',
    'Presente perfecto', 'Pasado perfecto', 'Futuro perfecto'
  ];

  // Initialize selected text ID if texts are available
  useEffect(() => {
    if (texts.length > 0 && !selectedTextId) {
      setSelectedTextId(texts[0].id);
    }
  }, [texts, selectedTextId]);

  /* --- HANDLERS: TIEMPOS --- */
  const toggleTense = (tense) => {
    if (selectedTenses.includes(tense)) {
      setSelectedTenses(selectedTenses.filter(t => t !== tense));
    } else {
      setSelectedTenses([...selectedTenses, tense]);
    }
  };

  const generateRandomTense = () => {
    if (selectedTenses.length === 0) {
      alert('Activa al menos un tiempo verbal (botón verde) para usar el sorteo aleatorio.');
      return;
    }
    const randomIdx = Math.floor(Math.random() * selectedTenses.length);
    setGeneratedTense(selectedTenses[randomIdx]);
  };

  /* --- HANDLERS: BASE / CUENTOS --- */
  const handleGeneratePhrase = () => {
    if (!selectedTextId) {
       alert('Por favor selecciona un cuento del menú desplegable primero.');
       return;
    }
    const targetText = texts.find(t => t.id === selectedTextId);
    if (!targetText || !targetText.cards || targetText.cards.length === 0) {
       alert('Este texto no tiene frases o tarjetas para mostrar.');
       return;
    }
    const idx = Math.floor(Math.random() * targetText.cards.length);
    setDisplayedPhrase(targetText.cards[idx].front);
  };

  /* --- HANDLERS: FORMULAS --- */
  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
  
  const handleGenerateFormula = () => {
    const parts = activeFormula.split('+').map(p => p.trim().toLowerCase());
    const result = [];

    parts.forEach(part => {
      let category = null;
      if (part === 'artículo' || part === 'articulo') category = diccionario.articulos;
      else if (part === 'sustantivo') category = diccionario.sustantivos;
      else if (part === 'verbo') category = diccionario.verbos;
      else if (part === 'pronombre') category = diccionario.pronombres;

      if (category) {
        const subkeys = Object.keys(category);
        const randomSubcat = pickRandom(subkeys);
        const randomItem = pickRandom(category[randomSubcat]);
        result.push(randomItem);
      } else {
        result.push({spa: '?', eng: '?'});
      }
    });

    setFormulaElements(result);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-200 min-h-[500px]">
      
      {/* HEADER VISUAL */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-4 border-b border-slate-100 gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-800 text-center sm:text-left">Tiempos Verbales</h3>
          <p className="text-xs text-slate-500 text-center sm:text-left">Módulo de gramática avanzada.</p>
        </div>
        
        {/* SELECTOR DE MODO */}
        <div className="bg-slate-100 p-1.5 rounded-full flex items-center gap-1">
          <button 
             onClick={() => setAppMode('textos')}
             className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${appMode === 'textos' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
             <BookOpen size={14} /> Modo Cuentos
          </button>
          <button 
             onClick={() => setAppMode('formulas')}
             className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${appMode === 'formulas' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
             <Calculator size={14} /> Modo Fórmulas
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
        
        {/* PANEL: TIEMPOS (SIEMPRE VISIBLE) */}
        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 flex flex-col h-full shadow-inner">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">1. Selección de Tiempos</h4>
            <button 
              onClick={generateRandomTense}
              className="bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Dices size={14} /> Sortear Tiempo
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-none">
            {tenses.map((tense) => {
              const isActive = selectedTenses.includes(tense);
              return (
                <button 
                  key={tense}
                  onClick={() => toggleTense(tense)}
                  className={`font-bold py-3 px-2 rounded-xl transition-all shadow-sm text-[10px] tracking-wide uppercase text-center border-2 ${isActive ? 'bg-green-500 text-white border-green-600 scale-[1.02] shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
                >
                  {tense}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex-1 bg-white rounded-2xl border-2 border-dashed border-green-200 flex flex-col items-center justify-center min-h-[100px] bg-green-50/40 relative overflow-hidden group">
             <div className="absolute top-2 left-3 opacity-50"><Dices size={24} className="text-green-300"/></div>
             <span className={`text-xl sm:text-2xl font-black text-center px-4 transition-colors relative z-10 ${generatedTense === 'Tiempo verbal' ? 'text-slate-300' : 'text-green-600 drop-shadow-sm'}`}>
               {generatedTense}
             </span>
             <h4 className="text-[9px] font-bold text-green-500 tracking-widest uppercase absolute bottom-2">Tiempo Retado</h4>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PANEL: MODO CUENTOS */}
        {/* ========================================================= */}
        {appMode === 'textos' && (
          <div className="bg-indigo-50/30 p-5 rounded-3xl border border-indigo-100 flex flex-col h-full">
            <h4 className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase mb-4 flex items-center gap-1">
               <BookOpen size={14}/> 2. Base Original de Cuentos
            </h4>
            
            <select 
              value={selectedTextId}
              onChange={(e) => setSelectedTextId(e.target.value)}
              className="w-full bg-white border border-indigo-200 text-slate-700 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3 font-semibold outline-none cursor-pointer mb-4 shadow-sm"
            >
              <option value="" disabled>Selecciona un texto de tu nube...</option>
              {texts.map(t => (
                <option key={t.id} value={t.id}>{t.title} ({t.cards?.length || 0} cartas)</option>
              ))}
            </select>
            
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 flex-1 flex flex-col items-center justify-center min-h-[160px] p-6 shadow-inner relative">
               <span className={`text-3xl sm:text-4xl text-center font-black transition-colors leading-tight ${displayedPhrase === 'Selecciona un cuento' ? 'text-slate-300' : 'text-slate-800'}`}>
                 {displayedPhrase}
               </span>
            </div>

            <button 
              onClick={handleGeneratePhrase}
              className="mt-4 flex flex-col items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-6 rounded-2xl transition-transform hover:-translate-y-1 shadow-lg hover:shadow-xl w-full"
            >
              <span className="text-lg uppercase tracking-widest">Generar Frase Random</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* PANEL: MODO FÓRMULAS */}
        {/* ========================================================= */}
        {appMode === 'formulas' && (
          <div className="bg-blue-50/30 p-5 rounded-3xl border border-blue-100 flex flex-col h-full">
            <h4 className="text-[10px] font-bold text-blue-400 tracking-widest uppercase mb-4 flex items-center gap-1">
               <Calculator size={14}/> 2. Base de Fórmulas Creadas
            </h4>

            <select 
              value={activeFormula}
              onChange={(e) => setActiveFormula(e.target.value)}
              className="w-full bg-white border border-blue-200 text-slate-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 font-semibold outline-none cursor-pointer mb-4 shadow-sm"
            >
              {formulas.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>

            <div className="bg-white p-4 sm:p-6 rounded-2xl border-2 border-dashed border-blue-200 flex-1 flex flex-col items-center justify-center min-h-[160px] shadow-inner relative">
              {formulaElements.length === 0 ? (
                <span className="text-slate-300 font-bold text-center text-xl">Sin fórmula calculada</span>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {formulaElements.map((item, index) => (
                    <React.Fragment key={index}>
                      <div className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 shadow-sm min-w-[90px]">
                        <span className="text-xl font-black text-slate-800 tracking-tight">{item.spa}</span>
                        <span className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{item.eng}</span>
                      </div>
                      {index < formulaElements.length - 1 && (
                        <span className="text-xl font-black text-blue-300 px-0.5">+</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={handleGenerateFormula}
              className="mt-4 flex flex-col items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-6 rounded-2xl transition-transform hover:-translate-y-1 shadow-lg hover:shadow-xl w-full"
            >
              <span className="text-lg uppercase tracking-widest">Calcular Elementos</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
