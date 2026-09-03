import { store } from '../store.js';
import { triggerHaptic } from '../utils.js';

export const applyTheme = (themeValue) => {
    // Avalia se deve ficar dark (se o usuário forçou 'dark' ou se é 'system' e o SO for dark)
    const isDark = themeValue === 'dark' || (themeValue === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

    // Atualiza o texto na lista de Ajustes
    const labelEl = document.getElementById('current-theme-label');
    if (labelEl) {
        if (themeValue === 'system') labelEl.textContent = 'Sistema';
        else if (themeValue === 'light') labelEl.textContent = 'Claro';
        else labelEl.textContent = 'Escuro';
    }
};

export const initSettings = () => {
    applyTheme(store.theme);

    // Escuta mudanças do sistema operacional caso esteja configurado como "Sistema"
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (store.theme === 'system') applyTheme('system');
    });

    // Lógica do Modal
    const btnOpen = document.getElementById('btn-open-theme-modal');
    const btnClose = document.getElementById('btn-close-theme-modal');
    const overlay = document.getElementById('theme-modal-overlay');
    const sheet = document.getElementById('theme-bottom-sheet');
    const themeBtns = document.querySelectorAll('.btn-theme-option');

    const openModal = () => {
        triggerHaptic(10);
        overlay?.classList.add('active');
        sheet?.classList.add('active');
        
        // Pinta o botão selecionado atual
        themeBtns.forEach(btn => {
            if (btn.getAttribute('data-theme-value') === store.theme) {
                btn.style.borderColor = 'var(--primary)';
                btn.style.color = 'var(--primary)';
                btn.style.fontWeight = '700';
            } else {
                btn.style.borderColor = 'var(--border-color)';
                btn.style.color = 'var(--text-main)';
                btn.style.fontWeight = 'normal';
            }
        });
    };

    const closeModal = () => {
        overlay?.classList.remove('active');
        sheet?.classList.remove('active');
    };

    btnOpen?.addEventListener('click', openModal);
    btnClose?.addEventListener('click', closeModal);
    overlay?.addEventListener('click', closeModal);

    // Eventos de clique nas opções de tema
    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            triggerHaptic(20);
            const newTheme = btn.getAttribute('data-theme-value');
            store.setTheme(newTheme);
            applyTheme(newTheme);
            closeModal();
        });
    });
};