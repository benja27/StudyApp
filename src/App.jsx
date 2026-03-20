import { useEffect } from 'react';
import { useAppStore } from './store/appStore';
import Home from './components/Home';
import TextCreator from './components/TextCreator';
import TextDetails from './components/TextDetails';
import StudySession from './components/StudySession';
import CsvGenerator from './components/CsvGenerator';
import EasterEgg from './components/EasterEgg';

function App() {
  const { loadData, isLoaded, activeScreen } = useAppStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-primary-200 rounded-full mb-4"></div>
          <p className="text-slate-500 font-medium">Cargando biblioteca...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary-100 selection:text-primary-900">
      <header className="bg-white border-b border-slate-200/60 sticky top-0 z-10 backdrop-blur-md bg-white/80">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary-600 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg leading-none">P</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Preparador de Textos</h1>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 py-8">
        {activeScreen === 'HOME' && <Home />}
        {activeScreen === 'CREATE_TEXT' && <TextCreator />}
        {activeScreen === 'TEXT_DETAILS' && <TextDetails />}
        {activeScreen === 'STUDY_SESSION' && <StudySession />}
        {activeScreen === 'GENERATE_CSV' && <CsvGenerator />}
      </main>
      
      {/* Full screen routes that ignore global layout padding */}
      {activeScreen === 'EASTER_EGG' && <EasterEgg />}
    </div>
  );
}

export default App;
