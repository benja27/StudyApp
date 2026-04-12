import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { db } from '../lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default function AdminPanel() {
  const { navigate, isAdmin } = useAppStore();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchSessions = async () => {
      try {
        const q = query(collection(db, 'user_sessions'), orderBy('loginAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSessions(data);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [isAdmin]);

  if (!isAdmin) {
    return <div className="text-center p-12 text-red-500">Acceso Denegado</div>;
  }

  // format date helper
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Generando...';
    // Firebase timestamp conversion
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 min-h-[500px]">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('HOME')} 
          className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded-full transition-colors flex-shrink-0"
        >
          <ArrowLeft size={24}/>
        </button>
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <ShieldAlert size={28} className="text-amber-500" /> Panel de Administración
           </h2>
           <p className="text-slate-500 text-sm">Control y Auditoría de la Plataforma</p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Registro de Entradas (Auditoría)</h3>
        
        {loading ? (
           <div className="animate-pulse text-slate-400 font-bold p-8 text-center">Cargando registros del servidor...</div>
        ) : sessions.length === 0 ? (
           <div className="text-slate-500 text-center p-8">No hay registros almacenados.</div>
        ) : (
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="border-b-2 border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                   <th className="p-3 font-bold">Correo (Email)</th>
                   <th className="p-3 font-bold">Nombre</th>
                   <th className="p-3 font-bold">Fecha y Hora Local</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {sessions.map(s => (
                   <tr key={s.id} className="hover:bg-slate-100 transition-colors text-sm text-slate-700">
                     <td className="p-3 font-medium bg-indigo-50/30 text-indigo-700 rounded-l-lg">{s.email}</td>
                     <td className="p-3">{s.name || 'Invitado'}</td>
                     <td className="p-3 text-slate-500 rounded-r-lg">{formatDate(s.loginAt)}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}
      </div>
    </div>
  );
}
