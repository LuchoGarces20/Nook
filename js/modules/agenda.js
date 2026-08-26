import { store } from '../store.js';
import { triggerHaptic, getLocalDateString, getInitials, escapeHTML } from '../utils.js';

let selectedDateStr = getLocalDateString(new Date());

const renderDateScroller = () => {
    const scrollerEl = document.getElementById('agenda-date-scroller');
    if (!scrollerEl) return;
    scrollerEl.innerHTML = '';
    
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const baseDate = new Date(y, m - 1, d);

    for (let i = -4; i <= 10; i++) {
        const tempDate = new Date(baseDate);
        tempDate.setDate(baseDate.getDate() + i);
        const dateStr = getLocalDateString(tempDate);
        const hasEvent = store.agenda.some(ev => ev.date === dateStr);
        
        const bubble = document.createElement('div');
        bubble.className = `date-bubble ${dateStr === selectedDateStr ? 'active' : ''} ${hasEvent ? 'has-events' : ''}`;
        bubble.innerHTML = `<span class="day-name">${diasSemana[tempDate.getDay()]}</span><span class="day-number">${tempDate.getDate()}</span><div class="event-dot"></div>`;
        
        bubble.addEventListener('click', () => {
            triggerHaptic(10);
            selectedDateStr = dateStr;
            renderDateScroller(); 
            renderAgendaView(); 
            bubble.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        });
        scrollerEl.appendChild(bubble);
    }
};

const renderAgendaView = () => {
    const selectedListEl = document.getElementById('agenda-selected-list');
    const allListEl = document.getElementById('agenda-all-list');
    if (!selectedListEl || !allListEl) return;

    selectedListEl.innerHTML = ''; allListEl.innerHTML = '';
    const [y, m, d] = selectedDateStr.split('-');
    const todayStr = getLocalDateString(new Date());
    document.getElementById('agenda-selected-title').textContent = selectedDateStr === todayStr ? `HOJE - ${d}/${m}/${y}` : `DIA SELECIONADO - ${d}/${m}/${y}`;

    const p1Init = store.profile ? getInitials(store.profile.p1) : 'IS';
    const p2Init = store.profile ? getInitials(store.profile.p2) : 'VO';

    const createEl = (ev, showBadge) => {
        let displayOwner = ev.owner;
        if (ev.owner === 'VO') displayOwner = p2Init;
        if (ev.owner === 'IS') displayOwner = p1Init;
        let badgeClass = (ev.owner === 'VO' || ev.owner === p2Init) ? 'bg-muted' : '';
        if (ev.owner === 'Casal') { badgeClass = 'bg-casal'; displayOwner = 'NOS'; }

        const safeTitle = escapeHTML(ev.title);
        const safeSubtitle = ev.subtitle ? escapeHTML(ev.subtitle) : '';

        const [ey, em, ed] = ev.date.split('-');
        const dateTag = showBadge ? `<span style="font-size: 0.75rem; background: var(--primary-light); color: var(--primary); padding: 2px 6px; border-radius: 6px; font-weight: 700; margin-right: 6px;">${ed}/${em}</span>` : '';
        
        const li = document.createElement('li');
        li.className = 'task-item';
        li.innerHTML = `
            <div class="task-text">
                <strong style="font-size: 0.95rem; color: var(--text-main);">${safeTitle}</strong>
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">${dateTag} - ${ev.time} ${safeSubtitle ? '- ' + safeSubtitle : ''}</div>
            </div>
            <div class="task-badge ${badgeClass}">${displayOwner}</div>
            <button class="btn-delete-event"><i class="ph ph-trash"></i></button>
        `;
        li.querySelector('.btn-delete-event').addEventListener('click', () => {
            triggerHaptic(20);
            store.setAgenda(store.agenda.filter(e => e.id !== ev.id));
            renderDateScroller(); renderAgendaView();
        });
        return li;
    };

    const selectedEvents = store.agenda.filter(ev => ev.date === selectedDateStr).sort((a, b) => a.time.localeCompare(b.time));
    if (selectedEvents.length === 0) selectedListEl.innerHTML = `<li style="text-align:center; padding: 20px 0; color: var(--text-muted); font-size: 0.88rem;">Dia livre!</li>`;
    else selectedEvents.forEach(ev => selectedListEl.appendChild(createEl(ev, false)));

    const futureEvents = store.agenda.filter(ev => ev.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    if (futureEvents.length === 0) allListEl.innerHTML = `<li style="text-align:center; padding: 20px 0; color: var(--text-muted); font-size: 0.88rem;">Nenhum compromisso agendado para o futuro.</li>`;
    else futureEvents.forEach(ev => allListEl.appendChild(createEl(ev, true)));
};

export const initAgenda = () => {
    document.getElementById('btn-go-today')?.addEventListener('click', () => {
        selectedDateStr = getLocalDateString(new Date());
        renderDateScroller(); renderAgendaView();
        triggerHaptic(15);
    });

    const form = document.getElementById('form-add-event');
    const overlay = document.getElementById('event-modal-overlay');
    const sheet = document.getElementById('event-bottom-sheet');
    const closeModal = () => { overlay.classList.remove('active'); sheet.classList.remove('active'); form?.reset(); };

    document.getElementById('btn-open-event-modal')?.addEventListener('click', () => {
        triggerHaptic(10); overlay.classList.add('active'); sheet.classList.add('active');
        document.getElementById('event-date').value = selectedDateStr;
    });
    
    document.getElementById('btn-close-event-modal')?.addEventListener('click', closeModal);

    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        store.setAgenda([...store.agenda, {
            id: Date.now(),
            title: document.getElementById('event-title').value,
            date: document.getElementById('event-date').value,
            time: document.getElementById('event-time').value,
            owner: document.getElementById('event-owner').value,
            subtitle: document.getElementById('event-subtitle').value
        }]);
        renderDateScroller(); renderAgendaView(); triggerHaptic(30); closeModal();
    });

    renderDateScroller(); renderAgendaView();
};