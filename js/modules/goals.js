import { store } from '../store.js';
import { triggerHaptic, formatCurrency, getInitials, escapeHTML, getLocalDateString, openModal, closeAllModals } from '../utils.js';

export const renderGoals = () => {
    const goalsContainer = document.getElementById('goals-list-container');
    if (!goalsContainer) return;
    
    const p1Init = store.profile ? getInitials(store.profile.p1) : 'IS';
    const p2Init = store.profile ? getInitials(store.profile.p2) : 'VO';
    
    let totalSaved = 0;
    goalsContainer.innerHTML = '';
    
    if (store.goals.length === 0) {
        goalsContainer.innerHTML = `<div style="text-align:center; padding: 32px 0; color: var(--text-muted); font-size: 0.9rem;">Nenhuma meta cadastrada. Clique no + acima para começar!</div>`;
    } else {
        store.goals.forEach(goal => {
            if (goal.type === 'financial') totalSaved += goal.current;
            
            const percent = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
            
            let displayOwner = goal.owner;
            if (goal.owner === 'VO') displayOwner = p2Init;
            if (goal.owner === 'IS') displayOwner = p1Init;
            
            let badgeClass = (goal.owner === 'VO' || goal.owner === p2Init) ? 'bg-muted' : '';
            if (goal.owner === 'Casal') { badgeClass = 'bg-casal'; displayOwner = 'NÓS'; }
            
            const safeTitle = escapeHTML(goal.title);
            const safeIcon = escapeHTML(goal.icon);
            const safeUnit = escapeHTML(goal.unit || 'vezes');
            
            let deadlineText = '';
            if (goal.type === 'financial' && goal.deadline && goal.current < goal.target) {
                const today = new Date();
                const [y, m, d] = goal.deadline.split('-');
                const deadlineDate = new Date(y, m - 1, d);
                const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
                const remainingMoney = goal.target - goal.current;
                if (diffDays > 0) {
                    const diffMonths = diffDays / 30.44;
                    const suggestion = diffMonths >= 1
                        ? `${formatCurrency(remainingMoney / diffMonths)}/mês`
                        : `${formatCurrency(remainingMoney / (diffDays / 7 || 1))}/semana`;
                    deadlineText = `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px; padding: 8px 12px; background: var(--bg-color); border-radius: var(--radius-sm); border: 1px dashed var(--border-color);">Guardem aprox. <strong>${suggestion}</strong> para bater a meta no prazo.</div>`;
                } else {
                    deadlineText = `<div style="font-size: 0.75rem; color: #E63946; margin-top: 8px;">Prazo esgotado!</div>`;
                }
            }

            const card = document.createElement('div');
            card.className = 'dash-card';
            card.style.cssText = 'flex-direction: column; align-items: flex-start; gap: 12px;';
            
            const textDetail = goal.type === 'financial' 
                ? `${formatCurrency(goal.current)} de ${formatCurrency(goal.target)}` 
                : `${goal.current} de ${goal.target} ${safeUnit}`;
                
            const actionBtn = goal.type === 'financial' 
                ? `<button class="btn-deposit btn-action-financial"><i class="ph ph-plus-circle"></i> Guardar</button>`
                : `<button class="btn-deposit btn-action-habit"><i class="ph ph-check-circle"></i> +1</button>`;

            card.innerHTML = `
                <div class="goal-header" style="display: flex; justify-content: space-between; width: 100%; align-items: center; cursor: pointer;" title="Ver Histórico">
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
                ${deadlineText}
            `;

            card.querySelector('.goal-header').addEventListener('click', () => {
                openHistoryModal(goal);
            });

            card.querySelector('.btn-action-financial')?.addEventListener('click', () => {
                document.getElementById('deposit-goal-id').value = goal.id;
                openModal('deposit-bottom-sheet');
            });

            card.querySelector('.btn-action-habit')?.addEventListener('click', () => {
                if (goal.current < goal.target) {
                    const prev = goal.current;
                    goal.current += 1;
                    
                    if (!goal.history) goal.history = [];
                    goal.history.push({
                        date: getLocalDateString(new Date()),
                        owner: store.profile ? store.profile.p1 : 'IS',
                        amount: 1
                    });
                    store.setGoals([...store.goals]);
                    
                    if (goal.current >= goal.target && prev < goal.target) {
                        triggerHaptic([200, 100, 200, 100, 200]);
                        if(window.confetti) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#E07A5F', '#DB2777', '#FDF2F8'] });
                    } else {
                        triggerHaptic(20);
                    }
                    renderGoals();
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

const openHistoryModal = (goal) => {
    triggerHaptic(10);
    document.getElementById('goal-history-title').textContent = `Histórico: ${goal.title}`;
    const listEl = document.getElementById('goal-history-list');
    listEl.innerHTML = '';
    const history = goal.history || [];
    
    if (history.length === 0) {
        listEl.innerHTML = `<li style="text-align:center; padding: 24px 0; color: var(--text-muted); font-size: 0.88rem;">Nenhum registro ainda.</li>`;
    } else {
        [...history].reverse().forEach(entry => {
            const [y, m, d] = entry.date.split('-');
            const valText = goal.type === 'financial' ? formatCurrency(entry.amount) : `+${entry.amount} ${goal.unit || 'vezes'}`;
            
            const li = document.createElement('li');
            li.className = 'task-item';
            li.innerHTML = `
                <div class="task-text">
                    <strong style="font-size: 0.95rem; color: var(--text-main);">${valText}</strong>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Feito por ${entry.owner} em ${d}/${m}/${y}</div>
                </div>
            `;
            listEl.appendChild(li);
        });
    }
    openModal('goal-history-bottom-sheet');
};

export const initGoals = () => {
    const formGoal = document.getElementById('form-add-goal');
    
    document.getElementById('btn-open-goal-modal')?.addEventListener('click', () => { 
        openModal('goal-bottom-sheet'); 
    });

    formGoal?.addEventListener('submit', (e) => {
        e.preventDefault();
        const type = document.getElementById('goal-type').value;
        const targetValue = type === 'financial' ? parseFloat(document.getElementById('goal-target-fin').value) : parseInt(document.getElementById('goal-target-habit').value);
        
        const newGoal = {
            id: Date.now(), type,
            title: document.getElementById('goal-title').value,
            icon: document.getElementById('goal-icon').value || '🎯',
            owner: document.getElementById('goal-owner').value,
            target: isNaN(targetValue) || targetValue <= 0 ? 1 : targetValue,
            current: type === 'financial' ? parseFloat(document.getElementById('goal-initial-fin').value) || 0 : 0,
            unit: type === 'habit' ? document.getElementById('goal-unit-habit').value : null,
            deadline: type === 'financial' ? document.getElementById('goal-deadline-fin').value : null,
            history: []
        };

        if (newGoal.current > 0) {
            newGoal.history.push({
                date: getLocalDateString(new Date()),
                owner: store.profile ? store.profile.p1 : 'IS',
                amount: newGoal.current
            });
        }
        store.setGoals([...store.goals, newGoal]);
        triggerHaptic(30); 
        renderGoals(); 
        closeAllModals();
        formGoal?.reset();
    });

    const formDep = document.getElementById('form-add-deposit');
    
    formDep?.addEventListener('submit', (e) => {
        e.preventDefault();
        const goalId = parseInt(document.getElementById('deposit-goal-id').value);
        const amount = parseFloat(document.getElementById('deposit-amount').value);
        const targetGoal = store.goals.find(g => g.id === goalId);
        
        if (targetGoal && !isNaN(amount) && amount > 0) {
            const prev = targetGoal.current;
            targetGoal.current += amount;
            
            if (!targetGoal.history) targetGoal.history = [];
            targetGoal.history.push({
                date: getLocalDateString(new Date()),
                owner: store.profile ? store.profile.p1 : 'IS',
                amount: amount
            });
            store.setGoals([...store.goals]);
            
            if (targetGoal.current >= targetGoal.target && prev < targetGoal.target) {
                triggerHaptic([200, 100, 200, 100, 200]);
                if(window.confetti) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#E07A5F', '#DB2777', '#FDF2F8'] });
            } else {
                triggerHaptic(30);
            }
            renderGoals();
        }
        closeAllModals();
        formDep?.reset();
    });

    renderGoals();
};