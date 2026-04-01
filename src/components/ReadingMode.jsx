import { useState, useEffect, useRef } from 'react';
import { playAudio } from '../utils/tts';

export default function ReadingMode({ list, pauseSeconds, speed, selectedVoice, selectedVoiceEn, isPaused, repetitions = 1, isReversed = false }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState('INIT'); // INIT, QUESTION, PAUSE, ANSWER, DONE
  const cycleIdRef = useRef(0);
  const timeoutRef = useRef(null);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isPausedRef.current = isPaused;
    if (isPaused) {
      window.speechSynthesis.pause();
    } else {
      window.speechSynthesis.resume();
    }
  }, [isPaused]);

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
        await new Promise(r => { timeoutRef.current = setTimeout(r, stepMs); });
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

    const card = list[index];

    // Lógica Inversa
    const questionText = isReversed ? card.back : card.front;
    const questionLang = isReversed ? 'en-US' : 'es-ES';
    const questionVoice = isReversed ? selectedVoiceEn : selectedVoice;

    const answerText = isReversed ? card.front : card.back;
    const answerLang = isReversed ? 'es-ES' : 'en-US';
    const answerVoice = isReversed ? selectedVoice : selectedVoiceEn;

    // Wait if paused before starting
    await waitWhilePaused(cycleId);
    if (cycleId !== cycleIdRef.current) return;

    // 1. Reproducir Pregunta
    setStep('QUESTION');
    await playAudio(questionText, questionLang, speed, questionVoice);
    if (cycleId !== cycleIdRef.current) return;

    await waitWhilePaused(cycleId);
    if (cycleId !== cycleIdRef.current) return;

    // 2. Pausa
    setStep('PAUSE');
    await pausableDelay(pauseSeconds * 1000, cycleId);
    if (cycleId !== cycleIdRef.current) return;

    // 3. Reproducir Respuesta Base
    setStep('ANSWER');
    await playAudio(answerText, answerLang, speed, answerVoice);
    if (cycleId !== cycleIdRef.current) return;
    
    await waitWhilePaused(cycleId);
    if (cycleId !== cycleIdRef.current) return;

    // 4. Repeticiones extra
    for (let i = 0; i < repetitions; i++) {
        setStep('HIDE_ANSWER');
        await pausableDelay(2000, cycleId);
        if (cycleId !== cycleIdRef.current) return;

        setStep('ANSWER');
        await playAudio(answerText, answerLang, speed, answerVoice);
        if (cycleId !== cycleIdRef.current) return;
        
        await waitWhilePaused(cycleId);
        if (cycleId !== cycleIdRef.current) return;
    }

    // 5. Pausa final estricta de 2 segundos antes de la siguiente tarjeta
    setStep('HIDE_ANSWER');
    await pausableDelay(2000, cycleId);
    if (cycleId !== cycleIdRef.current) return;

    // Siguiente Tarjeta
    setCurrentIndex(index + 1);
    startCycle(index + 1, cycleId);
  }

  useEffect(() => {
    const currentCycleId = ++cycleIdRef.current;
    
    // Ensure synthesis is clear and not paused from a previous run
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume(); 

    startCycle(0, currentCycleId);
    return () => {
      window.speechSynthesis.cancel();
      clearTimeout(timeoutRef.current);
      cycleIdRef.current++; // invalidate cycle
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentCard = list[currentIndex] || {};
  const renderedQuestion = isReversed ? currentCard.back : currentCard.front;
  const renderedAnswer = isReversed ? currentCard.front : currentCard.back;

  if (step === 'DONE') {
    return (
      <div className="bg-white p-12 rounded-3xl text-center shadow-sm border border-slate-200">
        <h3 className="text-2xl font-bold text-primary-600 mb-2">¡Sesión completa!</h3>
        <p className="text-slate-500 font-medium">Saliendo...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-200 max-w-2xl mx-auto min-h-[400px] flex flex-col justify-center relative overflow-hidden">
      
      {/* Indicador superior */}
      <div className="absolute top-6 right-6 text-sm font-bold text-slate-400 bg-white p-1 rounded-full shadow-sm">
        <span className="text-primary-600 ml-2">{currentIndex + 1}</span> / <span className="mr-2">{list.length}</span>
      </div>

      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-bl-[100px] -z-10 opacity-60"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-50 rounded-tr-[50px] -z-10 opacity-60"></div>

      {isPaused && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-3xl animate-in fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-4 text-amber-600 border border-amber-100">
             <span className="font-bold text-xl uppercase tracking-wider">Estudio en Pausa</span>
             <p className="text-sm text-slate-500">Presiona "Reanudar" o la tecla P para continuar.</p>
          </div>
        </div>
      )}

      <div className="text-center relative z-10">
        <span className={`text-[10px] font-bold uppercase tracking-widest mb-4 block ${step === 'QUESTION' ? 'text-primary-500 animate-pulse' : 'text-slate-400'}`}>
          {step === 'QUESTION' ? '🔊 Escucha con atención' : (isReversed ? 'Inglés original' : 'Frase original')}
        </span>
        
        <p className={`text-4xl sm:text-5xl font-black leading-tight mb-8 transition-opacity ${step === 'QUESTION' ? 'opacity-100 text-slate-800' : 'opacity-60 text-slate-400'}`}>
          "{renderedQuestion}"
        </p>

        <div className={`transition-all duration-300 overflow-hidden ${step === 'ANSWER' ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="pt-8 border-t border-slate-100">
            <span className={`text-[10px] font-bold uppercase tracking-widest mb-4 block ${(step === 'ANSWER' && !isPaused) ? 'text-green-500 animate-pulse' : 'text-slate-400'}`}>
              {(step === 'ANSWER' && !isPaused) ? '🔊 Traducción' : 'Traducción'}
            </span>
            <p className={`text-3xl sm:text-4xl font-black text-primary-700 leading-tight ${isPaused ? 'opacity-50' : ''}`}>
              "{renderedAnswer}"
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
