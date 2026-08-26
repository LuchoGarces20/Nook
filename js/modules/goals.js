import { store } from '../store.js';
import { triggerHaptic, formatCurrency, getInitials, escapeHTML } from '../utils.js';

export const renderGoals = () => {
    const goalsContainer = document.getElementById('goals-list-container');
    if (!goalsContainer) return;

    const p1Init = store.profile ? getInitials(store.profile.p1) : 'IS';
    const p2Init = store.profile ? getInitials(store.profile.p2) : 'VO';

    let totalSaved = 0;
    goalsContainer.innerHTML = '';

    if (store.goals.length === 0) {
        goalsContainer.innerHTML = `<div style="text-align:center; padding: 32px 0; color: var(--text-muted); font-size: 0.9rem;">Nenhuma meta cadastrada. Clique no + acima para comecar!</div>`;
    } else {
        store.goals.forEach(goal => {
            if (goal.type === 'financial') totalSaved += goal.current;
            
            // Proteção contra divisão por zero
            const percent = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
            
            let displayOwner = goal.owner;
            if (goal.owner === 'VO') displayOwner = p2Init;
            if (goal.owner === 'IS') displayOwner = p1Init;
            
            let badgeClass = (goal.owner === 'VO' || goal.owner === p2Init) ? 'bg-muted' : '';
            if (goal.owner === 'Casal') { badgeClass = 'bg-casal'; displayOwner = 'NOS'; }

            const safeTitle = escapeHTML(goal.title);
            const safeIcon = escapeHTML(goal.icon);
            const safeUnit = escapeHTML(goal.unit || 'vezes');

            const card = document.createElement('div');
            card.className = 'dash-card';
            card.style.cssText = 'flex-direction: column; align-items: flex-start; gap: 12px;';
            
            const textDetail = goal.type === 'financial' ? `${formatCurrency(goal.current)} de ${formatCurrency(goal.target)}` : `${goal.current} de ${goal.target} ${safeUnit}`;
            const actionBtn = goal.type === 'financial' 
                ? `<button class="btn-deposit btn-action-financial"><i class="ph ph-plus-circle"></i> Guardar</button>`
                : `<button class="btn-deposit btn-action-habit"><i class="ph ph-check-circle"></i> +1</button>`;

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                    <span class="dash-title">${safeIcon} ${safeTitle}</span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="dash-value" style="font-weight: 700; color: var(--primary); font-size: 0.95rem;">${percent}%</span>
                        <div class="task-badge ${badgeClass}" style="width: 24px; height: 24px; font-size: 0.65rem;">${displayOwner}</div>
                    </div>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width: ${percent}%;"></div></div>
                <div style="display: flex; justify-content: space-between; width: 100%; align-items: center; margin-top: 2px;">
                    <span class="dash-value">${textDetail}</span>
                    <div style="display: flex; align-items: center; gap: 4px;">
                        ${actionBtn}
                        <button class="btn-delete-event btn-delete-goal"><i class="ph ph-trash"></i></button>
                    </div>
                </div>
            `;

            card.querySelector('.btn-action-financial')?.addEventListener('click', () => {
                document.getElementById('deposit-goal-id').value = goal.id;
                document.getElementById('deposit-modal-overlay').classList.add('active');
                document.getElementById('deposit-bottom-sheet').classList.add('active');
                triggerHaptic(10);
            });

            card.querySelector('.btn-action-habit')?.addEventListener('click', () => {
                if (goal.current < goal.target) {
                    goal.current += 1;
                    store.setGoals([...store.goals]);
                    triggerHaptic(20); renderGoals();
                }
            });

            card.querySelector('.btn-delete-goal').addEventListener('click', () => {
                triggerHaptic(20);
                store.setGoals(store.goals.filter(g => g.id !== goal.id));
                renderGoals();
            });

            goalsContainer.appendChild(card);
        });
    }

    if(document.getElementById('metric-goals-saved')) document.getElementById('metric-goals-saved').textContent = formatCurrency(totalSaved);
    if(document.getElementById('metric-goals-count')) document.getElementById('metric-goals-count').textContent = store.goals.length;
};

export const initGoals = () => {
    const formGoal = document.getElementById('form-add-goal');
    const overlay = document.getElementById('goal-modal-overlay');
    const sheet = document.getElementById('goal-bottom-sheet');

    const closeModal = () => { overlay.classList.remove('active'); sheet.classList.remove('active'); formGoal?.reset(); };
    
    document.getElementById('btn-open-goal-modal')?.addEventListener('click', () => { triggerHaptic(10); overlay.classList.add('active'); sheet.classList.add('active'); });
    document.getElementById('btn-close-goal-modal')?.addEventListener('click', closeModal);

    formGoal?.addEventListener('submit', (e) => {
        e.preventDefault();
        const type = document.getElementById('goal-type').value;
        const targetValue = type === 'financial' ? parseFloat(document.getElementById('goal-target-fin').value) : parseInt(document.getElementById('goal-target-habit').value);
        
        const newGoal = {
            id: Date.now(), type,
            title: document.getElementById('goal-title').value,
            icon: document.getElementById('goal-icon').value || 'X',
            owner: document.getElementById('goal-owner').value,
            target: isNaN(targetValue) || targetValue <= 0 ? 1 : targetValue, // Previne divisão por zero ao criar
            current: type === 'financial' ? parseFloat(document.getElementById('goal-initial-fin').value) : 0,
            unit: type === 'habit' ? document.getElementById('goal-unit-habit').value : null
        };

        store.setGoals([...store.goals, newGoal]);
        triggerHaptic(30); renderGoals(); closeModal();
    });

    const formDep = document.getElementById('form-add-deposit');
    const overlayDep = document.getElementById('deposit-modal-overlay');
    const sheetDep = document.getElementById('deposit-bottom-sheet');
    const closeDep = () => { overlayDep.classList.remove('active'); sheetDep.classList.remove('active'); formDep?.reset(); };

    document.getElementById('btn-close-deposit-modal')?.addEventListener('click', closeDep);
    formDep?.addEventListener('submit', (e) => {
        e.preventDefault();
        const goalId = parseInt(document.getElementById('deposit-goal-id').value);
        const amount = parseFloat(document.getElementById('deposit-amount').value);
        const targetGoal = store.goals.find(g => g.id === goalId);
        if (targetGoal && !isNaN(amount) && amount > 0) {
            targetGoal.current += amount;
            store.setGoals([...store.goals]);
            triggerHaptic(30); renderGoals();
        }
        closeDep();
    });

    renderGoals();
};