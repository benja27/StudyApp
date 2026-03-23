import { create } from 'zustand';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';

export const useAppStore = create((set, get) => ({
  // Estado de Autenticación
  user: null,
  authInitialLoad: true,
  
  // Estado de Navegación
  activeScreen: 'HOME', // Posibles: 'HOME', 'CREATE_TEXT', 'TEXT_DETAILS', 'STUDY_SESSION', 'GENERATE_CSV', 'EASTER_EGG'
  activeTextId: null,

  // Estado de Datos
  texts: [],
  isLoaded: false,

  // Estado de Sesión de Estudio
  studyList: [],

  // Acciones de Auth
  setUser: (user) => set({ user, authInitialLoad: false }),

  // Acciones de Navegación
  navigate: (screen, extraState = {}) => set({ activeScreen: screen, ...extraState }),

  // Acciones de Datos (Firebase Firestore)
  loadData: async () => {
    const { user } = get();
    if (!user) return;
    
    try {
      const textsRef = collection(db, `users/${user.uid}/texts`);
      const snapshot = await getDocs(textsRef);
      const texts = snapshot.docs.map(doc => doc.data());
      
      // Ordenar textos por fecha si existe
      texts.sort((a,b) => {
        if(!a.date || !b.date) return 0;
        return new Date(b.date) - new Date(a.date);
      });

      set({ texts, isLoaded: true });
    } catch (error) {
      console.error("Error loading data from Firebase", error);
      set({ texts: [], isLoaded: true });
    }
  },

  saveText: async (newText) => {
    const { texts, user } = get();
    if (!user) return;
    
    const updatedTexts = [newText, ...texts];
    set({ texts: updatedTexts }); // Optimistic update
    
    try {
      if(!newText.id) newText.id = crypto.randomUUID(); // Fallback if no id
      const docRef = doc(db, `users/${user.uid}/texts`, newText.id);
      await setDoc(docRef, newText);
    } catch (e) {
      console.error("Error saving text to Firebase", e);
    }
  },

  updateText: async (updatedText) => {
    const { texts, user } = get();
    if (!user) return;
    
    const updatedTexts = texts.map(t => t.id === updatedText.id ? updatedText : t);
    set({ texts: updatedTexts }); // Optimistic update
    
    try {
      const docRef = doc(db, `users/${user.uid}/texts`, updatedText.id);
      await setDoc(docRef, updatedText);
    } catch (e) {
      console.error("Error updating text in Firebase", e);
    }
  },

  deleteText: async (id) => {
    const { texts, user } = get();
    if (!user) return;
    
    const updatedTexts = texts.filter(t => t.id !== id);
    set({ texts: updatedTexts }); // Optimistic update
    
    try {
      const docRef = doc(db, `users/${user.uid}/texts`, id);
      await deleteDoc(docRef);
    } catch (e) {
      console.error("Error deleting text from Firebase", e);
    }
  },

  // Acciones de Estudio
  startStudySession: (cards) => {
    set({ studyList: cards, activeScreen: 'STUDY_SESSION' });
  }
}));
