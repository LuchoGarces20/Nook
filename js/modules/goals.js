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
            
            // 1. DATA ALVO & SUGESTÃO DE ECONOMIA AUTOMÁTICA
            let deadlineText = '';
            if (goal.type === 'financial' && goal.deadline && goal.current < goal.target) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const [y, m, d] = goal.deadline.split('-').map(Number);
                const deadlineDate = new Date(y, m - 1, d);
                deadlineDate.setHours(0, 0, 0, 0);
                
                const diffTime = deadlineDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const remainingMoney = goal.target - goal.current;
                
                if (diffDays > 0) {
                    const months = Math.ceil(diffDays / 30.44);
                    if (diffDays >= 30) {
                        const monthlyRate = remainingMoney / (diffDays / 30.44);
                        deadlineText = `
                            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 8px; padding: 10px 12px; background: var(--bg-color); border-radius: var(--radius-sm); border: 1px dashed var(--border-color); width: 100%;">
                                ⏳ <strong>Faltam ${months} ${months === 1 ? 'mês' : 'meses'}.</strong> Vocês precisam guardar <strong>${formatCurrency(monthlyRate)}/mês</strong> para chegar lá.
                            </div>
                        `;
                    } else {
                        const weeklyRate = remainingMoney / (diffDays / 7 || 1);
                        deadlineText = `
                            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 8px; padding: 10px 12px; background: var(--bg-color); border-radius: var(--radius-sm); border: 1px dashed var(--border-color); width: 100%;">
                                ⏳ <strong>Faltam ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}.</strong> Vocês precisam guardar <strong>${formatCurrency(weeklyRate)}/semana</strong> para chegar lá.
                            </div>
                        `;
                    }
                } else if (diffDays === 0) {
                    deadlineText = `
                        <div style="font-size: 0.78rem; color: var(--primary); margin-top: 8px; padding: 8px 12px; background: var(--primary-light); border-radius: var(--radius-sm); width: 100%;">
                            ⚠️ O prazo final é <strong>hoje</strong>! Faltam ${formatCurrency(remainingMoney)}.
                        </div>
                    `;
                } else {
                    deadlineText = `
                        <div style="font-size: 0.78rem; color: #E63946; margin-top: 8px; padding: 8px 12px; background: rgba(230, 57, 70, 0.1); border-radius: var(--radius-sm); width: 100%;">
                            ⏰ Prazo esgotado!
                        </div>
                    `;
                }
            }

            // 2. VISUALIZAÇÃO DOS MARCOS INTERMEDIÁRIOS (25%, 50%, 75%, 100%)
            const milestonesHTML = `
                <div class="milestones-row" style="display: flex; justify-content: space-between; width: 100%; font-size: 0.68rem; margin-top: 4px; color: var(--text-muted);">
                    <span style="${percent >= 25 ? 'color: var(--primary); font-weight: 700;' : ''}">${percent >= 25 ? '✓ 25%' : '25%'}</span>
                    <span style="${percent >= 50 ? 'color: var(--primary); font-weight: 700;' : ''}">${percent >= 50 ? '✓ 50%' : '50%'}</span>
                    <span style="${percent >= 75 ? 'color: var(--primary); font-weight: 700;' : ''}">${percent >= 75 ? '✓ 75%' : '75%'}</span>
                    <span style="${percent >= 100 ? 'color: var(--primary); font-weight: 700;' : ''}">${percent >= 100 ? '🎉 100%' : '100%'}</span>
                </div>
            `;

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
                <div class="progress-bar" style="width: 100%;"><div class="progress-fill" style="width: ${percent}%;"></div></div>
                ${milestonesHTML}
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
                    const prevPercent = goal.target > 0 ? Math.floor((prev / goal.target) * 100) : 0;
                    
                    goal.current += 1;
                    const newPercent = goal.target > 0 ? Math.floor((goal.current / goal.target) * 100) : 0;
                    
                    if (!goal.history) goal.history = [];
                    goal.history.push({
                        date: getLocalDateString(new Date()),
                        owner: store.profile ? store.profile.p1 : 'IS',
                        amount: 1
                    });
                    store.setGoals([...store.goals]);
                    
                    // Trigger de Marcos em Hábitos
                    const milestones = [25, 50, 75, 100];
                    const crossed = milestones.slice().reverse().find(m => prevPercent < m && newPercent >= m);
                    
                    if (crossed) {
                        if (crossed === 100) {
                            triggerHaptic([200, 100, 200, 100, 200]);
                            if (window.confetti) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#E07A5F', '#DB2777', '#FDF2F8'] });
                        } else {
                            triggerHaptic([100, 50, 100]);
                            if (window.confetti) confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 }, colors: ['#E07A5F', '#2A9D8F', '#E9C46A'] });
                        }
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

    if (document.getElementById('metric-goals-saved')) document.getElementById('metric-goals-saved').textContent = formatCurrency(totalSaved);
    if (document.getElementById('metric-goals-count')) document.getElementById('metric-goals-count').textContent = store.goals.length;
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
            id: Date.now(), 
            type,
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
            const prevPercent = targetGoal.target > 0 ? Math.floor((prev / targetGoal.target) * 100) : 0;
            
            targetGoal.current += amount;
            const newPercent = targetGoal.target > 0 ? Math.floor((targetGoal.current / targetGoal.target) * 100) : 0;
            
            if (!targetGoal.history) targetGoal.history = [];
            targetGoal.history.push({
                date: getLocalDateString(new Date()),
                owner: store.profile ? store.profile.p1 : 'IS',
                amount: amount
            });
            
            store.setGoals([...store.goals]);
            
            // DISPARO DE MARCOS INTERMEDIÁRIOS (25%, 50%, 75%, 100%)
            const milestones = [25, 50, 75, 100];
            const crossed = milestones.slice().reverse().find(m => prevPercent < m && newPercent >= m);
            
            if (crossed) {
                if (crossed === 100) {
                    triggerHaptic([200, 100, 200, 100, 200]);
                    if (window.confetti) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#E07A5F', '#DB2777', '#FDF2F8'] });
                } else {
                    // Micro-confete intermediário (25%, 50%, 75%)
                    triggerHaptic([100, 50, 100]);
                    if (window.confetti) confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 }, colors: ['#E07A5F', '#2A9D8F', '#E9C46A'] });
                }
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