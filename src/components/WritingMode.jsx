import { useState, useEffect, useRef } from 'react';
import { playAudio } from '../utils/tts';
import { calculateSimilarity } from '../utils/stringMath';
import { CornerDownLeft, AlertCircle, Pause } from 'lucide-react';

export default function WritingMode({ list, speed, selectedVoice, selectedVoiceEn, isPaused, repetitions = 1, isReversed = false, activeLanguage = 'english' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState('INIT'); // INIT, QUESTION, INPUT, ERROR, SUCCESS, REVIEW, DONE
  const [inputValue, setInputValue] = useState('');
  const [reviewCount, setReviewCount] = useState(0);
  
  const [errorDetails, setErrorDetails] = useState(null); // { score, expected, input }
  const inputRef = useRef(null);
  const cycleIdRef = useRef(0);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isPausedRef.current = isPaused;
    if (isPaused) {
      window.speechSynthesis.pause();
    } else {
      window.speechSynthesis.resume();
      // focus back on resume if in INPUT step
      if (step === 'INPUT' && inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isPaused, step]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function waitWhilePaused(cycleId) {
    while (isPausedRef.current && cycleId === cycleIdRef.current) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function pausableDelay(ms, cycleId) {
    let remaining = ms;
    while (remaining > 0 && cycleId === cycleIdRef.current) {
      if (isPausedRef.current) {
        await new Promise(r => setTimeout(r, 100));
      } else {
        const stepMs = Math.min(100, remaining);
        await new Promise(r => setTimeout(r, stepMs));
        remaining -= stepMs;
      }
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function startCycle(index, cycleId) {
    if (cycleId !== cycleIdRef.current) return;

    if (index >= list.length) {
      setCurrentIndex(0);
      startCycle(0, cycleId);
      return;
    }

    setInputValue('');
    setErrorDetails(null);
    const card = list[index];

    const questionText = isReversed ? card.back : card.front;
    const translationLang = activeLanguage === 'german' ? 'de-DE' : 'en-US';
    const questionLang = isReversed ? translationLang : 'es-ES';
    const questionVoice = isReversed ? selectedVoiceEn : selectedVoice;

    // Wait if paused before starting
    await waitWhilePaused(cycleId);
    if (cycleId !== cycleIdRef.current) return;

    // Reproducir pregunta
    setStep('QUESTION');
    await playAudio(questionText, questionLang, speed, questionVoice);
    if (cycleId !== cycleIdRef.current) return;
    
    await waitWhilePaused(cycleId);
    if (cycleId !== cycleIdRef.current) return;

    // Permitir escribir
    setStep('INPUT');
    setTimeout(() => {
      if (inputRef.current && !isPausedRef.current) inputRef.current.focus();
    }, 100);
  }

  useEffect(() => {
    const currentCycleId = ++cycleIdRef.current;
    
    // Ensure synthesis is clear and not paused from a previous run
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume(); 
    
    startCycle(0, currentCycleId);
    return () => { 
      window.speechSynthesis.cancel(); 
      cycleIdRef.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyDown = (e) => {
    if (isPaused) return;
    if (e.key === 'Enter' && inputValue.trim()) {
      if (step === 'REVIEW') {
        evaluateReview();
      } else {
        evaluateResponse();
      }
    }
  };

  const evaluateReview = () => {
    const card = list[currentIndex];
    const answerText = isReversed ? card.front : card.back;
    
    // Validar con el mismo 80% de similitud que el modo normal
    const score = calculateSimilarity(inputValue, answerText);
    
    if (score >= 80) {
      const nextCount = reviewCount + 1;
      if (nextCount >= 7) {
        setReviewCount(0);
        finishCard();
      } else {
        setReviewCount(nextCount);
        setInputValue('');
      }
    } else {
      setReviewCount(0);
      setInputValue('');
    }
  };

  const finishCard = async () => {
    const card = list[currentIndex];
    const translationLang = activeLanguage === 'german' ? 'de-DE' : 'en-US';
    const answerText = isReversed ? card.front : card.back;
    const answerLang = isReversed ? 'es-ES' : translationLang;
    const answerVoice = isReversed ? selectedVoice : selectedVoiceEn;
    const currentCycleId = cycleIdRef.current;

    setStep('SUCCESS');
    
    // Repeticiones extra
    for (let i = 0; i < repetitions; i++) {
      await pausableDelay(1500, currentCycleId);
      if (currentCycleId !== cycleIdRef.current) return;
      
      await playAudio(answerText, answerLang, speed, answerVoice);
      if (currentCycleId !== cycleIdRef.current) return;
      
      await waitWhilePaused(currentCycleId);
      if (currentCycleId !== cycleIdRef.current) return;
    }
    
    // Pausa estricta final de 1.5 segundos antes de la siguiente tarjeta
    await pausableDelay(1500, currentCycleId);
    if (currentCycleId !== cycleIdRef.current) return;
    
    setCurrentIndex(prev => prev + 1);
    startCycle(currentIndex + 1, currentCycleId);
  };

  const evaluateResponse = async () => {
    const card = list[currentIndex];
    
    const translationLang = activeLanguage === 'german' ? 'de-DE' : 'en-US';
    const answerText = isReversed ? card.front : card.back;
    const answerLang = isReversed ? 'es-ES' : translationLang;
    const answerVoice = isReversed ? selectedVoice : selectedVoiceEn;

    // Se valida a un 80% usando distancia Levenshtein 
    const score = calculateSimilarity(inputValue, answerText);
    const currentCycleId = cycleIdRef.current;

    if (score >= 80) {
      finishCard();
    } else if (score < 70 || inputValue.toLowerCase().trim() === 'asdf') {
      // Modo Repaso
      setStep('REVIEW');
      setReviewCount(0);
      setInputValue('');
      setErrorDetails({ score: Math.round(score), expected: answerText, input: inputValue });
      await playAudio("Modo repaso activado. Escribe la respuesta correcta 7 veces.", 'es-ES', speed, selectedVoice);
    } else {
      setStep('ERROR');
      setErrorDetails({ score: Math.round(score), expected: answerText, input: inputValue });
      await playAudio("Incorrecto. Intenta de nuevo.", 'es-ES', speed, selectedVoice);
    }
  };

  const retry = () => {
    if (isPaused) return;
    setStep('INPUT');
    setInputValue('');
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  };

  const currentCard = list[currentIndex] || {};
  const renderedQuestion = isReversed ? currentCard.back : currentCard.front;

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
        <span className={`text-xs font-bold uppercase tracking-widest mb-4 block ${step === 'QUESTION' ? 'text-indigo-500 animate-pulse' : 'text-slate-400'}`}>
          {step === 'QUESTION' ? '🔊 Escuchando expresión' : 'Traduce lo que escuchaste'}
        </span>
        <p className={`text-3xl sm:text-4xl font-black leading-tight transition-opacity ${isPaused ? 'text-slate-400 opacity-60' : 'text-slate-800'}`}>
          "{renderedQuestion}"
        </p>
      </div>
      
      {isPaused && (
        <div className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-amber-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest animate-pulse shadow-lg border border-white/20">
          <Pause size={14} fill="white" /> PAUSADO
        </div>
      )}

      {(step === 'INPUT' || step === 'SUCCESS' || step === 'ERROR') && (
        <div className="animate-in fade-in slide-in-from-bottom-4 flex-1 flex flex-col justify-center w-full z-10">
          <div className="relative w-full shadow-lg rounded-2xl">
            <input 
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={step === 'SUCCESS' || step === 'ERROR' || isPaused}
              placeholder={`Escribe la frase en ${isReversed ? 'español' : (activeLanguage === 'german' ? 'alemán' : 'inglés')}...`}
              className={`w-full text-center text-xl md:text-2xl px-6 py-6 rounded-2xl border-2 outline-none transition-all placeholder:text-slate-300 font-medium font-serif italic ${
                step === 'SUCCESS' ? 'border-green-400 bg-green-50 text-green-800 shadow-inner' : 
                step === 'ERROR' ? 'border-red-400 bg-red-50 text-red-800' : 
                'border-slate-300 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 shadow-inner'
              }`}
              spellCheck="false"
              autoComplete="off"
            />
            {step === 'INPUT' && inputValue.trim() && !isPaused && (
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
                disabled={isPaused}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-8 py-4 rounded-xl font-black text-lg w-full transition-transform hover:-translate-y-1 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
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
              ¡Excelente! {repetitions > 1 ? `Repitiendo respuesta (${repetitions}x)...` : 'Siguiente frase preparándose...'}
            </div>
          )}
        </div>
      )}

      {/* MODAL MODO REPASO */}
      {step === 'REVIEW' && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-white/20 flex flex-col">
            
            {/* Header del Modal */}
            <div className="bg-amber-500 p-6 text-white text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <AlertCircle size={32} fill="white" className="text-amber-500" />
                <h3 className="text-2xl font-black uppercase tracking-tighter">Modo Repaso Activo</h3>
              </div>
              <p className="text-amber-50 font-bold text-sm">Debes escribir la respuesta correcta 7 veces consecutivas.</p>
            </div>

            <div className="p-8 sm:p-12 flex-1 flex flex-col items-center text-center">
              
              <div className="mb-8 w-full">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Respuesta Correcta:</span>
                <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 shadow-inner">
                  <p className="text-3xl sm:text-4xl font-black text-slate-800 leading-tight">
                    "{errorDetails?.expected}"
                  </p>
                </div>
              </div>

              <div className="w-full relative">
                <div className="flex items-center justify-between mb-4 px-2">
                   <span className="text-xs font-bold text-slate-500">Progreso de escritura</span>
                   <span className="text-lg font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                     {reviewCount} / 7
                   </span>
                </div>
                
                <div className="relative group">
                  <input 
                    ref={inputRef}
                    autoFocus
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe la frase exactamente..."
                    className="w-full text-center text-xl md:text-2xl px-6 py-6 rounded-3xl border-4 border-slate-100 bg-slate-50 focus:border-amber-400 focus:bg-white focus:ring-8 focus:ring-amber-400/10 outline-none transition-all placeholder:text-slate-300 font-medium italic shadow-inner"
                    spellCheck="false"
                    autoComplete="off"
                  />
                  
                  {inputValue.trim() && (
                    <button 
                      onClick={evaluateReview}
                      className="absolute right-3 top-3 bottom-3 bg-amber-500 hover:bg-amber-600 text-white px-6 rounded-2xl font-black transition-all flex items-center gap-2 shadow-md hover:scale-105 active:scale-95"
                    >
                      <CornerDownLeft size={20} />
                    </button>
                  )}
                </div>

                <div className="mt-6 flex gap-1 justify-center">
                  {[...Array(7)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-2 flex-1 rounded-full transition-all duration-500 ${i < reviewCount ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-slate-100'}`}
                    ></div>
                  ))}
                </div>
              </div>

            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                Si te equivocas en una sola letra, el contador volverá a cero.
              </p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
