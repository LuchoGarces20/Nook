import { store } from '../store.js';
import { triggerHaptic, getInitials, formatCurrency, escapeHTML } from '../utils.js';

export const renderFinances = () => {
    const title = document.getElementById('fin-banner-title');
    const valM2 = document.getElementById('val-fin-m2');
    const propBar = document.getElementById('fin-proportional-bar-container');
    const expensesContainer = document.getElementById('expenses-list-container');
    
    if (!title || !valM2) return;

    const p1Init = store.profile ? getInitials(store.profile.p1) : 'IS';
    const p2Init = store.profile ? getInitials(store.profile.p2) : 'VO';

    // 1. Configuração do Header / Banner de regras
    if (!store.finances.configured) {
        title.textContent = "Como vocês dividem as contas?";
        valM2.textContent = "Definir";
        if (propBar) propBar.style.display = 'none';
    } else {
        if (store.finances.model === '50/50') {
            valM2.textContent = "50 / 50";
            title.textContent = "Regra Ativa: Divisão 50/50";
            if (propBar) propBar.style.display = 'none';
        } else if (store.finances.model === 'proportional') {
            const totalIncome = store.finances.incomeIS + store.finances.incomeVO;
            const pctIS = totalIncome > 0 ? Math.round((store.finances.incomeIS / totalIncome) * 100) : 50; 
            const pctVO = 100 - pctIS;
            
            valM2.textContent = `${pctIS}% / ${pctVO}%`;
            title.textContent = `Regra Ativa: Proporcional à Renda`;
            
            if (propBar) {
                propBar.style.display = 'block';
                document.getElementById('prop-val-is').textContent = `${pctIS}%`;
                document.getElementById('prop-val-vo').textContent = `${pctVO}%`;
                document.getElementById('prop-fill-is').style.width = `${pctIS}%`;
                
                const labelIs = document.getElementById('prop-label-is');
                const labelVo = document.getElementById('prop-label-vo');
                if (labelIs) labelIs.textContent = `${p1Init}: `;
                if (labelVo) labelVo.textContent = `${p2Init}: `;
            }
        } else {
            valM2.textContent = store.finances.model === 'single' ? "Conta Única" : "Por Contas";
            title.textContent = store.finances.model === 'single' ? "Regra Ativa: Conta Conjunta Única" : "Regra Ativa: Contas Específicas";
            if (propBar) propBar.style.display = 'none';
        }
    }

    // 2. Renderização Dinâmica da Lista de Contas
    if (expensesContainer) {
        expensesContainer.innerHTML = '';
        let totalExpenses = 0;

        // Ordena por data mais próxima
        const sortedExpenses = [...store.expenses].sort((a, b) => a.date.localeCompare(b.date));

        if (sortedExpenses.length === 0) {
            expensesContainer.innerHTML = `<li style="text-align:center; padding: 24px 0; color: var(--text-muted); font-size: 0.88rem;">Nenhuma conta cadastrada.</li>`;
        } else {
            sortedExpenses.forEach(exp => {
                totalExpenses += exp.amount;
                
                let displayOwner = exp.owner;
                if (exp.owner === 'VO') displayOwner = p2Init;
                if (exp.owner === 'IS') displayOwner = p1Init;
                if (exp.owner === 'Casal') displayOwner = 'Casal';

                const safeTitle = escapeHTML(exp.title);
                const [ey, em, ed] = exp.date.split('-');

                const li = document.createElement('li');
                li.className = 'task-item';
                li.innerHTML = `
                    <div class="dash-icon bg-pink-light" style="width: 32px; height: 32px; font-size: 1rem;">
                        <i class="ph-fill ph-receipt text-pink"></i>
                    </div>
                    <div class="task-text">
                        <strong style="font-size: 0.95rem; color: var(--text-main);">${safeTitle}</strong>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Vence dia ${ed}/${em} - Resp: ${displayOwner}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-main);">${formatCurrency(exp.amount)}</span>
                        <button class="btn-delete-event btn-delete-expense"><i class="ph ph-trash"></i></button>
                    </div>
                `;

                li.querySelector('.btn-delete-expense').addEventListener('click', () => {
                    triggerHaptic(20);
                    store.setExpenses(store.expenses.filter(e => e.id !== exp.id));
                    renderFinances();
                });

                expensesContainer.appendChild(li);
            });
        }

        // Atualiza a métrica principal para o total das contas pendentes
        const valM1 = document.getElementById('val-fin-m1');
        const labelM1 = document.getElementById('label-fin-m1');
        if (valM1 && labelM1) {
            labelM1.textContent = "Total em Contas";
            valM1.textContent = formatCurrency(totalExpenses);
        }
    }
};

export const initFinances = () => {
    // --- LÓGICA DO MODAL DE CONFIGURAÇÕES DE FINANÇAS ---
    const overlayFin = document.getElementById('fin-setup-modal-overlay');
    const sheetFin = document.getElementById('fin-setup-bottom-sheet');
    const formFin = document.getElementById('form-fin-setup');
    const closeFin = () => { overlayFin.classList.remove('active'); sheetFin.classList.remove('active'); };
    const openFin = () => { triggerHaptic(10); overlayFin.classList.add('active'); sheetFin.classList.add('active'); };
    
    document.getElementById('btn-open-fin-setup')?.addEventListener('click', openFin);
    document.getElementById('fin-setup-banner')?.addEventListener('click', openFin);
    document.getElementById('btn-close-fin-setup')?.addEventListener('click', closeFin);

    document.getElementById('fin-model-select')?.addEventListener('change', (e) => {
        document.getElementById('fin-income-inputs').style.display = e.target.value === 'proportional' ? 'block' : 'none';
    });

    formFin?.addEventListener('submit', (e) => {
        e.preventDefault();
        store.setFinances({
            model: document.getElementById('fin-model-select').value,
            incomeIS: parseFloat(document.getElementById('fin-income-is').value) || 0,
            incomeVO: parseFloat(document.getElementById('fin-income-vo').value) || 0,
            focus: document.getElementById('fin-focus-select').value,
            configured: true
        });
        triggerHaptic(30); renderFinances(); closeFin();
    });
    
    // --- LÓGICA DO MODAL DE NOVA CONTA (DESPESA) ---
    const overlayExp = document.getElementById('expense-modal-overlay');
    const sheetExp = document.getElementById('expense-bottom-sheet');
    const formExp = document.getElementById('form-add-expense');
    const closeExp = () => { overlayExp.classList.remove('active'); sheetExp.classList.remove('active'); formExp?.reset(); };
    
    document.getElementById('btn-open-expense-modal')?.addEventListener('click', () => {
        triggerHaptic(10); overlayExp.classList.add('active'); sheetExp.classList.add('active');
    });
    document.getElementById('btn-close-expense-modal')?.addEventListener('click', closeExp);

    formExp?.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('expense-amount').value);
        if(isNaN(amount) || amount <= 0) return;

        store.setExpenses([...store.expenses, {
            id: Date.now(),
            title: document.getElementById('expense-title').value,
            amount: amount,
            date: document.getElementById('expense-date').value,
            owner: document.getElementById('expense-owner').value
        }]);
        triggerHaptic(30); renderFinances(); closeExp();
    });

    renderFinances();
};