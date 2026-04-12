import React, { useState } from 'react';
import fraseBaseTxt from './frase base.txt?raw';

export default function TiemposVerbalesApp({ appData }) {
  const [activeTense, setActiveTense] = useState(null);
  const [displayedPhrase, setDisplayedPhrase] = useState('base');

  const tenses = [
    'Presente simple', 'Pasado simple', 'Futuro simple',
    'Presente perfecto', 'Pasado perfecto', 'Futuro perfecto'
  ];

  const handleGenerate = () => {
    // 1. Elegir un tiempo al azar
    const randomTenseIndex = Math.floor(Math.random() * tenses.length);
    setActiveTense(tenses[randomTenseIndex]);

    // 2. Elegir una frase al azar de frase base.txt
    const lines = fraseBaseTxt.split('\n').filter(line => line.trim() !== '');
    if (lines.length > 0) {
      const randomLineIndex = Math.floor(Math.random() * lines.length);
      const selectedLine = lines[randomLineIndex];
      // El formato es "spanish ; english", tomamos el frente en español
      const spanishPart = selectedLine.split(';')[0].trim();
      setDisplayedPhrase(spanishPart);
    } else {
      setDisplayedPhrase('Sin frases');
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 min-h-[400px]">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
        <div>
          <h3 className="text-2xl font-extrabold text-slate-800">Tiempos Verbales</h3>
          <p className="text-slate-500">Módulo interactivo de gramática libre.</p>
        </div>
      </div>

      <div className="grid gap-8">
        {/* SECCIÓN: ACCIÓN */}
        <div className="flex flex-col items-center pb-2 border-b border-slate-100">
          <h4 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-4 text-center">Sección: Acción</h4>
          <button 
            onClick={handleGenerate}
            className="flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-black py-5 px-16 rounded-full transition-transform hover:-translate-y-1 shadow-lg hover:shadow-xl w-full sm:w-auto"
          >
            <span className="text-2xl uppercase tracking-widest">Generar reto</span>
          </button>
        </div>

        {/* SECCIÓN: TIEMPOS */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <h4 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-4 text-center">Sección: Tiempos</h4>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className={`font-bold py-4 px-4 rounded-2xl transition-all shadow-sm text-sm tracking-wider uppercase text-center border-2 ${activeTense === 'Presente simple' ? 'bg-sky-500 text-white border-sky-500 scale-105 shadow-md' : 'bg-white text-slate-300 border-slate-200'}`}>
              Presente simple
            </div>
            <div className={`font-bold py-4 px-4 rounded-2xl transition-all shadow-sm text-sm tracking-wider uppercase text-center border-2 ${activeTense === 'Pasado simple' ? 'bg-indigo-500 text-white border-indigo-500 scale-105 shadow-md' : 'bg-white text-slate-300 border-slate-200'}`}>
              Pasado simple
            </div>
            <div className={`font-bold py-4 px-4 rounded-2xl transition-all shadow-sm text-sm tracking-wider uppercase text-center border-2 ${activeTense === 'Futuro simple' ? 'bg-purple-500 text-white border-purple-500 scale-105 shadow-md' : 'bg-white text-slate-300 border-slate-200'}`}>
              Futuro simple
            </div>
            <div className={`font-bold py-4 px-4 rounded-2xl transition-all shadow-sm text-sm tracking-wider uppercase text-center border-2 ${activeTense === 'Presente perfecto' ? 'bg-cyan-500 text-white border-cyan-500 scale-105 shadow-md' : 'bg-white text-slate-300 border-slate-200'}`}>
              Presente perfecto
            </div>
            <div className={`font-bold py-4 px-4 rounded-2xl transition-all shadow-sm text-sm tracking-wider uppercase text-center border-2 ${activeTense === 'Pasado perfecto' ? 'bg-rose-500 text-white border-rose-500 scale-105 shadow-md' : 'bg-white text-slate-300 border-slate-200'}`}>
              Pasado perfecto
            </div>
            <div className={`font-bold py-4 px-4 rounded-2xl transition-all shadow-sm text-sm tracking-wider uppercase text-center border-2 ${activeTense === 'Futuro perfecto' ? 'bg-fuchsia-500 text-white border-fuchsia-500 scale-105 shadow-md' : 'bg-white text-slate-300 border-slate-200'}`}>
              Futuro perfecto
            </div>
          </div>
        </div>

        {/* SECCIÓN: BASE */}
        <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center min-h-[160px]">
           <h4 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-4">Sección: Base</h4>
           <div className="text-center w-full">
             <span className={`text-5xl font-black transition-colors ${displayedPhrase === 'base' ? 'text-slate-300' : 'text-slate-800'}`}>
               {displayedPhrase}
             </span>
           </div>
        </div>
      </div>
    </div>
  );
}
