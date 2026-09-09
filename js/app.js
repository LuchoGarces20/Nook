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
    const session = await store.checkSession();
    const views = document.querySelectorAll('.view');
    const bottomBar = document.querySelector('.bottom-bar');

    // Se não estiver logado, exibe apenas a tela de login
    if (!session) {
        views.forEach(v => v.classList.remove('active'));
        document.getElementById('view-login')?.classList.add('active');
        bottomBar?.classList.add('hidden');

        // Escuta o submit do formulário de login
        const loginForm = document.getElementById('form-login');
        loginForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email')?.value;
            const password = document.getElementById('login-password')?.value;
            const errEl = document.getElementById('login-error');
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            try {
                if (errEl) errEl.style.display = 'none';
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Entrando...';
                }
                await store.login(email, password);
                window.location.reload();
            } catch (err) {
                if (errEl) errEl.style.display = 'block';
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Entrar no Nook';
                }
            }
        });
        return;
    }

    // Se estiver logado, inicializa o app normalmente
    try {
        await store.init();
    } catch (err) {
        console.error("Aviso: Falha ao carregar dados", err);
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
        const registerSW = () => {
            navigator.serviceWorker.register('./sw.js')             
                .then(reg => console.log('Service Worker registrado:', reg.scope))             
                .catch(err => console.warn('Erro ao registrar Service Worker:', err));
        };

        if (document.readyState === 'complete') {
            registerSW();
        } else {
            window.addEventListener('load', registerSW);
        }
    }
});