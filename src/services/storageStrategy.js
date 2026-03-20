// Capa de abstracción para el almacenamiento de datos.
// Actualmente usa localStorage, pero está diseñado con Promesas para facilitar
// la futura migración a Firebase Firestore u otro backend asíncrono.

const STORAGE_KEY = 'preparador_textos_data';

export const storageStrategy = {
  /**
   * Recupera todos los textos almacenados.
   * @returns {Promise<Array>}
   */
  async fetchTexts() {
    return new Promise((resolve) => {
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
          resolve(JSON.parse(data));
        } else {
          resolve([]);
        }
      } catch (error) {
        console.error("Error leyendo de LocalStorage:", error);
        resolve([]);
      }
    });
  },
  
  /**
   * Guarda la colección completa de textos.
   * @param {Array} texts 
   * @returns {Promise<void>}
   */
  async saveTexts(texts) {
    return new Promise((resolve, reject) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(texts));
        resolve();
      } catch (error) {
        console.error("Error guardando en LocalStorage:", error);
        reject(error);
      }
    });
  }
};
