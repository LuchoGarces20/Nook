import { store } from '../store.js';
import { getLocalDateString, escapeHTML, triggerHaptic, getAvatarHtml, openModal, closeAllModals, formatCurrency } from '../utils.js';

const MOODS = [
    { id: 'energia', icon: '⚡', label: 'Cheio(a) de energia' },
    { id: 'cansado', icon: '🥱', label: 'Cansado(a)' },
    { id: 'lanche', icon: '🍔', label: 'Querendo lanche' },
    { id: 'apaixonado', icon: '🥰', label: 'Apaixonado(a)' },
    { id: 'estresse', icon: '😤', label: 'Estressado(a)' },
    { id: 'feliz', icon: '✨', label: 'Feliz da vida' }
];

const PRESET_COVERS = [
    'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop'
];

let targetPerson = 'p1';

export const renderHome = () => {
    if (!store.profile) return;
     
    const heroEl = document.getElementById('main-hero');
    if (heroEl) {
        const cover = store.profile.heroCover || PRESET_COVERS[0];
        heroEl.style.backgroundImage = `url(${cover})`;
    }

    const greetingElement = document.getElementById('dynamic-greeting');
    if (greetingElement) {
        const hour = new Date().getHours();
        const day = new Date().getDay();
        let text = "Boa noite! Descansem";
        if (day === 5 && hour > 17) text = `Sextou, casal!`;
        else if (day === 0 && hour < 12) text = "Domingo de preguiça!";
        else if (hour >= 5 && hour < 12) text = "Bom dia, amores!";
        else if (hour >= 12 && hour < 18) text = "Boa tarde!";
        greetingElement.textContent = text;
    }

    const daysElement = document.getElementById('days-together');
    if (daysElement && store.profile.startDate) {
        const [year, month, day] = store.profile.startDate.split('-').map(Number);
        const startDate = new Date(year, month - 1, day);
        const diffDays = Math.ceil(Math.abs(new Date() - startDate) / (1000 * 60 * 60 * 24));
        daysElement.textContent = diffDays;
    }

    const todayStr = getLocalDateString(new Date());
    if (!store.moods || store.moods.date !== todayStr) {
        store.setMoods({ p1: null, p2: null, date: todayStr });
    }

    const renderMoodAvatar = (personId) => {
        document.getElementById(`home-avatar-${personId}`)?.replaceWith(
            Object.assign(document.createElement('div'), { outerHTML: getAvatarHtml(personId, '34px') })
        );
        document.getElementById(`mood-avatar-container-${personId}`)?.replaceChildren(
            Object.assign(document.createElement('div'), { innerHTML: getAvatarHtml(personId, '38px') }).firstChild
        );
                 
        const moodData = store.moods[personId] ? MOODS.find(m => m.id === store.moods[personId]) : null;
        if (moodData) {
            document.getElementById(`mood-icon-${personId}`).textContent = moodData.icon;
            document.getElementById(`mood-text-${personId}`).textContent = moodData.label;
            document.getElementById(`mood-text-${personId}`).style.cssText = 'color: var(--text-main); font-weight: 600;';
        }
    };
    renderMoodAvatar('p1');
    renderMoodAvatar('p2');

    // Resumo de Tarefas
    const pendingCount = (store.lists || []).reduce((acc, list) => acc + list.items.filter(i => !i.completed).length, 0);
    document.getElementById('home-tasks-desc').textContent = pendingCount === 0 ? "Tudo em dia!" : `${pendingCount} item(s)`;

    // Resumo de Finanças (Correção do "Calculando...")
    const pendingExpenses = (store.expenses || []).filter(e => !e.completed);
    const totalPendingAmount = pendingExpenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);
    const finDescEl = document.getElementById('home-fin-desc');
    if (finDescEl) {
        finDescEl.textContent = pendingExpenses.length === 0 ? "Tudo pago!" : `${formatCurrency(totalPendingAmount)} (${pendingExpenses.length} pendente)`;
    }

    const agendaList = document.getElementById('home-agenda-list');
    if (agendaList) {
        agendaList.innerHTML = '';
        const todayEvents = store.agenda.filter(ev => ev.date === todayStr).sort((a, b) => a.time.localeCompare(b.time));
        if (todayEvents.length === 0) {
            agendaList.innerHTML = `<li style="text-align:center; padding: 32px 0; color: var(--text-muted); font-size: 0.9rem; border: none;"><i class="ph ph-coffee" style="font-size: 2.2rem; margin-bottom: 8px; display: block; color: rgba(224, 122, 95, 0.5)"></i>Dia livre para vocês curtirem!</li>`;
        } else {
            todayEvents.forEach(ev => {
                const li = document.createElement('li');
                li.className = 'task-item';
                li.innerHTML = `
                    <div class="task-text">
                        <strong style="font-size: 0.95rem; color: var(--text-main);">${escapeHTML(ev.title)}</strong>
                        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">${ev.time}</div>
                    </div>
                    ${getAvatarHtml(ev.owner)}
                `;
                agendaList.appendChild(li);
            });
        }
    }
};

export const initHome = () => {
    renderHome();          

    document.getElementById('general-overlay')?.addEventListener('click', () => closeAllModals(false));
    document.querySelectorAll('.btn-close-modal').forEach(btn => btn.addEventListener('click', () => closeAllModals(false)));

    document.getElementById('home-tasks-card')?.addEventListener('click', () => {
        document.querySelector('.nav-item[data-target="view-lists"]')?.click();
    });
    document.getElementById('home-fin-card')?.addEventListener('click', () => {
        document.querySelector('.nav-item[data-target="view-finances"]')?.click();
    });

    document.getElementById('btn-edit-hero')?.addEventListener('click', () => {
        const grid = document.getElementById('hero-gallery-grid');
        grid.innerHTML = '';
        PRESET_COVERS.forEach(url => {
            const btn = document.createElement('div');
            btn.className = 'hero-preset';
            btn.style.backgroundImage = `url(${url})`;
            btn.addEventListener('click', () => {
                store.setProfile({ ...store.profile, heroCover: url });
                triggerHaptic(20); renderHome(); closeAllModals(true);
            });
            grid.appendChild(btn);
        });
        openModal('hero-bottom-sheet');
    });

    document.getElementById('btn-upload-hero')?.addEventListener('click', () => document.getElementById('file-hero-upload').click());
    document.getElementById('file-hero-upload')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                store.setProfile({ ...store.profile, heroCover: ev.target.result });
                triggerHaptic(30); renderHome(); closeAllModals(true);
            };
            reader.readAsDataURL(file);
        }
    });

    const optionsContainer = document.getElementById('mood-options-container');
    document.getElementById('btn-mood-p1')?.addEventListener('click', () => { targetPerson = 'p1'; openModal('mood-bottom-sheet'); });
    document.getElementById('btn-mood-p2')?.addEventListener('click', () => { targetPerson = 'p2'; openModal('mood-bottom-sheet'); });
    
    if (optionsContainer) {
        optionsContainer.innerHTML = '';
        MOODS.forEach(mood => {
            const btn = document.createElement('div');
            btn.className = 'mood-option';
            btn.innerHTML = `<span class="emoji" style="font-size: 1.5rem;">${mood.icon}</span><span class="text" style="font-size: 1rem; font-weight: 600;">${mood.label}</span>`;
            btn.addEventListener('click', () => {
                const currentMoods = store.moods ? { ...store.moods } : { p1: null, p2: null, date: getLocalDateString(new Date()) };
                currentMoods[targetPerson] = mood.id;
                store.setMoods(currentMoods);
                triggerHaptic(30); renderHome(); closeAllModals(true);
            });
            optionsContainer.appendChild(btn);
        });
    }
};