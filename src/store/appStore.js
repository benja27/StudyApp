import { create } from 'zustand';
import { storageStrategy } from '../services/storageStrategy';

export const useAppStore = create((set, get) => ({
  // Estado de Navegación
  activeScreen: 'HOME', // Posibles: 'HOME', 'CREATE_TEXT', 'TEXT_DETAILS', 'STUDY_SESSION'
  activeTextId: null,

  // Estado de Datos
  texts: [],
  isLoaded: false,

  // Estado de Sesión de Estudio
  studyList: [],

  // Acciones de Navegación
  navigate: (screen, extraState = {}) => set({ activeScreen: screen, ...extraState }),

  // Acciones de Datos
  loadData: async () => {
    const texts = await storageStrategy.fetchTexts();
    set({ texts, isLoaded: true });
  },

  saveText: async (newText) => {
    const { texts } = get();
    const updatedTexts = [newText, ...texts];
    await storageStrategy.saveTexts(updatedTexts);
    set({ texts: updatedTexts });
  },

  updateText: async (updatedText) => {
    const { texts } = get();
    const updatedTexts = texts.map(t => t.id === updatedText.id ? updatedText : t);
    await storageStrategy.saveTexts(updatedTexts);
    set({ texts: updatedTexts });
  },

  deleteText: async (id) => {
    const { texts } = get();
    const updatedTexts = texts.filter(t => t.id !== id);
    await storageStrategy.saveTexts(updatedTexts);
    set({ texts: updatedTexts });
  },

  // Acciones de Estudio
  startStudySession: (cards) => {
    set({ studyList: cards, activeScreen: 'STUDY_SESSION' });
  }
}));
