import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { ArrowLeft, Play, Square, Settings2, ArrowRight } from 'lucide-react';
import ReadingMode from './ReadingMode';
import WritingMode from './WritingMode';

export default function StudySession() {
  const { studyList, navigate } = useAppStore();
  
  const [mode, setMode] = useState(null); // 'READING' or 'WRITING'
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Settings
  const [pauseSeconds, setPauseSeconds] = useState(3);
  const [speed, setSpeed] = useState(1.0);
  const [isRandom, setIsRandom] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
    // Exclude cards consisting only of a single period
    const validStudyList = studyList.filter(c => c.front.trim() !== '.' && c.back.trim() !== '.');
    
    if (isRandom) {
      setActiveList([...validStudyList].sort(() => Math.random() - 0.5));
    } else {
      setActiveList([...validStudyList]);
    }
  }, [studyList, isRandom]);

  const handleStop = () => {
    setIsPlaying(false);
    window.speechSynthesis.cancel();
  };

  const handleStart = (selectedMode) => {
    setMode(selectedMode);
    setIsPlaying(true);
  };

  // If no mode selected or stopped, show launcher
  if (!isPlaying) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('HOME')} 
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors bg-white px-4 py-2 rounded-full shadow-sm"
          >
            <ArrowLeft size={20} /> Volver a biblioteca
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-full transition-colors shadow-sm ${showSettings ? 'bg-primary-100 text-primary-600' : 'bg-white text-slate-500 hover:text-slate-800'}`}
          >
            <Settings2 size={24} />
          </button>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-bl-full -z-10 opacity-50"></div>
          
          <h2 className="text-3xl font-extrabold mb-2 text-slate-800">Modo de Estudio</h2>
          <p className="text-slate-500 mb-8 font-medium">Vas a estudiar <span className="text-primary-600 font-bold bg-primary-50 px-2 py-0.5 rounded-md">{studyList.length}</span> tarjetas.</p>
          
          {showSettings && (
            <div className="bg-slate-50 p-6 rounded-2xl text-left mb-8 border border-slate-200 animate-in fade-in slide-in-from-top-4">
              <h3 className="font-bold text-slate-700 mb-4 px-1">Configuración del motor</h3>
              <div className="grid sm:grid-cols-2 gap-6">
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
                <div className="sm:col-span-2 flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50" onClick={() => setIsRandom(!isRandom)}>
                  <div>
                    <span className="block text-sm font-bold text-slate-700">Orden Aleatorio</span>
                    <span className="text-xs text-slate-500">Mezcla las tarjetas de la lista en lugar de usando el orden original.</span>
                  </div>
                  <div className={`w-14 h-7 rounded-full relative transition-colors ${isRandom ? 'bg-primary-500' : 'bg-slate-200'}`}>
                    <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${isRandom ? 'left-8' : 'left-1'}`}></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <button 
              onClick={() => handleStart('READING')}
              className="flex flex-col items-center gap-4 bg-white hover:bg-primary-50 text-slate-700 hover:text-primary-700 p-8 rounded-2xl border-2 border-slate-100 hover:border-primary-200 transition-all group shadow-sm hover:shadow-md"
            >
              <div className="bg-primary-100 group-hover:bg-primary-600 p-4 rounded-full shadow-sm group-hover:scale-110 transition-all">
                <Play size={28} className="fill-primary-600 text-primary-600 group-hover:fill-white group-hover:text-white transition-colors" />
              </div>
              <div className="font-bold text-xl">Modo Lectura</div>
              <p className="text-sm text-slate-500 group-hover:text-primary-600/80 transition-colors">Escucha, pausa y repite en voz alta la traducción.</p>
            </button>
            <button 
              onClick={() => handleStart('WRITING')}
              className="flex flex-col items-center gap-4 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 p-8 rounded-2xl border-2 border-slate-100 hover:border-indigo-200 transition-all group shadow-sm hover:shadow-md"
            >
              <div className="bg-indigo-100 group-hover:bg-indigo-600 p-4 rounded-full shadow-sm group-hover:scale-110 transition-all">
                <ArrowRight size={28} className="text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              <div className="font-bold text-xl">Modo Escritura</div>
              <p className="text-sm text-slate-500 group-hover:text-indigo-600/80 transition-colors">Demuestra que sabes escribir la traducción sin errores.</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <button 
          onClick={handleStop} 
          className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl font-bold transition-colors"
        >
          <Square size={18} className="fill-red-600" /> Detener Estudio
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-widest hidden sm:inline-block">Modo Activo</span>
          <div className={`text-sm font-bold px-4 py-2 rounded-xl ${mode === 'READING' ? 'bg-primary-100 text-primary-700' : 'bg-indigo-100 text-indigo-700'}`}>
            {mode === 'READING' ? 'Lectura Automática' : 'Escritura Interactiva'}
          </div>
        </div>
      </div>

      {mode === 'READING' && (
        <ReadingMode 
          list={activeList} 
          pauseSeconds={pauseSeconds} 
          speed={speed} 
          selectedVoice={selectedVoice}
          selectedVoiceEn={selectedVoiceEn}
          onFinish={handleStop} 
        />
      )}
      
      {mode === 'WRITING' && (
        <WritingMode 
          list={activeList} 
          speed={speed} 
          selectedVoice={selectedVoice}
          selectedVoiceEn={selectedVoiceEn}
          onFinish={handleStop} 
        />
      )}
    </div>
  );
}
