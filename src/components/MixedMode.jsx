import { useState, useEffect, useRef } from 'react';
import { playAudio } from '../utils/tts';
import { calculateSimilarity } from '../utils/stringMath';
import { CornerDownLeft, AlertCircle, Pause, Zap, RotateCcw } from 'lucide-react';

export default function MixedMode({ 
  list, 
  pauseSeconds, 
  speed, 
  selectedVoice, 
  selectedVoiceEn, 
  isPaused, 
  repetitions = 0, 
  isReversed = false, 
  activeLanguage = 'english',
  setIsPaused,
  onFinish 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState('INIT'); // READING_Q, READING_PAUSE, READING_A, HIDE_A, WRITING_INPUT, WRITING_ERROR, WRITING_SUCCESS, REVIEW, DONE
  const [inputValue, setInputValue] = useState('');
  const [reviewCount, setReviewCount] = useState(0);
  const [errorDetails, setErrorDetails] = useState(null);

  const cycleIdRef = useRef(0);
  const timeoutRef = useRef(null);
  const inputRef = useRef(null);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isPausedRef.current = isPaused;
    if (isPaused) {
      window.speechSynthesis.pause();
    } else {
      window.speechSynthesis.resume();
      if ((step === 'WRITING_INPUT' || step === 'REVIEW') && inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isPaused, step]);

  async function waitWhilePaused(cycleId) {
    while (isPausedRef.current && cycleId === cycleIdRef.current) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  async function pausableDelay(ms, cycleId) {
    let remaining = ms;
    while (remaining > 0 && cycleId === cycleIdRef.current) {
      if (isPausedRef.current) {
        await new Promise(r => setTimeout(r, 100));
      } else {
        const stepMs = Math.min(100, remaining);
        await new Promise(r => { timeoutRef.current = setTimeout(r, stepMs); });
        remaining -= stepMs;
      }
    }
  }

  async function startCycle(index, cycleId) {
    if (cycleId !== cycleIdRef.current) return;

    if (index >= list.length) {
      onFinish();
      return;
    }

    const card = list[index];
    setInputValue('');
    setErrorDetails(null);

    const questionText = isReversed ? card.back : card.front;
    const translationLang = activeLanguage === 'german' ? 'de-DE' : 'en-US';
    const questionLang = isReversed ? translationLang : 'es-ES';
    const questionVoice = isReversed ? selectedVoiceEn : selectedVoice;

    const answerText = isReversed ? card.front : card.back;
    const answerLang = isReversed ? 'es-ES' : translationLang;
    const answerVoice = isReversed ? selectedVoice : selectedVoiceEn;

    await waitWhilePaused(cycleId);
    if (cycleId !== cycleIdRef.current) return;

    // 1. Lectura: Pregunta
    setStep('READING_Q');
    await playAudio(questionText, questionLang, speed, questionVoice);
    if (cycleId !== cycleIdRef.current) return;

    await waitWhilePaused(cycleId);
    if (cycleId !== cycleIdRef.current) return;

    // 2. Pausa
    setStep('READING_PAUSE');
    await pausableDelay(pauseSeconds * 1000, cycleId);
    if (cycleId !== cycleIdRef.current) return;

    // 3. Lectura: Respuesta
    setStep('READING_A');
    await playAudio(answerText, answerLang, speed, answerVoice);
    if (cycleId !== cycleIdRef.current) return;

    // 4. Repeticiones
    for (let i = 0; i < repetitions; i++) {
      setStep('HIDE_A');
      await pausableDelay(1500, cycleId);
      if (cycleId !== cycleIdRef.current) return;

      setStep('READING_A');
      await playAudio(answerText, answerLang, speed, answerVoice);
      if (cycleId !== cycleIdRef.current) return;
    }

    await waitWhilePaused(cycleId);
    if (cycleId !== cycleIdRef.current) return;

    // 5. Escritura: Input
    setStep('WRITING_INPUT');
    setTimeout(() => {
      if (inputRef.current && !isPausedRef.current) inputRef.current.focus();
    }, 100);
  }

  useEffect(() => {
    const currentCycleId = ++cycleIdRef.current;
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume(); 
    startCycle(0, currentCycleId);
    return () => {
      window.speechSynthesis.cancel();
      clearTimeout(timeoutRef.current);
      cycleIdRef.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyDown = (e) => {
    if (isPaused) return;
    if (e.key === 'Enter' && inputValue.trim()) {
      if (step === 'REVIEW') {
        evaluateReview();
      } else if (step === 'WRITING_INPUT') {
        evaluateResponse();
      }
    }
  };

  const skipToNext = () => {
    window.speechSynthesis.cancel();
    clearTimeout(timeoutRef.current);
    const newCycleId = ++cycleIdRef.current;
    const nextIndex = currentIndex + 1;
    if (nextIndex < list.length) {
      setCurrentIndex(nextIndex);
      startCycle(nextIndex, newCycleId);
    } else {
      onFinish();
    }
  };

  const evaluateResponse = async () => {
    const card = list[currentIndex];
    const answerText = isReversed ? card.front : card.back;
    const score = calculateSimilarity(inputValue, answerText);
    const currentCycleId = cycleIdRef.current;

    if (score >= 80) {
      setStep('WRITING_SUCCESS');
      await pausableDelay(1500, currentCycleId);
      if (currentCycleId !== cycleIdRef.current) return;
      
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      startCycle(nextIndex, currentCycleId);
    } else if (score < 70 || inputValue.toLowerCase().trim() === 'asdf') {
      setStep('REVIEW');
      setReviewCount(0);
      setInputValue('');
      setErrorDetails({ score: Math.round(score), expected: answerText, input: inputValue });
      await playAudio("Modo repaso activado. Escribe la respuesta correcta 7 veces.", 'es-ES', speed, selectedVoice);
    } else {
      setStep('WRITING_ERROR');
      setErrorDetails({ score: Math.round(score), expected: answerText, input: inputValue });
      await playAudio("Incorrecto. Intenta de nuevo.", 'es-ES', speed, selectedVoice);
    }
  };

  const evaluateReview = () => {
    const card = list[currentIndex];
    const answerText = isReversed ? card.front : card.back;
    const score = calculateSimilarity(inputValue, answerText);
    
    if (score >= 80) {
      const nextCount = reviewCount + 1;
      if (nextCount >= 7) {
        setReviewCount(0);
        skipToNext();
      } else {
        setReviewCount(nextCount);
        setInputValue('');
      }
    } else {
      setReviewCount(0);
      setInputValue('');
    }
  };

  const retryWriting = () => {
    setStep('WRITING_INPUT');
    setInputValue('');
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  };

  const currentCard = list[currentIndex] || {};
  const renderedQuestion = isReversed ? currentCard.back : currentCard.front;
  const renderedAnswer = isReversed ? currentCard.front : currentCard.back;

  return (
    <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-200 max-w-2xl mx-auto min-h-[500px] flex flex-col relative overflow-hidden">
      
      {isPaused && (
        <div className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-amber-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest animate-pulse shadow-lg border border-white/20">
          <Pause size={14} fill="white" /> PAUSADO
        </div>
      )}

      <div className="absolute top-6 right-6 text-sm font-bold text-slate-400 bg-white p-1 rounded-full shadow-sm">
        <span className="text-orange-600 ml-2">{currentIndex + 1}</span> / <span className="mr-2">{list.length}</span>
      </div>

      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-bl-[100px] -z-10 opacity-60"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-50 rounded-tr-[50px] -z-10 opacity-60"></div>

      <div className="flex-1 flex flex-col justify-center relative z-10 pt-4">
        
        <div className="text-center mb-8">
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 block ${step.startsWith('READING') ? 'text-orange-500 animate-pulse' : 'text-slate-400'}`}>
                {step.startsWith('READING') ? '🔊 Escucha con atención' : 'Ahora escribe la traducción'}
            </span>
            <p className="text-3xl sm:text-4xl font-black text-slate-800 leading-tight">
                "{renderedQuestion}"
            </p>
        </div>

        <div className="min-h-[200px] flex flex-col justify-center">
            
            {/* Answer Display (During reading or while typing) */}
            {(step === 'READING_A' || step === 'WRITING_INPUT' || step === 'WRITING_SUCCESS' || step === 'WRITING_ERROR') && (
                <div className={`transition-all duration-300 ${step === 'READING_A' ? 'opacity-100 scale-105 mb-6' : 'opacity-40 scale-90 mb-4'}`}>
                    <div className="pt-6 border-t border-slate-100 text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Respuesta:</span>
                        <p className="text-2xl font-bold text-orange-600 italic">
                            "{renderedAnswer}"
                        </p>
                    </div>
                </div>
            )}

            {/* Input Field */}
            {(step === 'WRITING_INPUT' || step === 'WRITING_SUCCESS' || step === 'WRITING_ERROR') && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                    <div className="relative shadow-lg rounded-2xl overflow-hidden">
                        <input 
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={step === 'WRITING_SUCCESS' || isPaused}
                            placeholder={`Escribe en ${isReversed ? 'español' : (activeLanguage === 'german' ? 'alemán' : 'inglés')}...`}
                            className={`w-full text-center text-xl md:text-2xl px-6 py-6 border-4 outline-none transition-all font-medium italic ${
                                step === 'WRITING_SUCCESS' ? 'border-green-400 bg-green-50 text-green-800' :
                                step === 'WRITING_ERROR' ? 'border-red-400 bg-red-50 text-red-800' :
                                'border-slate-100 bg-white focus:border-orange-500 focus:ring-8 focus:ring-orange-400/10'
                            }`}
                            autoComplete="off"
                            spellCheck="false"
                        />
                        {step === 'WRITING_INPUT' && inputValue.trim() && !isPaused && (
                            <button 
                                onClick={evaluateResponse}
                                className="absolute right-3 top-3 bottom-3 bg-orange-600 hover:bg-orange-700 text-white px-5 rounded-xl font-bold transition-all flex items-center gap-2"
                            >
                                <CornerDownLeft size={18} />
                            </button>
                        )}
                    </div>

                    {step === 'WRITING_ERROR' && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-center">
                            <p className="text-red-700 font-bold mb-3 flex items-center justify-center gap-2">
                                <AlertCircle size={18} /> Similitud: {errorDetails?.score}% (Mínimo 80%)
                            </p>
                            <button onClick={retryWriting} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center gap-2 mx-auto">
                                <RotateCcw size={16} /> Reintentar
                            </button>
                        </div>
                    )}

                    {step === 'WRITING_SUCCESS' && (
                        <div className="mt-6 text-center text-green-600 font-bold bg-green-50 p-4 rounded-xl border border-green-200 animate-pulse">
                            ¡Perfecto! Siguiente frase...
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* MODAL MODO REPASO */}
      {step === 'REVIEW' && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-white/20 flex flex-col">
            <div className="bg-amber-500 p-6 text-white text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <AlertCircle size={32} fill="white" />
                <h3 className="text-2xl font-black uppercase tracking-tighter">Modo Repaso Activo</h3>
              </div>
              <p className="text-amber-50 font-bold text-sm">Escribe la respuesta correcta 7 veces (80% similitud).</p>
            </div>
            <div className="p-8 sm:p-12 flex-1 flex flex-col items-center text-center">
              <div className="mb-8 w-full">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Respuesta Correcta:</span>
                <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 shadow-inner">
                  <p className="text-3xl sm:text-4xl font-black text-slate-800 leading-tight">"{errorDetails?.expected}"</p>
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
                    className="w-full text-center text-xl md:text-2xl px-6 py-6 rounded-3xl border-4 border-slate-100 bg-slate-50 focus:border-amber-400 focus:bg-white outline-none transition-all font-medium italic"
                    autoComplete="off"
                    spellCheck="false"
                  />
                  {inputValue.trim() && (
                    <button onClick={evaluateReview} className="absolute right-3 top-3 bottom-3 bg-amber-500 text-white px-6 rounded-2xl font-black">
                      <CornerDownLeft size={20} />
                    </button>
                  )}
                </div>
                <div className="mt-6 flex gap-1 justify-center">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className={`h-2 flex-1 rounded-full transition-all duration-500 ${i < reviewCount ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-slate-100'}`}></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
