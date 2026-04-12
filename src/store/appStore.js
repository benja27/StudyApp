import { create } from 'zustand';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, getDoc } from 'firebase/firestore';

const ADMIN_EMAIL = 'rksnek@gmail.com';

export const useAppStore = create((set, get) => ({
  // Estado de Autenticación
  user: null,
  isAdmin: false,
  authInitialLoad: true,
  
  // Estado de Navegación
  activeScreen: 'HOME', // Posibles: 'HOME', 'CREATE_TEXT', 'TEXT_DETAILS', 'STUDY_SESSION', 'GENERATE_CSV', 'EASTER_EGG'
  activeTextId: null,

  // Estado de Datos
  texts: [],
  collections: [],
  apps: [],
  activeLanguage: null,
  activeCategory: null,
  activeCollectionId: null,
  activeAppId: null,
  isLoaded: false,

  // Estado de Sesión de Estudio
  studyList: [],

  // Acciones de Auth
  setUser: (user) => {
    const isAdmin = user?.email === ADMIN_EMAIL;
    set({ user, isAdmin, authInitialLoad: false });
  },

  // Acciones de Navegación
  navigate: (screen, extraState = {}) => set({ activeScreen: screen, ...extraState }),
  setActiveLanguage: (lang) => set({ activeLanguage: lang, activeCategory: null, activeCollectionId: null, activeScreen: 'HOME' }),
  setActiveCategory: (cat) => set({ activeCategory: cat, activeCollectionId: null, activeScreen: 'HOME' }),
  setActiveCollection: (id) => set({ activeCollectionId: id, activeScreen: 'HOME' }),
  goBackHome: () => set({ activeLanguage: null, activeCategory: null, activeCollectionId: null, activeScreen: 'HOME' }),

  // Acciones de Datos (Firebase Firestore)
  saveCollection: async (collectionToSave) => {
    const { collections, user, isAdmin } = get();
    if (!user || !isAdmin) return;
    
    set({ collections: [...collections, collectionToSave] }); // Optimistic update
    
    try {
      if(!collectionToSave.id) collectionToSave.id = crypto.randomUUID(); // Fallback if no id
      const docRef = doc(db, `users/${user.uid}/collections`, collectionToSave.id);
      await setDoc(docRef, collectionToSave);
    } catch (e) {
      console.error("Error saving collection to Firebase", e);
    }
  },
  deleteCollection: async (id) => {
    const { collections, user, isAdmin } = get();
    if (!user || !isAdmin) return;
    
    const updatedCollections = collections.filter(c => c.id !== id);
    set({ collections: updatedCollections });
    
    try {
      const docRef = doc(db, `users/${user.uid}/collections`, id);
      await deleteDoc(docRef);
    } catch (e) {
      console.error("Error deleting collection from Firebase", e);
    }
  },
  saveApp: async (appToSave) => {
    const { apps, user, isAdmin } = get();
    if (!user || !isAdmin) return;
    
    set({ apps: [...apps, appToSave] }); // Optimistic update
    
    try {
      if(!appToSave.id) appToSave.id = crypto.randomUUID(); // Fallback if no id
      const docRef = doc(db, `users/${user.uid}/apps`, appToSave.id);
      await setDoc(docRef, appToSave);
    } catch (e) {
      console.error("Error saving app to Firebase", e);
    }
  },
  loadData: async () => {
    const { user, isAdmin } = get();
    if (!user) return;
    
    try {
      let targetUid = user.uid;

      if (isAdmin) {
        try {
          await setDoc(doc(db, 'settings', 'admin'), { uid: user.uid });
        } catch (e) {
          console.error("Error setting admin uid", e);
        }
      } else {
        try {
          const adminDoc = await getDoc(doc(db, 'settings', 'admin'));
          if (adminDoc.exists()) {
            targetUid = adminDoc.data().uid;
          } else {
            console.log("Admin has not logged in yet. No texts available.");
            set({ texts: [], isLoaded: true });
            return;
          }
        } catch(e) {
          console.error("Error fetching admin uid", e);
          set({ texts: [], isLoaded: true });
          return;
        }
      }

      // Cargar colecciones
      const collectionsRef = collection(db, `users/${targetUid}/collections`);
      const collSnapshot = await getDocs(collectionsRef);
      let collections = collSnapshot.docs.map(doc => doc.data());

      // Cargar apps
      const appsRef = collection(db, `users/${targetUid}/apps`);
      const appsSnapshot = await getDocs(appsRef);
      let apps = appsSnapshot.docs.map(doc => doc.data());

      // Cargar textos
      const textsRef = collection(db, `users/${targetUid}/texts`);
      const snapshot = await getDocs(textsRef);
      let texts = snapshot.docs.map(doc => doc.data());
      
      // MIGRACIÓN MÁGICA: Textos sin colección -> "english" -> "General"
      const unassignedTexts = texts.filter(t => !t.collectionId);
      if (unassignedTexts.length > 0) {
        let generalCollection = collections.find(c => c.language === 'english' && c.name.toLowerCase() === 'general');
        
        if (!generalCollection) {
          generalCollection = {
            id: 'english-general-default',
            language: 'english',
            name: 'General',
            createdAt: Date.now()
          };
          collections.push(generalCollection);
          if (isAdmin) {
            try {
              await setDoc(doc(db, `users/${user.uid}/collections`, generalCollection.id), generalCollection);
            } catch(e) { console.error("Error creating default collection", e); }
          }
        }

        // Asignar localmente la coleccion
        texts = texts.map(t => {
           if(!t.collectionId) {
             return { ...t, collectionId: generalCollection.id };
           }
           return t;
        });

        // Actualizar en DB sólo si es admin
        if (isAdmin) {
           unassignedTexts.forEach(async (t) => {
             try {
                const docRef = doc(db, `users/${user.uid}/texts`, t.id);
                await setDoc(docRef, { ...t, collectionId: generalCollection.id }, { merge: true });
             } catch(e) {}
           });
        }
      }

      // MIGRACIÓN ESPECÍFICA: Mover textos puntuales a "english -> Especifico"
      const specificTextTitles = ['aeromexico2', 'amex bienvenida 2', 'anuncio cabina'];
      const textsToMove = texts.filter(t => specificTextTitles.includes(t.title.toLowerCase()));

      if (textsToMove.length > 0) {
        let specificCollection = collections.find(c => c.language === 'english' && c.name.toLowerCase() === 'especifico');
        
        if (!specificCollection) {
          specificCollection = {
            id: 'english-especifico-default',
            language: 'english',
            name: 'Especifico',
            createdAt: Date.now()
          };
          collections.push(specificCollection);
          if (isAdmin) {
            try {
              await setDoc(doc(db, `users/${user.uid}/collections`, specificCollection.id), specificCollection);
            } catch(e) { console.error("Error creating especifico collection", e); }
          }
        }

        texts = texts.map(t => {
           if (specificTextTitles.includes(t.title.toLowerCase()) && t.collectionId !== specificCollection.id) {
               t.collectionId = specificCollection.id;
               if (isAdmin) {
                 try {
                   const docRef = doc(db, `users/${user.uid}/texts`, t.id);
                   setDoc(docRef, { ...t, collectionId: specificCollection.id }, { merge: true });
                 } catch(e) {}
               }
           }
           return t;
        });
      }

      if (!isAdmin) {
          texts = texts.filter(t => !t.isPrivate);
      }

      // Ordenar textos por fecha si existe
      texts.sort((a,b) => {
        if(!a.date || !b.date) return 0;
        return new Date(b.date) - new Date(a.date);
      });

      set({ texts, collections, apps, isLoaded: true });
    } catch (error) {
      console.error("Error loading data from Firebase", error);
      set({ texts: [], isLoaded: true });
    }
  },

  saveText: async (newText) => {
    const { texts, user, isAdmin } = get();
    if (!user || !isAdmin) return;
    
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
    const { texts, user, isAdmin } = get();
    if (!user || !isAdmin) return;
    
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
    const { texts, user, isAdmin } = get();
    if (!user || !isAdmin) return;
    
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
