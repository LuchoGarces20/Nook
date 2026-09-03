import { store } from '../store.js';
import { triggerHaptic, getInitials } from '../utils.js';
import { renderFinances } from './finances.js';
import { renderHome } from './home.js';

let tempAvatarP1 = null;
let tempAvatarP2 = null;
let currentTargetPerson = null; // Guarda quem abriu o menu de emoji (p1 ou p2)

// Lista curada de emojis para avatares (adicione ou remova como quiser!)
const EMOJI_LIST = [
    '🐶', '🐱', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', 
    '🐸', '🐵', '🐣', '🦉', '🐝', '🦄', '🌸', '🌻', '🌵', '🥑', 
    '🍔', '🍕', '🍩', '☕', '👽', '👻', '🤖', '👾', '👑', '💎', 
    '🚀', '🌙', '⭐', '🔥', '💖', '🦦', '🦥', '🦕', '🦖', '🐉'
];

export const renderAvatar = (elements, name, avatarData) => {
    elements.forEach(el => {
        if (!el) return;
        
        if (avatarData && avatarData.startsWith('data:image')) {
            el.textContent = '';
            el.style.backgroundImage = `url(${avatarData})`;
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center';
        } else if (avatarData) {
            el.textContent = avatarData;
            el.style.backgroundImage = 'none';
        } else {
            el.textContent = getInitials(name);
            el.style.backgroundImage = 'none';
        }
    });
};

export const updateProfileUI = () => {
    if (!store.profile) return;
    
    renderAvatar(document.querySelectorAll('.my-avatar'), store.profile.p1, store.profile.avatarP1);
    renderAvatar(document.querySelectorAll('.partner-avatar'), store.profile.p2, store.profile.avatarP2);

    const init1 = getInitials(store.profile.p1);
    const init2 = getInitials(store.profile.p2);

    const updateSelect = (selectId) => {
        const select = document.getElementById(selectId);
        if (!select) return;
        const optP1 = select.querySelector('option[value="IS"]');
        const optP2 = select.querySelector('option[value="VO"]');
        if (optP1) optP1.textContent = `${init1} (${store.profile.p1})`;
        if (optP2) optP2.textContent = `${init2} (${store.profile.p2})`;
    };
    updateSelect('event-owner');
    updateSelect('goal-owner');
    updateSelect('expense-owner');

    const finLabels = document.querySelectorAll('#fin-income-inputs label');
    if (finLabels.length >= 2) {
        finLabels[0].textContent = `${init1} (R$)`;
        finLabels[1].textContent = `${init2} (R$)`;
    }
};

const processImageFile = (file, callback) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxSize = 150; 
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxSize) { height *= maxSize / width; width = maxSize; }
            } else {
                if (height > maxSize) { width *= maxSize / height; height = maxSize; }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            callback(canvas.toDataURL('image/jpeg', 0.8)); 
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
};

// --- LÓGICA DO MODAL DE EMOJIS ---
const initEmojiPicker = () => {
    const overlay = document.getElementById('emoji-picker-overlay');
    const sheet = document.getElementById('emoji-picker-sheet');
    const grid = document.getElementById('emoji-grid');
    const btnClose = document.getElementById('btn-close-emoji-picker');

    // Preenche o modal com os emojis
    if (grid && grid.children.length === 0) {
        EMOJI_LIST.forEach(emoji => {
            const btn = document.createElement('button');
            btn.className = 'emoji-btn';
            btn.textContent = emoji;
            btn.addEventListener('click', () => {
                triggerHaptic(20);
                const inputName = document.getElementById(`onboarding-${currentTargetPerson}`);
                const preview = document.getElementById(`preview-${currentTargetPerson}`);
                
                if(currentTargetPerson === 'p1') tempAvatarP1 = emoji;
                else tempAvatarP2 = emoji;
                
                renderAvatar([preview], inputName.value, emoji);
                closeEmojiPicker();
            });
            grid.appendChild(btn);
        });
    }

    const closeEmojiPicker = () => {
        overlay?.classList.remove('active');
        sheet?.classList.remove('active');
        currentTargetPerson = null;
    };

    btnClose?.addEventListener('click', closeEmojiPicker);
    overlay?.addEventListener('click', closeEmojiPicker);
};

export const openEmojiPicker = (personId) => {
    currentTargetPerson = personId;
    triggerHaptic(10);
    document.getElementById('emoji-picker-overlay')?.classList.add('active');
    document.getElementById('emoji-picker-sheet')?.classList.add('active');
};
// ---------------------------------

const setupAvatarPicker = (personId) => {
    const btnFoto = document.getElementById(`btn-foto-${personId}`);
    const btnEmoji = document.getElementById(`btn-emoji-${personId}`);
    const fileInput = document.getElementById(`file-${personId}`);
    const preview = document.getElementById(`preview-${personId}`);
    const inputName = document.getElementById(`onboarding-${personId}`);

    inputName?.addEventListener('input', (e) => {
        const val = e.target.value;
        const currentAvatar = personId === 'p1' ? tempAvatarP1 : tempAvatarP2;
        if (!currentAvatar) renderAvatar([preview], val, null);
    });

    btnFoto?.addEventListener('click', () => fileInput.click());

    // Abre o Modal em vez do Prompt
    btnEmoji?.addEventListener('click', () => {
        openEmojiPicker(personId);
    });

    fileInput?.addEventListener('change', (e) => {
        processImageFile(e.target.files[0], (base64) => {
            if(personId === 'p1') tempAvatarP1 = base64;
            else tempAvatarP2 = base64;
            renderAvatar([preview], inputName.value, base64);
            triggerHaptic(20);
        });
    });
};

export const initOnboarding = () => {
    const onboardingView = document.getElementById('view-onboarding');
    const homeView = document.getElementById('view-home');
    const bottomBar = document.querySelector('.bottom-bar');
    const formOnboarding = document.getElementById('form-onboarding');
    const btnReopen = document.getElementById('btn-reopen-onboarding');
    const views = document.querySelectorAll('.view');

    const isProfileValid = store.profile?.p1 && store.profile?.p2 && store.profile?.startDate;

    views.forEach(v => v.classList.remove('active'));

    initEmojiPicker();
    setupAvatarPicker('p1');
    setupAvatarPicker('p2');

    if (!isProfileValid) {
        store.clearProfile();
        if (onboardingView) onboardingView.classList.add('active');
        if (bottomBar) bottomBar.classList.add('hidden');
    } else {
        if (homeView) homeView.classList.add('active');
        if (bottomBar) bottomBar.classList.remove('hidden');
        updateProfileUI();
        renderHome();
    }

    if (formOnboarding) {
        formOnboarding.addEventListener('submit', (e) => {
            e.preventDefault();
            const p1 = document.getElementById('onboarding-p1').value.trim();
            const p2 = document.getElementById('onboarding-p2').value.trim();
            const startDate = document.getElementById('onboarding-date').value;

            if (!p1 || !p2 || !startDate) return;

            store.setProfile({ 
                p1, 
                p2, 
                startDate,
                avatarP1: tempAvatarP1,
                avatarP2: tempAvatarP2
            });

            triggerHaptic(30);
            views.forEach(v => v.classList.remove('active'));
            if (homeView) homeView.classList.add('active');
            if (bottomBar) bottomBar.classList.remove('hidden');
            updateProfileUI();
            renderFinances(); 
            renderHome();
        });
    }

    if (btnReopen) {
        btnReopen.addEventListener('click', () => {
            triggerHaptic(10);
            if (store.profile) {
                document.getElementById('onboarding-p1').value = store.profile.p1;
                document.getElementById('onboarding-p2').value = store.profile.p2;
                document.getElementById('onboarding-date').value = store.profile.startDate;
                
                tempAvatarP1 = store.profile.avatarP1 || null;
                tempAvatarP2 = store.profile.avatarP2 || null;

                renderAvatar([document.getElementById('preview-p1')], store.profile.p1, tempAvatarP1);
                renderAvatar([document.getElementById('preview-p2')], store.profile.p2, tempAvatarP2);
            }
            views.forEach(v => v.classList.remove('active'));
            if (onboardingView) onboardingView.classList.add('active');
            if (bottomBar) bottomBar.classList.add('hidden');
        });
    }
};