import { useState, useEffect, useRef } from 'react';
import { playAudio } from '../utils/tts';

export default function ReadingMode({ list, pauseSeconds, speed, selectedVoice, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState('INIT'); // INIT, ES, PAUSE, EN, DONE
  const cycleIdRef = useRef(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const currentCycleId = ++cycleIdRef.current;
    startCycle(0, currentCycleId);
    return () => {
      window.speechSynthesis.cancel();
      clearTimeout(timeoutRef.current);
    };
  }, []);

  async function startCycle(index, cycleId) {
    if (cycleId !== cycleIdRef.current) return;

    if (index >= list.length) {
      setStep('DONE');
      setTimeout(() => {
        if (cycleId === cycleIdRef.current) onFinish();
      }, 2000);
      return;
    }

    const card = list[index];

    // 1. Reproducir Español
    setStep('ES');
    await playAudio(card.front, 'es-ES', speed, selectedVoice);
    if (cycleId !== cycleIdRef.current) return;

    // 2. Pausa
    setStep('PAUSE');
    await new Promise(res => {
      timeoutRef.current = setTimeout(res, pauseSeconds * 1000);
    });
    if (cycleId !== cycleIdRef.current) return;

    // 3. Reproducir Inglés
    setStep('EN');
    await playAudio(card.back, 'en-US', speed);
    if (cycleId !== cycleIdRef.current) return;

    // Siguiente Tarjeta
    setCurrentIndex(index + 1);
    startCycle(index + 1, cycleId);
  };

  const currentCard = list[currentIndex] || {};

  if (step === 'DONE') {
    return (
      <div className="bg-white p-12 rounded-3xl text-center shadow-sm border border-slate-200">
        <h3 className="text-2xl font-bold text-primary-600 mb-2">¡Sesión completada exitosamente!</h3>
        <p className="text-slate-500 font-medium animate-pulse">Regresando al menú principal...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-200 text-center relative max-w-2xl mx-auto min-h-[450px] flex flex-col justify-center">
      <div className="absolute top-6 right-6 text-sm font-bold text-slate-400">
        <span className="text-primary-600">{currentIndex + 1}</span> / {list.length}
      </div>
      
      {currentCard.textTitle && (
        <div className="absolute top-6 left-6 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
          {currentCard.textTitle}
        </div>
      )}

      <div className="space-y-12">
        {/* Lado en Español */}
        <div className={`transition-all duration-700 ${step === 'ES' || step === 'PAUSE' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-40 -translate-y-4 scale-95'}`}>
          <span className={`text-xs font-bold uppercase tracking-widest mb-4 block ${step === 'ES' ? 'text-primary-600 animate-pulse' : 'text-slate-400'}`}>
            {step === 'ES' && '🔊 '}ESCUCHANDO EXPRESIÓN
          </span>
          <p className="text-3xl sm:text-5xl font-black text-slate-800 leading-tight">
            "{currentCard.front}"
          </p>
        </div>

        {/* Separador e Indicador de tiempo */}
        <div className="flex justify-center h-12 items-center">
          {step === 'PAUSE' && (
            <div className="flex flex-col items-center animate-in fade-in zoom-in-95 w-full max-w-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 border-dashed">Tu turno ¡Repite en voz alta!</span>
              <div className="w-full h-2 bg-slate-100 shadow-inner rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-500 rounded-full transition-all ease-linear shadow-sm"
                  style={{ 
                    animation: `progress ${pauseSeconds}s linear forwards` 
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Lado en Inglés */}
        <div className={`transition-all duration-500 ${step === 'EN' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
          <span className={`text-xs font-bold uppercase tracking-widest mb-4 block text-indigo-500 animate-pulse`}>
            🔊 TRADUCCIÓN
          </span>
          <p className="text-3xl sm:text-5xl font-black text-indigo-900 leading-tight">
            "{currentCard.back}"
          </p>
        </div>
      </div>
      
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
