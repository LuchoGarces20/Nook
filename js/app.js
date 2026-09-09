import { store } from './store.js'; 
import { initNavigation } from './modules/navigation.js';  
import { initOnboarding } from './modules/onboarding.js';  
import { initHome } from './modules/home.js';  
import { initLists } from './modules/lists.js';  
import { initAgenda } from './modules/agenda.js';  
import { initGoals } from './modules/goals.js';  
import { initFinances } from './modules/finances.js';  
import { initSettings } from './modules/settings.js';  

document.addEventListener('DOMContentLoaded', async () => {      
    // Tenta carregar os dados do Supabase sem travar a interface se falhar
    try {
        await store.init();
    } catch (err) {
        console.error("Aviso: Falha ao carregar dados do Supabase", err);
    }

    // Inicializa os módulos e telas
    initNavigation();      
    initOnboarding();      
    initHome();      
    initLists();      
    initAgenda();      
    initGoals();      
    initFinances();      
    initSettings();  

    // Registrar Service Worker para suporte a PWA
    if ('serviceWorker' in navigator) {     
        window.addEventListener('load', () => {         
            navigator.serviceWorker.register('./sw.js')             
                .then(reg => console.log('Service Worker registrado:', reg.scope))             
                .catch(err => console.warn('Erro ao registrar Service Worker:', err));     
        });
    }
});