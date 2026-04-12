import React from 'react';
import { useAppStore } from '../store/appStore';
import { ArrowLeft } from 'lucide-react';
import TiemposVerbalesApp from './TiemposVerbales/TiemposVerbalesApp';

export default function AppLoader() {
  const { apps, activeAppId, navigate } = useAppStore();
  const appData = apps.find(a => a.id === activeAppId);

  if (!appData) {
    return (
      <div className="text-center p-12">
        <p className="text-red-500 font-bold">App no encontrada.</p>
        <button onClick={() => navigate('HOME')} className="text-primary-600 mt-4 underline font-bold">Volver al Inicio</button>
      </div>
    );
  }

  const appNameLower = appData.name.toLowerCase().trim();

  const renderApp = () => {
    if (appNameLower === 'tiempos verbales') {
      return <TiemposVerbalesApp appData={appData} />;
    }
    
    return (
      <div className="bg-white p-12 rounded-2xl shadow-sm text-center border-2 border-dashed border-slate-200">
        <h3 className="text-xl font-bold text-slate-800 mb-2">App en construcción</h3>
        <p className="text-slate-500">"{appData.name}" aún no tiene código asignado.</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <button 
          onClick={() => navigate('HOME')} 
          className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded-full transition-colors flex-shrink-0"
        >
          <ArrowLeft size={24}/>
        </button>
        <h2 className="text-2xl font-bold text-slate-800">{appData.name}</h2>
      </div>
      {renderApp()}
    </div>
  );
}
