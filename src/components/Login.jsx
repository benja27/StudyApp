import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { LogIn } from 'lucide-react';

export default function Login() {
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      alert("Hubo un error al iniciar sesión. Intenta nuevamente.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-bl-full -z-10 opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-50 rounded-tr-full -z-10 opacity-60"></div>
        
        <div className="bg-primary-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6 transform rotate-3">
          <span className="text-white font-bold text-3xl leading-none">P</span>
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-2">Study App</h1>
        <p className="text-slate-500 mb-8 font-medium">Inicia sesión para acceder a tu biblioteca personal de estudio.</p>
        
        <button 
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-3 w-full bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-xl font-bold transition-all hover:-translate-y-1 shadow-md hover:shadow-lg"
        >
          <LogIn size={20} />
          Continuar con Google
        </button>
      </div>
    </div>
  );
}
