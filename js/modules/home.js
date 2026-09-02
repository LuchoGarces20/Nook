import { store } from '../store.js';
import { getLocalDateString, escapeHTML, getInitials, triggerHaptic } from '../utils.js';

// Opções disponíveis de humor
const MOODS = [
    { id: 'energia', icon: '🔋', label: 'Cheio(a) de energia' },
    { id: 'cansado', icon: '😴', label: 'Cansado(a)' },
    { id: 'lanche', icon: '🍕', label: 'Querendo lanche' },
    { id: 'apaixonado', icon: '❤️', label: 'Apaixonado(a)' },
    { id: 'estresse', icon: '🤯', label: 'Estressado(a)' },
    { id: 'feliz', icon: '✨', label: 'Feliz da vida' }
];

let targetPerson = 'p1'; // Variável para saber quem estamos editando (p1 ou p2)

export const renderHome = () => {
    if (!store.profile) return;
    const p1Init = getInitials(store.profile.p1);
    const p2Init = getInitials(store.profile.p2);

    // 1. Saudação e Dias Juntos
    const greetingElement = document.getElementById('dynamic-greeting');
    if (greetingElement) {
        const hour = new Date().getHours();
        const day = new Date().getDay(); 
        
        let text = "Boa noite! Descansem";
        if (day === 5 && hour > 17) text = `Sextou, ${store.profile.p1} e ${store.profile.p2}!`;
        else if (day === 0 && hour < 12) text = "Domingo de preguiça!";
        else if (hour >= 5 && hour < 12) text = "Bom dia, amores!";
        else if (hour >= 12 && hour < 18) text = "Boa tarde!";
        greetingElement.textContent = text;
    }

    const daysElement = document.getElementById('days-together');
    if (daysElement && store.profile.startDate) {
        const [year, month, day] = store.profile.startDate.split('-').map(Number);
        const startDate = new Date(year, month - 1, day); 
        const today = new Date();
        const diffDays = Math.ceil(Math.abs(today - startDate) / (1000 * 60 * 60 * 24)); 
        daysElement.textContent = diffDays;
    }

    // --- 2. MOOD TRACKER (LÓGICA) ---
    const todayStr = getLocalDateString(new Date());
    
    // Se a data do banco for diferente de hoje, "reseta" os humores para o novo dia
    if (!store.moods || store.moods.date !== todayStr) {
        store.setMoods({ p1: null, p2: null, date: todayStr });
    }

    // Preenche a UI do Humor de P1
    if (document.getElementById('mood-avatar-p1')) {
        document.getElementById('mood-avatar-p1').textContent = p1Init;
        if (store.moods.p1) {
            const moodData = MOODS.find(m => m.id === store.moods.p1);
            if (moodData) {
                document.getElementById('mood-icon-p1').textContent = moodData.icon;
                document.getElementById('mood-text-p1').textContent = moodData.label;
                document.getElementById('mood-text-p1').style.color = 'var(--text-main)';
                document.getElementById('mood-text-p1').style.fontWeight = '600';
            }
        } else {
            document.getElementById('mood-icon-p1').textContent = '☁️';
            document.getElementById('mood-text-p1').textContent = 'Como você está?';
            document.getElementById('mood-text-p1').style.color = 'var(--text-muted)';
            document.getElementById('mood-text-p1').style.fontWeight = 'normal';
        }
    }

    // Preenche a UI do Humor de P2
    if (document.getElementById('mood-avatar-p2')) {
        document.getElementById('mood-avatar-p2').textContent = p2Init;
        if (store.moods.p2) {
            const moodData = MOODS.find(m => m.id === store.moods.p2);
            if (moodData) {
                document.getElementById('mood-icon-p2').textContent = moodData.icon;
                document.getElementById('mood-text-p2').textContent = moodData.label;
                document.getElementById('mood-text-p2').style.color = 'var(--text-main)';
                document.getElementById('mood-text-p2').style.fontWeight = '600';
            }
        } else {
            document.getElementById('mood-icon-p2').textContent = '☁️';
            document.getElementById('mood-text-p2').textContent = 'E o parceiro(a)?';
            document.getElementById('mood-text-p2').style.color = 'var(--text-muted)';
            document.getElementById('mood-text-p2').style.fontWeight = 'normal';
        }
    }
    // -------------------------------

    // 3. Resumo de Tarefas Pendentes
    const tasksDesc = document.getElementById('home-tasks-desc');
    if (tasksDesc && store.lists) {
        let pendingCount = 0;
        store.lists.forEach(list => pendingCount += list.items.filter(i => !i.completed).length);
        
        if (pendingCount === 0) {
            tasksDesc.textContent = "Tudo em dia! ✨";
            tasksDesc.style.color = 'var(--text-muted)';
        } else {
            tasksDesc.textContent = `${pendingCount} item(s) nas suas listas`;
            tasksDesc.style.color = 'var(--text-main)';
        }
    }

    // 4. Alerta de Finanças (Próximos 5 dias)
    const finDesc = document.getElementById('home-fin-desc');
    const finIconBox = document.getElementById('home-fin-icon');
    const finIcon = finIconBox?.querySelector('i');
    if (finDesc && store.expenses) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 5);
        const futureStr = getLocalDateString(futureDate);

        const upcomingBills = store.expenses.filter(exp => exp.date >= todayStr && exp.date <= futureStr);
        
        if (upcomingBills.length > 0) {
            finDesc.textContent = `${upcomingBills.length} boleto(s) nos próximos 5 dias!`;
            finDesc.style.color = '#E63946'; finDesc.style.fontWeight = '700';
            if (finIconBox && finIcon) {
                finIconBox.style.background = 'rgba(230, 57, 70, 0.15)';
                finIcon.className = 'ph-fill ph-warning-circle'; finIcon.style.color = '#E63946';
            }
        } else {
            finDesc.textContent = "Tudo tranquilo na semana";
            finDesc.style.color = 'var(--text-muted)'; finDesc.style.fontWeight = 'normal';
            if (finIconBox && finIcon) {
                finIconBox.style.background = 'var(--pink-light)';
                finIcon.className = 'ph-fill ph-wallet text-pink'; finIcon.style.color = 'var(--pink-main)';
            }
        }
    }

    // 5. Mini-Agenda do Dia
    const agendaList = document.getElementById('home-agenda-list');
    if (agendaList) {
        agendaList.innerHTML = '';
        const todayEvents = store.agenda.filter(ev => ev.date === todayStr).sort((a, b) => a.time.localeCompare(b.time));

        if (todayEvents.length === 0) {
            agendaList.innerHTML = `<li style="text-align:center; padding: 32px 0; color: var(--text-muted); font-size: 0.9rem; border: none;"><i class="ph ph-coffee" style="font-size: 2.2rem; margin-bottom: 8px; display: block; color: rgba(224, 122, 95, 0.5)"></i>Dia livre para vocês curtirem!</li>`;
        } else {
            todayEvents.forEach(ev => {
                let displayOwner = ev.owner;
                if (ev.owner === 'VO') displayOwner = p2Init;
                if (ev.owner === 'IS') displayOwner = p1Init;
                let badgeClass = (ev.owner === 'VO' || ev.owner === p2Init) ? 'bg-muted' : '';
                if (ev.owner === 'Casal') { badgeClass = 'bg-casal'; displayOwner = 'NÓS'; }

                const safeTitle = escapeHTML(ev.title);
                const safeSubtitle = ev.subtitle ? escapeHTML(ev.subtitle) : '';
                
                const li = document.createElement('li');
                li.className = 'task-item';
                li.innerHTML = `
                    <div class="task-text">
                        <strong style="font-size: 0.95rem; color: var(--text-main);">${safeTitle}</strong>
                        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">${ev.time} ${safeSubtitle ? '- ' + safeSubtitle : ''}</div>
                    </div>
                    <div class="task-badge ${badgeClass}">${displayOwner}</div>
                `;
                agendaList.appendChild(li);
            });
        }
    }
};

// Configuração dos Eventos Iniciais da Home e Modais
export const initHome = () => {
    renderHome();

    // Redirecionamentos dos cards
    document.getElementById('home-tasks-card')?.addEventListener('click', () => {
        document.querySelector('.nav-item[data-target="view-lists"]')?.click();
    });
    document.getElementById('home-fin-card')?.addEventListener('click', () => {
        document.querySelector('.nav-item[data-target="view-finances"]')?.click();
    });

    // --- LÓGICA DO MODAL DE HUMOR ---
    const overlayMood = document.getElementById('mood-modal-overlay');
    const sheetMood = document.getElementById('mood-bottom-sheet');
    const optionsContainer = document.getElementById('mood-options-container');

    const closeMoodModal = () => {
        overlayMood?.classList.remove('active');
        sheetMood?.classList.remove('active');
    };

    const openMoodModal = (person) => {
        targetPerson = person;
        const p1Name = store.profile?.p1 || 'Você';
        const p2Name = store.profile?.p2 || 'Parceiro(a)';
        const nome = person === 'p1' ? p1Name : p2Name;
        
        const titleEl = document.getElementById('mood-modal-title');
        if (titleEl) titleEl.textContent = `Como ${nome} está hoje?`;
        
        triggerHaptic(10);
        overlayMood?.classList.add('active');
        sheetMood?.classList.add('active');
    };

    document.getElementById('btn-close-mood-modal')?.addEventListener('click', closeMoodModal);
    overlayMood?.addEventListener('click', closeMoodModal);

    document.getElementById('btn-mood-p1')?.addEventListener('click', () => openMoodModal('p1'));
    document.getElementById('btn-mood-p2')?.addEventListener('click', () => openMoodModal('p2'));

    if (optionsContainer) {
        optionsContainer.innerHTML = ''; // Limpa para evitar duplicação
        MOODS.forEach(mood => {
            const btn = document.createElement('div');
            btn.className = 'mood-option';
            btn.innerHTML = `<span class="emoji" style="font-size: 1.5rem;">${mood.icon}</span><span class="text" style="font-size: 1rem; font-weight: 600; color: var(--text-main);">${mood.label}</span>`;
            
            btn.addEventListener('click', () => {
                const currentMoods = store.moods ? { ...store.moods } : { p1: null, p2: null, date: getLocalDateString(new Date()) };
                currentMoods[targetPerson] = mood.id; 
                store.setMoods(currentMoods);
                
                triggerHaptic(30);
                renderHome(); 
                closeMoodModal(); 
            });
            optionsContainer.appendChild(btn);
        });
    }
};