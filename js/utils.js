import { store } from './store.js';

export const triggerHaptic = (ms = 15) => {
    if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(ms);
    }
};

export const getInitials = (name) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.trim().slice(0, 2).toUpperCase();
};

export const formatCurrency = (val) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const getLocalDateString = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const escapeHTML = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])
    );
};

export const getAvatarHtml = (ownerId, size = '28px') => {
    const profile = store.profile || {};
    
    if (ownerId === 'Casal') {
        return `<div class="task-badge bg-casal" style="width: ${size}; height: ${size}; font-size: 0.65rem;">NÓS</div>`;
    }
    const isP1 = ownerId === 'IS' || ownerId === 'p1' || ownerId === profile.p1;
    const name = isP1 ? (profile.p1 || 'P1') : (profile.p2 || 'P2');
    const avatarData = isP1 ? profile.avatarP1 : profile.avatarP2;
    const initials = getInitials(name);
    const baseClass = isP1 ? 'my-avatar' : 'partner-avatar';
    
    if (avatarData && avatarData.startsWith('data:image')) {
        return `<div class="task-badge has-photo ${baseClass}" style="width: ${size}; height: ${size}; background-image: url('${avatarData}');"></div>`;
    } else if (avatarData) {
        return `<div class="task-badge ${baseClass}" style="width: ${size}; height: ${size}; font-size: 1.1rem; border: none; background: transparent;">${avatarData}</div>`;
    } else {
        return `<div class="task-badge ${baseClass}" style="width: ${size}; height: ${size}; font-size: 0.75rem;">${initials}</div>`;
    }
};

// Verifica se há campos de texto ou números preenchidos pelo usuário
export const hasUnsavedChanges = () => {
    const activeBottomSheet = document.querySelector('.bottom-sheet.active');
    if (!activeBottomSheet) return false;

    // Analisa campos onde o usuário realmente digita conteúdo
    const inputs = activeBottomSheet.querySelectorAll('input[type="text"], input[type="number"], textarea');
    for (const input of inputs) {
        if (input.value && input.value.trim() !== '') {
            return true;
        }
    }
    return false;
};

export const openModal = (modalId) => {
    triggerHaptic(10);
    document.getElementById('general-overlay')?.classList.add('active');
    document.getElementById(modalId)?.classList.add('active');
};

export const closeAllModals = (force = false) => {
    // Se 'force' não for explicitamente true, verifica se há dados não salvos
    if (force !== true && hasUnsavedChanges()) {
        const confirmar = window.confirm("Você tem alterações não salvas neste formulário. Deseja realmente descartar os dados?");
        if (!confirmar) return; // Cancela o fechamento se o usuário escolher ficar
    }
    document.getElementById('general-overlay')?.classList.remove('active');
    document.querySelectorAll('.bottom-sheet').forEach(sheet => sheet.classList.remove('active'));
};