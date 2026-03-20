export function playAudio(text, lang, speed = 1, voiceURI = null) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      console.warn("Speech synthesis no esta soportado en el navegador.");
      resolve();
      return;
    }
    
    // Retraso para evitar el bug de "onend" inmediato en Chrome/Safari
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Asegurarse de que el objeto no sea limpiado por el Garbage Collector
      window._currentUtterance = utterance; 
      
      utterance.lang = lang; 
      utterance.rate = speed;
      
      if (voiceURI) {
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find(v => v.voiceURI === voiceURI);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }
      
      let hasResolved = false;
      const endAudio = () => {
        if (!hasResolved) {
          hasResolved = true;
          // Limpiar el guardavidas de Chrome
          if (window._ttsKeepAlive) clearInterval(window._ttsKeepAlive);
          resolve();
        }
      };

      utterance.onend = endAudio;
      utterance.onerror = (e) => {
        console.error("Audio error", e);
        endAudio();
      };
      
      window.speechSynthesis.speak(utterance);

      // Solución para el bug de Google Chrome que corta audios de más de 15 segundos
      window._ttsKeepAlive = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          clearInterval(window._ttsKeepAlive);
        } else {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 10000);
      
    }, 50);
  });
}

export function stopAudio() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
