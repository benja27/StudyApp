import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { ArrowLeft, Play, Square, Settings2, ArrowRight, Pause, RotateCcw } from 'lucide-react';
import ReadingMode from './ReadingMode';
import WritingMode from './WritingMode';

export default function StudySession() {
  const { studyList, navigate } = useAppStore();
  
  const [mode, setMode] = useState('READING'); // 'READING' or 'WRITING'
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionKey, setSessionKey] = useState(0); // To force remount on Restart
  const [selectedStars, setSelectedStars] = useState([1, 2, 3]);
  
  // Settings
  const [pauseSeconds, setPauseSeconds] = useState(3);
  const [speed, setSpeed] = useState(1.0);
  const [isRandom, setIsRandom] = useState(false);
  const [repetitions, setRepetitions] = useState(0); // 0 repeticiones extra por defecto
  const [isReversed, setIsReversed] = useState(false);
  const [voices, setVoices] = useState([]);
  const [enVoices, setEnVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [selectedVoiceEn, setSelectedVoiceEn] = useState('');

  // Active cards (shuffled if needed)
  const [activeList, setActiveList] = useState([]);

  useEffect(() => {
    if (!window.speechSynthesis) return;
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      const availableVoices = allVoices.filter(v => v.lang.startsWith('es'));
      const availableEnVoices = allVoices.filter(v => v.lang.startsWith('en'));
      
      setVoices(availableVoices);
      setEnVoices(availableEnVoices);
      
      if (availableVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(availableVoices[0].voiceURI);
      }
      if (availableEnVoices.length > 0 && !selectedVoiceEn) {
        setSelectedVoiceEn(availableEnVoices[0].voiceURI);
      }
    };
    
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoice, selectedVoiceEn]);

  useEffect(() => {
    // Exclude cards consisting only of a single period and filter by selected stars
    const validStudyList = studyList
      .filter(c => c.front.trim() !== '.' && c.back.trim() !== '.')
      .filter(c => selectedStars.includes(c.stars || 1));
    
    if (isRandom) {
      setActiveList([...validStudyList].sort(() => Math.random() - 0.5));
    } else {
      setActiveList([...validStudyList]);
    }
  }, [studyList, isRandom, selectedStars]);

  useEffect(() => {
    // Global keyboard listener for 'P' to pause/resume
    const handleKeyDown = (e) => {
      // Ignore if focus is on an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      
      if (e.key.toLowerCase() === 'p') {
        setIsPaused(prev => !prev);
      }
    };
    
    // Only listen if playing
    if (isPlaying) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isPlaying]);

  const handleStop = () => {
    setIsPlaying(false);
    setIsPaused(false);
    window.speechSynthesis.cancel();
  };

  const handleStart = () => {
    setIsPlaying(true);
    setIsPaused(false);
    setSessionKey(prev => prev + 1); // Ensure fresh start
  };
  
  const handlePauseResume = () => {
    setIsPaused(prev => !prev);
  };
  
  const handleRestart = () => {
    setIsPaused(false);
    window.speechSynthesis.cancel();
    setSessionKey(prev => prev + 1);
  };

  // If stopped, show configuration and start button
  if (!isPlaying) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('HOME')} 
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors bg-white px-4 py-2 rounded-full shadow-sm"
          >
            <ArrowLeft size={20} /> Volver a biblioteca
          </button>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-bl-full -z-10 opacity-50"></div>
          
          <h2 className="text-3xl font-extrabold mb-2 text-slate-800">Preparar Sesión</h2>
          <p className="text-slate-500 mb-8 font-medium">Vas a estudiar <span className="text-primary-600 font-bold bg-primary-50 px-2 py-0.5 rounded-md">{studyList.length}</span> tarjetas.</p>
          
          <div className="bg-slate-50 p-6 rounded-2xl text-left border border-slate-200 mb-8">
            <h3 className="font-bold text-slate-700 mb-4 px-1 flex items-center gap-2"><Settings2 size={20} /> Configuración del motor</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              
              <div className="sm:col-span-2 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <label className="block text-sm font-bold text-slate-600 mb-3">Modo de Estudio</label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => setMode('READING')}
                    className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${mode === 'READING' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-100 hover:border-slate-200 text-slate-500'}`}
                  >
                    <Play size={24} className={mode === 'READING' ? 'fill-primary-600' : ''} />
                    <span className="font-bold">Lectura</span>
                  </div>
                  <div 
                    onClick={() => setMode('WRITING')}
                    className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${mode === 'WRITING' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 hover:border-slate-200 text-slate-500'}`}
                  >
                    <ArrowRight size={24} />
                    <span className="font-bold">Escritura</span>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <label className="block text-sm font-bold text-slate-600 mb-3">Filtrar por dificultad</label>
                <div className="flex bg-slate-50 p-1 rounded-lg gap-2 border border-slate-100 w-fit sm:w-auto overflow-x-auto">
                  {[1, 2, 3].map(s => (
                    <button
                      key={s}
                      onClick={() => {
                        if (selectedStars.includes(s)) {
                          if (selectedStars.length > 1) setSelectedStars(selectedStars.filter(star => star !== s));
                        } else {
                          setSelectedStars([...selectedStars, s]);
                        }
                      }}
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${selectedStars.includes(s) ? 'bg-white text-primary-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-200 border border-transparent'}`}
                    >
                      {s} Estrella{s > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-slate-500 mt-3 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-500 inline-block"></span>
                  Tarjetas seleccionadas: <strong className="text-slate-700">{activeList.length}</strong> / {studyList.length}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <label className="block text-sm font-bold text-slate-600 mb-3">Tiempo de pausa (segundos)</label>
                <input 
                  type="range" min="1" max="30" step="0.5"
                  value={pauseSeconds} onChange={(e) => setPauseSeconds(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="text-right text-sm text-primary-600 font-black mt-2">{pauseSeconds.toFixed(1)}s</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <label className="block text-sm font-bold text-slate-600 mb-3">Velocidad de voz</label>
                <input 
                  type="range" min="0.5" max="3" step="0.1"
                  value={speed} onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="text-right text-sm text-primary-600 font-black mt-2">{speed.toFixed(1)}x</div>
              </div>
              <div className="sm:col-span-1 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <label className="block text-sm font-bold text-slate-600 mb-2">Voz en Español</label>
                <select 
                  value={selectedVoice} 
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-primary-500"
                >
                  {voices.map((v, i) => (
                    <option key={i} value={v.voiceURI}>{v.name} ({v.lang})</option>
                  ))}
                  {voices.length === 0 && <option value="">No hay voces disponibles</option>}
                </select>
              </div>
              <div className="sm:col-span-1 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <label className="block text-sm font-bold text-slate-600 mb-2">Voz en Inglés</label>
                <select 
                  value={selectedVoiceEn} 
                  onChange={(e) => setSelectedVoiceEn(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-primary-500"
                >
                  {enVoices.map((v, i) => (
                    <option key={i} value={v.voiceURI}>{v.name} ({v.lang})</option>
                  ))}
                  {enVoices.length === 0 && <option value="">No hay voces disponibles</option>}
                </select>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <label className="block text-sm font-bold text-slate-600 mb-3">Repeticiones extra de la respuesta</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" min="0" max="5" step="1"
                    value={repetitions} onChange={(e) => setRepetitions(Number(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                  <div className="w-8 text-right text-sm text-primary-600 font-black">+{repetitions}</div>
                </div>
              </div>

              <div className="sm:col-span-1 flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50" onClick={() => setIsRandom(!isRandom)}>
                <div>
                  <span className="block text-sm font-bold text-slate-700">Orden Aleatorio</span>
                  <span className="text-xs text-slate-500">Mezcla las tarjetas.</span>
                </div>
                <div className={`w-14 h-7 rounded-full relative transition-colors ${isRandom ? 'bg-primary-500' : 'bg-slate-200'}`}>
                  <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${isRandom ? 'left-8' : 'left-1'}`}></span>
                </div>
              </div>

              <div className="sm:col-span-1 flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50" onClick={() => setIsReversed(!isReversed)}>
                <div>
                  <span className="block text-sm font-bold text-slate-700">Modo Invertido</span>
                  <span className="text-xs text-slate-500">A partir de inglés.</span>
                </div>
                <div className={`w-14 h-7 rounded-full relative transition-colors ${isReversed ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                  <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${isReversed ? 'left-8' : 'left-1'}`}></span>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleStart}
            disabled={activeList.length === 0}
            className={`w-full py-4 rounded-2xl font-black text-xl text-white transition-transform hover:-translate-y-1 shadow-md hover:shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed ${mode === 'READING' ? 'bg-primary-600 hover:bg-primary-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            <Play size={24} className="fill-white" /> {activeList.length === 0 ? 'Sin Tarjetas Seleccionadas' : 'Iniciar Estudio Local'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200 gap-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={handleStop} 
            className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 p-3 rounded-xl transition-colors"
            title="Detener Estudio"
          >
            <Square size={20} className="fill-red-600" />
          </button>
          
          <button 
            onClick={handlePauseResume} 
            className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 px-4 py-2.5 rounded-xl font-bold transition-colors min-w-[140px] justify-center"
          >
            {isPaused ? <Play size={18} className="fill-amber-700" /> : <Pause size={18} className="fill-amber-700" />}
            {isPaused ? 'Reanudar' : 'Pausar'}
          </button>

          <button 
            onClick={handleRestart} 
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold transition-colors"
          >
            <RotateCcw size={18} /> Reiniciar
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-widest hidden sm:inline-block">Modo Activo</span>
          <div className={`text-sm font-bold px-4 py-2 rounded-xl ${mode === 'READING' ? 'bg-primary-100 text-primary-700' : 'bg-indigo-100 text-indigo-700'}`}>
            {mode === 'READING' ? 'Lectura Automática' : 'Escritura Interactiva'}
          </div>
        </div>
      </div>

      {mode === 'READING' && (
        <ReadingMode 
          key={sessionKey}
          list={activeList} 
          pauseSeconds={pauseSeconds} 
          speed={speed} 
          selectedVoice={selectedVoice}
          selectedVoiceEn={selectedVoiceEn}
          isPaused={isPaused}
          repetitions={repetitions}
          isReversed={isReversed}
          onFinish={handleStop} 
        />
      )}
      
      {mode === 'WRITING' && (
        <WritingMode 
          key={sessionKey}
          list={activeList} 
          speed={speed} 
          selectedVoice={selectedVoice}
          selectedVoiceEn={selectedVoiceEn}
          isPaused={isPaused}
          repetitions={repetitions}
          isReversed={isReversed}
          onFinish={handleStop} 
        />
      )}
    </div>
  );
}
