import { useState, useEffect, useRef } from 'react';
import { playAudio } from '../utils/tts';
import { calculateSimilarity } from '../utils/stringMath';
import { CornerDownLeft, AlertCircle } from 'lucide-react';

export default function WritingMode({ list, speed, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState('INIT'); // INIT, ES, INPUT, ERROR, SUCCESS, DONE
  const [inputValue, setInputValue] = useState('');
  
  const [errorDetails, setErrorDetails] = useState(null); // { score, expected, input }
  const inputRef = useRef(null);
  const cycleIdRef = useRef(0);

  useEffect(() => {
    const currentCycleId = ++cycleIdRef.current;
    startCycle(0, currentCycleId);
    return () => { 
      window.speechSynthesis.cancel(); 
    };
  }, []);

  async function startCycle(index, cycleId) {
    if (cycleId !== cycleIdRef.current) return;

    if (index >= list.length) {
      setStep('DONE');
      setTimeout(() => { if (cycleId === cycleIdRef.current) onFinish(); }, 2000);
      return;
    }

    setInputValue('');
    setErrorDetails(null);
    const card = list[index];

    // Reproducir español
    setStep('ES');
    await playAudio(card.front, 'es-ES', speed);
    if (cycleId !== cycleIdRef.current) return;

    // Permitir escribir
    setStep('INPUT');
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  };

  const handleKeyDown = (e) => {
    // Evaluar con ENTER (soporta móviles sin teclado si el usuario presiona Enter en el input)
    if (e.key === 'Enter' && inputValue.trim()) {
      evaluateResponse();
    }
  };

  const evaluateResponse = () => {
    const card = list[currentIndex];
    // Se valida a un 80% usando distancua Levenshtein optimizado
    const score = calculateSimilarity(inputValue, card.back);

    if (score >= 80) {
      setStep('SUCCESS');
      playAudio(card.back, 'en-US', speed);
      
      // Delay de éxito y cambio al siguiente
      const currentCycleId = cycleIdRef.current;
      setTimeout(() => {
        if (currentCycleId === cycleIdRef.current) {
          setCurrentIndex(prev => prev + 1);
          startCycle(currentIndex + 1, currentCycleId);
        }
      }, 2500);
    } else {
      setStep('ERROR');
      setErrorDetails({ score: Math.round(score), expected: card.back, input: inputValue });
      playAudio("Incorrecto. Intenta de nuevo.", 'es-ES', speed);
    }
  };

  const retry = () => {
    setStep('INPUT');
    setInputValue('');
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  };

  const currentCard = list[currentIndex] || {};

  if (step === 'DONE') {
    return (
      <div className="bg-white p-12 rounded-3xl text-center shadow-sm border border-slate-200">
        <h3 className="text-2xl font-bold text-indigo-600 mb-2">¡Sesión de escritura completa!</h3>
        <p className="text-slate-500 font-medium">Saliendo...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-200 max-w-2xl mx-auto min-h-[450px] flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-bl-full -z-10 opacity-60"></div>

      <div className="absolute top-6 right-6 text-sm font-bold text-slate-400 bg-white p-1 rounded-full shadow-sm">
        <span className="text-indigo-600 ml-2">{currentIndex + 1}</span> / <span className="mr-2">{list.length}</span>
      </div>
      
      <div className="mb-10 text-center relative z-10 pt-4">
        <span className={`text-xs font-bold uppercase tracking-widest mb-4 block ${step === 'ES' ? 'text-indigo-500 animate-pulse' : 'text-slate-400'}`}>
          {step === 'ES' ? '🔊 Escuchando expresión' : 'Traduce lo que escuchaste'}
        </span>
        <p className="text-3xl sm:text-4xl font-black text-slate-800 leading-tight">
          "{currentCard.front}"
        </p>
      </div>

      {(step === 'INPUT' || step === 'SUCCESS' || step === 'ERROR') && (
        <div className="animate-in fade-in slide-in-from-bottom-4 flex-1 flex flex-col justify-center w-full z-10">
          <div className="relative w-full shadow-lg rounded-2xl">
            <input 
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={step === 'SUCCESS' || step === 'ERROR'}
              placeholder="Escribe la frase en inglés..."
              className={`w-full text-center text-xl md:text-2xl px-6 py-6 rounded-2xl border-2 outline-none transition-all placeholder:text-slate-300 font-medium font-serif italic ${
                step === 'SUCCESS' ? 'border-green-400 bg-green-50 text-green-800 shadow-inner' : 
                step === 'ERROR' ? 'border-red-400 bg-red-50 text-red-800' : 
                'border-slate-300 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 shadow-inner'
              }`}
              spellCheck="false"
              autoComplete="off"
            />
            {step === 'INPUT' && inputValue.trim() && (
              <button 
                onClick={evaluateResponse}
                className="absolute right-3 top-3 bottom-3 bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm hover:translate-x-1"
              >
                Enter <CornerDownLeft size={18} />
              </button>
            )}
          </div>

          {step === 'ERROR' && errorDetails && (
            <div className="mt-8 bg-red-50 p-6 sm:p-8 rounded-3xl border border-red-200 text-center animate-in zoom-in-95 shadow-sm">
              <AlertCircle size={40} className="text-red-500 mx-auto mb-4 drop-shadow-sm" />
              <h4 className="text-red-800 font-extrabold text-xl mb-2">¡Casi! Similitud: {errorDetails.score}%</h4>
              <p className="text-red-600 text-sm mb-6 font-medium">Se requiere al menos un 80% de similitud para aprobar.</p>
              
              <div className="bg-white p-5 rounded-2xl border border-red-100 mb-6 w-full text-left shadow-sm">
                <div className="mb-4 border-b border-slate-100 pb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Lo que escribiste:</span>
                  <div className="text-red-500 line-through text-lg font-medium">{errorDetails.input}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest block mb-2 bg-green-50 inline-block px-2 py-0.5 rounded-full border border-green-200">Traducción correcta:</span>
                  <div className="text-green-700 font-extrabold text-2xl drop-shadow-sm">{errorDetails.expected}</div>
                </div>
              </div>

              <button 
                onClick={retry}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-black text-lg w-full transition-transform hover:-translate-y-1 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                Reintentar escritura
              </button>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="mt-8 text-center text-green-600 font-bold text-lg bg-green-50 p-4 rounded-xl border border-green-200 flex items-center justify-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              ¡Excelente! Siguiente frase preparándose...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
