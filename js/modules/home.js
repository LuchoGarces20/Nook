// js/modules/home.js
import { store } from '../store.js';
import { getLocalDateString, escapeHTML, triggerHaptic, getAvatarHtml, openModal, closeAllModals, formatCurrency } from '../utils.js';

const MOODS = [
    { id: 'energia', icon: '⚡', label: 'Cheio(a) de energia' },
    { id: 'cansado', icon: '😴', label: 'Cansado(a)' },
    { id: 'lanche', icon: '🍔', label: 'Querendo lanche' },
    { id: 'apaixonado', icon: '🥰', label: 'Apaixonado(a)' },
    { id: 'estresse', icon: '🤯', label: 'Estressado(a)' },
    { id: 'feliz', icon: '😊', label: 'Feliz da vida' }
];

const PRESET_COVERS = [
    'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop'
];

let targetPerson = 'p1';

export const renderHome = () => {
    // 1. Capa Hero
    const heroEl = document.getElementById('main-hero');
    if (heroEl && store.profile) {
        const cover = store.profile.heroCover || PRESET_COVERS[0];
        heroEl.style.backgroundImage = `url(${cover})`;
    }

    // 2. Saudação Dinâmica
    const greetingElement = document.getElementById('dynamic-greeting');
    if (greetingElement) {
        const hour = new Date().getHours();
        const day = new Date().getDay();
        let text = "Boa noite! Descansem 🌙";
        if (day === 5 && hour > 17) text = "Sextou, casal! 🎉";
        else if (day === 0 && hour < 12) text = "Domingo de preguiça! ☕";
        else if (hour >= 5 && hour < 12) text = "Bom dia, amores! ☀️";
        else if (hour >= 12 && hour < 18) text = "Boa tarde! 👋";
        greetingElement.textContent = text;
    }

    // 3. Dias juntos
    const daysElement = document.getElementById('days-together');
    if (daysElement) {
        if (store.profile && store.profile.startDate) {
            const [year, month, day] = store.profile.startDate.split('-').map(Number);
            const startDate = new Date(year, month - 1, day);
            const diffDays = Math.max(0, Math.ceil(Math.abs(new Date() - startDate) / (1000 * 60 * 60 * 24)));
            daysElement.textContent = diffDays;
        } else {
            daysElement.textContent = '--';
        }
    }

    // 4. Avatares e Moods (Preserva seleções no mesmo dia)
    const todayStr = getLocalDateString(new Date());
    
    if (!store.moods) {
        store.moods = { p1: null, p2: null, date: todayStr };
    } else if (store.moods.date && store.moods.date !== todayStr) {
        // Reseta o humor somente quando virar o dia
        if (typeof store.setMoods === 'function') {
            store.setMoods({ p1: null, p2: null, date: todayStr });
        } else {
            store.moods = { p1: null, p2: null, date: todayStr };
        }
    } else {
        store.moods.date = todayStr;
    }

    // Identifica quem é o usuário atual e quem é o parceiro
    const myPersonId = typeof store.getLoggedUser === 'function' ? store.getLoggedUser() : 'p1';
    const partnerPersonId = myPersonId === 'p1' ? 'p2' : 'p1';

    const renderMoodCard = (slot, personId) => {
        const moodContainer = document.getElementById(`mood-avatar-container-${slot}`);
        if (moodContainer) {
            moodContainer.innerHTML = getAvatarHtml(personId, '38px');
        }

        const moodData = (store.moods && store.moods[personId]) ? MOODS.find(m => m.id === store.moods[personId]) : null;
        const iconEl = document.getElementById(`mood-icon-${slot}`);
        const textEl = document.getElementById(`mood-text-${slot}`);

        if (moodData) {
            if (iconEl) iconEl.textContent = moodData.icon;
            if (textEl) {
                textEl.textContent = moodData.label;
                textEl.style.cssText = 'color: var(--text-main); font-weight: 600;';
            }
        } else {
            if (iconEl) iconEl.textContent = '❓';
            if (textEl) {
                if (slot === 'p1') {
                    textEl.textContent = 'Como você está?';
                } else {
                    const partnerName = personId === 'p1' ? (store.profile?.p1 || 'Parceiro(a)') : (store.profile?.p2 || 'Parceiro(a)');
                    textEl.textContent = `Como ${partnerName} está?`;
                }
                textEl.style.cssText = 'color: var(--text-muted); font-size: 0.75rem;';
            }
        }
    };

    renderMoodCard('p1', myPersonId);
    renderMoodCard('p2', partnerPersonId);

    const cardP2 = document.getElementById('btn-mood-p2');
    if (cardP2) {
        cardP2.style.cursor = 'default';
    }

    // 5. Resumo das Tarefas Pendentes
    const tasksDescEl = document.getElementById('home-tasks-desc');
    if (tasksDescEl) {
        const pendingCount = (store.lists || []).reduce((acc, list) => {
            const items = list.items || [];
            return acc + items.filter(i => !i.completed).length;
        }, 0);
        tasksDescEl.textContent = pendingCount === 0 ? "Tudo em dia!" : `${pendingCount} item(s) pendente(s)`;
    }

    // 6. Resumo das Finanças
    const finDescEl = document.getElementById('home-fin-desc');
    if (finDescEl) {
        const pendingExpenses = (store.expenses || []).filter(e => !e.completed);
        const totalPendingAmount = pendingExpenses.reduce((acc, exp) => acc + (parseFloat(exp.amount) || 0), 0);
        finDescEl.textContent = pendingExpenses.length === 0 ? "Tudo pago!" : `${formatCurrency(totalPendingAmount)} (${pendingExpenses.length} pendente${pendingExpenses.length > 1 ? 's' : ''})`;
    }

    // 7. Agenda de Hoje
    const agendaList = document.getElementById('home-agenda-list');
    if (agendaList) {
        agendaList.innerHTML = '';
        const todayEvents = (store.agenda || [])
            .filter(ev => ev.date === todayStr)
            .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

        if (todayEvents.length === 0) {
            agendaList.innerHTML = `<li style="text-align:center; padding: 20px 0; color: var(--text-muted); font-size: 0.88rem; border: none;"><i class="ph ph-coffee" style="font-size: 2rem; margin-bottom: 6px; display: block; color: rgba(224, 122, 95, 0.5)"></i>Dia livre para vocês curtirem!</li>`;
        } else {
            todayEvents.forEach(ev => {
                const li = document.createElement('li');
                li.className = 'task-item';
                li.innerHTML = `
                    <div class="task-text">
                        <strong style="font-size: 0.95rem; color: var(--text-main);">${escapeHTML(ev.title)}</strong>
                        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">${ev.time || ''}</div>
                    </div>
                    ${getAvatarHtml(ev.owner)}
                `;
                agendaList.appendChild(li);
            });
        }
    }

    // 8. Cápsula do Tempo e Memórias
    renderMemoriesSection();
};

const renderMemoriesSection = () => {
    const capsuleContainer = document.getElementById('home-capsule-card');
    const memoriesGrid = document.getElementById('home-memories-grid');
    if (!memoriesGrid) return;
    memoriesGrid.innerHTML = '';
    const memories = store.memories || [];

    const today = new Date();
    const todayMonthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const capsuleMemory = memories.find(m => {
        if (!m.date) return false;
        const [y, mm, dd] = m.date.split('-');
        return `${mm}-${dd}` === todayMonthDay && Number(y) < today.getFullYear();
    });

    if (capsuleContainer) {
        if (capsuleMemory) {
            capsuleContainer.style.display = 'flex';
            const [y] = capsuleMemory.date.split('-');
            const diffAnos = today.getFullYear() - Number(y);
            document.getElementById('capsule-title').textContent = `Há ${diffAnos} ano${diffAnos > 1 ? 's' : ''} atrás...`;
            document.getElementById('capsule-text').textContent = capsuleMemory.title;
            if (capsuleMemory.photo) {
                document.getElementById('capsule-bg').style.backgroundImage = `url('${capsuleMemory.photo}')`;
            }
        } else {
            capsuleContainer.style.display = 'none';
        }
    }

    if (memories.length === 0) {
        memoriesGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 24px 12px; background: var(--card-bg); border-radius: var(--radius-lg); border: 1px dashed var(--border-color); color: var(--text-muted); font-size: 0.85rem;">
                <i class="ph ph-heart-break" style="font-size: 2rem; margin-bottom: 6px; color: var(--primary); display: block;"></i>
                Nenhuma memória registrada ainda.<br>Clique em "+ Nova Memória" para guardar um momento!
            </div>
        `;
    } else {
        const sortedMemories = [...memories].sort((a, b) => b.date.localeCompare(a.date));
        sortedMemories.forEach(mem => {
            const [y, m, d] = mem.date.split('-');
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.innerHTML = `
                <div class="memory-photo" style="background-image: url('${mem.photo || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=400'}')">
                    <span class="memory-date-badge">${d}/${m}/${y}</span>
                    <button class="btn-delete-memory" title="Apagar memória"><i class="ph ph-trash"></i></button>
                </div>
                <div class="memory-info">
                    <strong>${escapeHTML(mem.title)}</strong>
                    ${mem.note ? `<p>${escapeHTML(mem.note)}</p>` : ''}
                </div>
            `;
            card.querySelector('.btn-delete-memory').addEventListener('click', (e) => {
                e.stopPropagation();
                triggerHaptic(20);
                if (confirm('Deseja realmente apagar esta memória?')) {
                    store.setMemories(store.memories.filter(m => m.id !== mem.id));
                    renderHome();
                }
            });
            memoriesGrid.appendChild(card);
        });
    }
};

export const initHome = () => {
    // 1. Cliques nos cards de atalho
    document.getElementById('home-tasks-card')?.addEventListener('click', () => {
        triggerHaptic(10);
        document.querySelector('.nav-item[data-target="view-lists"]')?.click();
    });

    document.getElementById('home-fin-card')?.addEventListener('click', () => {
        triggerHaptic(10);
        document.querySelector('.nav-item[data-target="view-finances"]')?.click();
    });

    // 2. Eventos Globais de Modais
    document.getElementById('general-overlay')?.addEventListener('click', () => closeAllModals(false));
    document.querySelectorAll('.btn-close-modal').forEach(btn => btn.addEventListener('click', () => closeAllModals(false)));

    // 3. Trocar Capa Hero
    document.getElementById('btn-edit-hero')?.addEventListener('click', () => {
        const grid = document.getElementById('hero-gallery-grid');
        if (grid) {
            grid.innerHTML = '';
            PRESET_COVERS.forEach(url => {
                const btn = document.createElement('div');
                btn.className = 'hero-preset';
                btn.style.backgroundImage = `url(${url})`;
                btn.addEventListener('click', () => {
                    store.setProfile({ ...store.profile, heroCover: url });
                    triggerHaptic(20);
                    renderHome();
                    closeAllModals(true);
                });
                grid.appendChild(btn);
            });
        }
        openModal('hero-bottom-sheet');
    });

    document.getElementById('btn-upload-hero')?.addEventListener('click', () => document.getElementById('file-hero-upload')?.click());
    document.getElementById('file-hero-upload')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                store.setProfile({ ...store.profile, heroCover: ev.target.result });
                triggerHaptic(30);
                renderHome();
                closeAllModals(true);
            };
            reader.readAsDataURL(file);
        }
    });

    // 4. Mood Tracker Protegido
    const optionsContainer = document.getElementById('mood-options-container');
    
    document.getElementById('btn-mood-p1')?.addEventListener('click', () => { 
        targetPerson = typeof store.getLoggedUser === 'function' ? store.getLoggedUser() : 'p1'; 
        openModal('mood-bottom-sheet'); 
    });

    document.getElementById('btn-mood-p2')?.addEventListener('click', () => { 
        triggerHaptic(10);
        const myPersonId = typeof store.getLoggedUser === 'function' ? store.getLoggedUser() : 'p1';
        const partnerName = myPersonId === 'p1' ? (store.profile?.p2 || 'Seu parceiro') : (store.profile?.p1 || 'Seu parceiro');
        alert(`Apenas ${partnerName} pode atualizar o próprio humor!`);
    });

    if (optionsContainer) {
        optionsContainer.innerHTML = '';
        MOODS.forEach(mood => {
            const btn = document.createElement('div');
            btn.className = 'mood-option';
            btn.innerHTML = `<span class="emoji" style="font-size: 1.5rem;">${mood.icon}</span><span class="text" style="font-size: 1rem; font-weight: 600;">${mood.label}</span>`;
            btn.addEventListener('click', () => {
                const todayStr = getLocalDateString(new Date());
                const currentMoods = store.moods ? { ...store.moods } : { p1: null, p2: null, date: todayStr };
                
                currentMoods[targetPerson] = mood.id;
                currentMoods.date = todayStr; // Garante explicitamente a data de hoje
                
                if (typeof store.setMoods === 'function') {
                    store.setMoods(currentMoods);
                } else {
                    store.moods = currentMoods;
                }
                triggerHaptic(30);
                renderHome();
                closeAllModals(true);
            });
            optionsContainer.appendChild(btn);
        });
    }

    // 5. Modal & Cadastro de Memórias
    let memoryPhotoBase64 = null;
    document.getElementById('btn-open-memory-modal')?.addEventListener('click', () => {
        document.getElementById('form-add-memory')?.reset();
        const prev = document.getElementById('memory-photo-preview');
        if (prev) {
            prev.style.backgroundImage = 'none';
            prev.style.display = 'none';
        }
        memoryPhotoBase64 = null;
        const dateInput = document.getElementById('memory-date');
        if (dateInput) dateInput.value = getLocalDateString(new Date());
        openModal('memory-bottom-sheet');
    });

    document.getElementById('btn-upload-memory-photo')?.addEventListener('click', () => {
        document.getElementById('file-memory-photo')?.click();
    });

    document.getElementById('file-memory-photo')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                memoryPhotoBase64 = ev.target.result;
                const prev = document.getElementById('memory-photo-preview');
                if (prev) {
                    prev.style.backgroundImage = `url('${memoryPhotoBase64}')`;
                    prev.style.display = 'block';
                }
                triggerHaptic(20);
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('form-add-memory')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('memory-title').value.trim();
        const date = document.getElementById('memory-date').value;
        const note = document.getElementById('memory-note').value.trim();
        if (!title || !date) return;
        const newMemory = {
            id: Date.now(),
            title,
            date,
            note,
            photo: memoryPhotoBase64
        };
        store.setMemories([...store.memories, newMemory]);
        triggerHaptic(30);
        renderHome();
        closeAllModals(true);
    });

    renderHome();
};