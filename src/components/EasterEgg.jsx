import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
// Intentar cargar michyyo.png si existe
import michyyo from '../assets/michyyo.png';

export default function EasterEgg() {
  const { navigate } = useAppStore();
  const [imgPos, setImgPos] = useState({ top: '50%', left: '50%' });

  useEffect(() => {
    // 5-second loop for image position
    const imgInterval = setInterval(() => {
      setImgPos({
        top: `${Math.random() * 80 + 10}%`,
        left: `${Math.random() * 80 + 10}%`
      });
    }, 5000);

    // Initial random positions
    setImgPos({ top: `${Math.random() * 80 + 10}%`, left: `${Math.random() * 80 + 10}%` });

    return () => clearInterval(imgInterval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 overflow-hidden flex items-center justify-center">
      {/* Neon background grid/gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-fuchsia-900/30 via-slate-900 to-black"></div>

      {/* Moving Image */}
      <div
        className="absolute pointer-events-none transition-all ease-in-out duration-1000 z-20 mix-blend-screen"
        style={{
          top: imgPos.top,
          left: imgPos.left,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <img 
          src={michyyo} 
          alt="Mich y yo"
          className="w-56 md:w-96 object-contain"
          style={{ animation: 'michLoop 5s infinite' }}
        />
      </div>

      {/* Salir Button */}
      <button 
        onClick={() => navigate('HOME')}
        className="absolute bottom-10 z-50 bg-slate-900 hover:bg-slate-800 text-white px-10 py-4 rounded-full font-bold border-2 border-fuchsia-500/50 backdrop-blur-md transition-all hover:scale-110 hover:shadow-[0_0_30px_rgba(217,70,239,0.6)] uppercase tracking-widest"
      >
        Salir
      </button>

      <style>{`
        @keyframes michLoop {
          0% { opacity: 0; transform: scale(0.2); filter: drop-shadow(0 0 0px transparent); }
          50% { opacity: 0.8; transform: scale(1.2); filter: drop-shadow(0 0 30px rgba(217,70,239,0.5)); }
          100% { opacity: 0; transform: scale(1.5) translate(30px, -30px); filter: drop-shadow(0 0 10px transparent); }
        }
        @keyframes neonPulseText {
          0% { opacity: 0.05; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
