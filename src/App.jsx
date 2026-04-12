import { useEffect } from 'react';
import { useAppStore } from './store/appStore';
import Home from './components/Home';
import TextCreator from './components/TextCreator';
import TextDetails from './components/TextDetails';
import StudySession from './components/StudySession';
import CsvGenerator from './components/CsvGenerator';
import JsonImporter from './components/JsonImporter';
import EasterEgg from './components/EasterEgg';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { LogOut, ShieldAlert } from 'lucide-react';

function App() {
  const { user, isAdmin, authInitialLoad, setUser, loadData, isLoaded, activeScreen } = useAppStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [setUser]);

  useEffect(() => {
    if (user) {
      // Registrar sesión cada vez que el usuario carga o recarga la página autenticada
      const logSession = async () => {
        try {
          await addDoc(collection(db, 'user_sessions'), {
            email: user.email,
            name: user.displayName || 'Usuario Desconocido',
            loginAt: serverTimestamp()
          });
        } catch (e) {
          console.error("Error al registrar la auditoría de sesión:", e);
        }
      };
      
      logSession();
      
      // Upon successful login, load data from Firestore
      loadData();
    }
  }, [user, loadData]);

  if (authInitialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-primary-200 rounded-full mb-4"></div>
          <p className="text-slate-500 font-medium">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // If there's no active user session, show login block
  if (!user) {
    return <Login />;
  }

  // If user exists but texts are still strictly loading, show loading block
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-primary-200 rounded-full mb-4"></div>
          <p className="text-slate-500 font-medium">Sincronizando biblioteca desde la nube...</p>
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
            <h1 className="text-xl font-bold text-slate-800 tracking-tight hidden sm:block">Study App</h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
             {isAdmin && (
               <button 
                 onClick={() => useAppStore.getState().navigate('ADMIN_PANEL')}
                 className="flex items-center gap-1.5 bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-700 font-bold px-3 py-1.5 rounded-full border border-slate-200 transition-colors text-[10px] sm:text-xs tracking-wider uppercase"
                 title="Panel de Administración"
               >
                 <ShieldAlert size={14} /> <span className="hidden sm:inline">Admin</span>
               </button>
             )}
             <div className="flex items-center gap-3 bg-slate-50 pl-2 pr-4 py-1.5 rounded-full border border-slate-200">
                <img 
                  src={user.photoURL || 'https://ui-avatars.com/api/?name=User'} 
                  alt="Perfil" 
                  className="w-8 h-8 rounded-full border border-slate-300" 
                  referrerPolicy="no-referrer"
                />
                <div className="hidden sm:flex flex-col">
                  <div className="text-xs font-bold text-slate-700 max-w-[120px] truncate leading-none">
                    {user.displayName || 'Usuario'}
                  </div>
                  <div className={`text-[9px] font-bold mt-1 inline-flex self-start px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {isAdmin ? 'Admin' : 'Estudiante'}
                  </div>
                </div>
                <button 
                  onClick={() => auth.signOut()}
                  className="ml-2 text-slate-400 hover:text-red-500 transition-colors p-1"
                  title="Cerrar sesión"
                >
                  <LogOut size={16} />
                </button>
             </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto p-4 py-8">
        {activeScreen === 'HOME' && <Home />}
        {activeScreen === 'APP_VIEW' && <AppLoader />}
        {activeScreen === 'ADMIN_PANEL' && <AdminPanel />}
        {activeScreen === 'CREATE_TEXT' && <TextCreator />}
        {activeScreen === 'TEXT_DETAILS' && <TextDetails />}
        {activeScreen === 'STUDY_SESSION' && <StudySession />}
        {activeScreen === 'GENERATE_CSV' && <CsvGenerator />}
        {activeScreen === 'IMPORT_JSON' && <JsonImporter />}
      </main>
      
      {/* Full screen routes that ignore global layout padding */}
      {activeScreen === 'EASTER_EGG' && <EasterEgg />}
    </div>
  );
}

export default App;
