import { store } from '../store.js';
import { getLocalDateString, escapeHTML, getInitials } from '../utils.js';

export const renderHome = () => {
    if (!store.profile) return;

    // 1. Saudação Dinâmica e Contador de Dias
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

    // 2. Resumo de Tarefas Pendentes
    const tasksDesc = document.getElementById('home-tasks-desc');
    if (tasksDesc && store.lists) {
        let pendingCount = 0;
        store.lists.forEach(list => {
            pendingCount += list.items.filter(i => !i.completed).length;
        });
        
        if (pendingCount === 0) {
            tasksDesc.textContent = "Tudo em dia! ✨";
            tasksDesc.style.color = 'var(--text-muted)';
        } else {
            tasksDesc.textContent = `${pendingCount} item(s) nas suas listas`;
            tasksDesc.style.color = 'var(--text-main)';
        }
    }

    // 3. Alerta de Finanças (Próximos 5 dias)
    const finDesc = document.getElementById('home-fin-desc');
    const finIconBox = document.getElementById('home-fin-icon');
    const finIcon = finIconBox?.querySelector('i');
    
    if (finDesc && store.expenses) {
        const todayStr = getLocalDateString(new Date());
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 5);
        const futureStr = getLocalDateString(futureDate);

        // Filtra contas cujo vencimento está entre hoje e os próximos 5 dias
        const upcomingBills = store.expenses.filter(exp => exp.date >= todayStr && exp.date <= futureStr);
        
        if (upcomingBills.length > 0) {
            finDesc.textContent = `${upcomingBills.length} boleto(s) nos próximos 5 dias!`;
            finDesc.style.color = '#E63946'; // Vermelho de alerta
            finDesc.style.fontWeight = '700';
            if (finIconBox && finIcon) {
                finIconBox.style.background = 'rgba(230, 57, 70, 0.15)';
                finIcon.className = 'ph-fill ph-warning-circle';
                finIcon.style.color = '#E63946';
            }
        } else {
            finDesc.textContent = "Tudo tranquilo na semana";
            finDesc.style.color = 'var(--text-muted)';
            finDesc.style.fontWeight = 'normal';
            if (finIconBox && finIcon) {
                finIconBox.style.background = 'var(--pink-light)';
                finIcon.className = 'ph-fill ph-wallet text-pink';
                finIcon.style.color = 'var(--pink-main)';
            }
        }
    }

    // 4. Mini-Agenda do Dia
    const agendaList = document.getElementById('home-agenda-list');
    if (agendaList) {
        agendaList.innerHTML = '';
        const todayStr = getLocalDateString(new Date());
        
        // Filtra apenas os eventos de HOJE e ordena por horário
        const todayEvents = store.agenda.filter(ev => ev.date === todayStr).sort((a, b) => a.time.localeCompare(b.time));

        const p1Init = store.profile ? getInitials(store.profile.p1) : 'IS';
        const p2Init = store.profile ? getInitials(store.profile.p2) : 'VO';

        if (todayEvents.length === 0) {
            agendaList.innerHTML = `
                <li style="text-align:center; padding: 32px 0; color: var(--text-muted); font-size: 0.9rem; border: none;">
                    <i class="ph ph-coffee" style="font-size: 2.2rem; margin-bottom: 8px; display: block; color: rgba(224, 122, 95, 0.5)"></i>
                    Dia livre para vocês curtirem!
                </li>
            `;
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
                        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
                            ${ev.time} ${safeSubtitle ? '- ' + safeSubtitle : ''}
                        </div>
                    </div>
                    <div class="task-badge ${badgeClass}">${displayOwner}</div>
                `;
                agendaList.appendChild(li);
            });
        }
    }
};

export const initHome = () => {
    renderHome();

    // UX: Clicar no card de tarefas leva para a aba de Listas
    const tasksCard = document.getElementById('home-tasks-card');
    tasksCard?.addEventListener('click', () => {
        document.querySelector('.nav-item[data-target="view-lists"]')?.click();
    });

    // UX: Clicar no card de finanças leva para a aba de Finanças
    const finCard = document.getElementById('home-fin-card');
    finCard?.addEventListener('click', () => {
        document.querySelector('.nav-item[data-target="view-finances"]')?.click();
    });
};