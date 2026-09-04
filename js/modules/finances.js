import { store } from '../store.js';
import { triggerHaptic, formatCurrency, escapeHTML, getAvatarHtml, openModal, closeAllModals } from '../utils.js';

let selectedHistoryMonth = new Date().toISOString().slice(0, 7);

// Dicionário Estrito de Cores para sincronizar Ícone e Gráfico perfeitamente
const CAT_INFO = {
    'moradia': { color: '#E07A5F', label: 'Moradia' },
    'mercado': { color: '#2A9D8F', label: 'Mercado' },
    'lazer': { color: '#E9C46A', label: 'Lazer' },
    'transporte': { color: '#F4A261', label: 'Transporte' },
    'outros': { color: '#8A7A75', label: 'Outros' }
};

export const renderFinances = () => {
    const title = document.getElementById('fin-banner-title');
    const valM2 = document.getElementById('val-fin-m2');
    const propBar = document.getElementById('fin-proportional-bar-container');
    const settleCard = document.getElementById('fin-settlement-card');
    
    if (!title || !valM2) return;
    
    const p1Name = store.profile?.p1 || 'P1';
    const p2Name = store.profile?.p2 || 'P2';

    // Atualiza Selects e Labels
    document.getElementById('opt-100-p1').textContent = `100% Pago por ${p1Name}`;
    document.getElementById('opt-100-p2').textContent = `100% Pago por ${p2Name}`;
    const lblIs = document.getElementById('label-fin-inc-p1');
    const lblVo = document.getElementById('label-fin-inc-p2');
    if (lblIs) lblIs.textContent = `Renda ${p1Name} (R$)`;
    if (lblVo) lblVo.textContent = `Renda ${p2Name} (R$)`;

    let pctIS = 50, pctVO = 50;

    // Regras
    if (!store.finances.configured) {
        title.textContent = "Como vocês dividem as contas?"; valM2.textContent = "Definir";
        if (propBar) propBar.style.display = 'none';
        if (settleCard) settleCard.style.display = 'none';
    } else {
        if (store.finances.model === '50/50') {
            valM2.textContent = "50 / 50"; title.textContent = "Regra: Divisão 50/50";
            if (propBar) propBar.style.display = 'none';
        } else if (store.finances.model === 'proportional') {
            const totalIncome = store.finances.incomeIS + store.finances.incomeVO;
            pctIS = totalIncome > 0 ? Math.round((store.finances.incomeIS / totalIncome) * 100) : 50; 
            pctVO = 100 - pctIS;
            valM2.textContent = `${pctIS}% / ${pctVO}%`; title.textContent = `Regra: Proporcional`;
            if (propBar) {
                propBar.style.display = 'block';
                document.getElementById('prop-val-is').textContent = `${pctIS}%`;
                document.getElementById('prop-val-vo').textContent = `${pctVO}%`;
                document.getElementById('prop-fill-is').style.width = `${pctIS}%`;
            }
        } else if (store.finances.model === '100-p1') {
            valM2.textContent = `100% ${p1Name}`; title.textContent = `Regra: ${p1Name} paga tudo`;
            if (propBar) propBar.style.display = 'none';
        } else if (store.finances.model === '100-p2') {
            valM2.textContent = `100% ${p2Name}`; title.textContent = `Regra: ${p2Name} paga tudo`;
            if (propBar) propBar.style.display = 'none';
        } else {
            valM2.textContent = "Customizado"; title.textContent = "Regra: Conta Conjunta ou Fixas";
            if (propBar) propBar.style.display = 'none';
        }
    }

    // Listas e Renderização
    const expensesContainer = document.getElementById('expenses-list-container');
    const historyContainer = document.getElementById('expenses-history-list');
    expensesContainer.innerHTML = ''; historyContainer.innerHTML = '';
    
    let totalPending = 0, totalOverall = 0, paidByIS = 0, paidByVO = 0;
    const categoryTotals = { moradia: 0, mercado: 0, lazer: 0, transporte: 0, outros: 0 };
    const sortedExpenses = [...store.expenses].sort((a, b) => a.date.localeCompare(b.date));
    
    const pendingList = sortedExpenses.filter(e => !e.completed);
    const paidList = sortedExpenses.filter(e => e.completed && e.date.startsWith(selectedHistoryMonth));

    const createExpenseElement = (exp) => {
        const catInfo = CAT_INFO[exp.category] || CAT_INFO['outros'];
        const [ey, em, ed] = exp.date.split('-');
        
        const li = document.createElement('li');
        li.className = `task-item expense-item ${exp.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <div class="checkbox" style="margin-right: 12px; flex-shrink: 0;"><i class="ph-bold ph-check"></i></div>
            <div class="dash-icon dash-icon-finance" style="background: var(--primary-light); width: 32px; height: 32px; font-size: 1rem; margin-right: 12px;">
                <div style="width: 14px; height: 14px; border-radius: 50%; background-color: ${catInfo.color};"></div>
            </div>
            <div class="task-text" style="flex: 1;">
                <strong style="font-size: 0.95rem; color: var(--text-main);">${escapeHTML(exp.title)}</strong>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Vence dia ${ed}/${em}</div>
            </div>
            ${getAvatarHtml(exp.owner, '24px')}
            <div style="display: flex; align-items: center; gap: 4px; margin-left: 8px;">
                <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-main); margin-right: 4px;">${formatCurrency(exp.amount)}</span>
                <button class="btn-edit-item btn-edit-expense"><i class="ph ph-pencil-simple"></i></button>
                <button class="btn-delete-event btn-delete-expense"><i class="ph ph-trash"></i></button>
            </div>
        `;

        li.querySelector('.checkbox').addEventListener('click', () => { triggerHaptic(15); exp.completed = !exp.completed; store.setExpenses([...store.expenses]); renderFinances(); });
        li.querySelector('.btn-delete-expense').addEventListener('click', () => { triggerHaptic(20); store.setExpenses(store.expenses.filter(e => e.id !== exp.id)); renderFinances(); });
        
        // Editar Gasto (Preenche modal e abre)
        li.querySelector('.btn-edit-expense').addEventListener('click', () => {
            document.getElementById('expense-id').value = exp.id;
            document.getElementById('expense-title').value = exp.title;
            document.getElementById('expense-amount').value = exp.amount;
            document.getElementById('expense-date').value = exp.date;
            document.getElementById('expense-category').value = exp.category;
            document.getElementById('expense-owner').value = exp.owner;
            document.getElementById('expense-modal-title').textContent = "Editar Conta";
            openModal('expense-bottom-sheet');
        });

        return li;
    };

    if (pendingList.length === 0) expensesContainer.innerHTML = `<li style="text-align:center; padding: 24px 0; color: var(--text-muted); font-size: 0.88rem;">Tudo pago! Nenhuma pendente.</li>`;
    else pendingList.forEach(exp => { totalPending += exp.amount; totalOverall += exp.amount; categoryTotals[exp.category || 'outros'] += exp.amount; expensesContainer.appendChild(createExpenseElement(exp)); });

    if (paidList.length === 0) historyContainer.innerHTML = `<li style="text-align:center; padding: 24px 0; color: var(--text-muted); font-size: 0.88rem;">Nenhuma paga ainda.</li>`;
    else paidList.forEach(exp => {
        totalOverall += exp.amount; categoryTotals[exp.category || 'outros'] += exp.amount;
        if(exp.owner === 'IS') paidByIS += exp.amount;
        else if(exp.owner === 'VO') paidByVO += exp.amount;
        else if(exp.owner === 'Casal') { paidByIS += exp.amount/2; paidByVO += exp.amount/2; }
        historyContainer.appendChild(createExpenseElement(exp));
    });

    document.getElementById('val-fin-m1').textContent = formatCurrency(totalPending);

    // Gráfico Universal
    const chartCard = document.getElementById('fin-chart-card');
    const chartBar = document.getElementById('fin-chart-bar');
    const chartLegend = document.getElementById('fin-chart-legend');
    
    if (chartCard) {
        if (totalOverall === 0) chartCard.style.display = 'none';
        else {
            chartCard.style.display = 'flex'; chartBar.innerHTML = ''; chartLegend.innerHTML = '';
            Object.keys(categoryTotals).forEach(cat => {
                const amount = categoryTotals[cat];
                if (amount > 0) {
                    const percent = (amount / totalOverall) * 100;
                    const info = CAT_INFO[cat];
                    chartBar.insertAdjacentHTML('beforeend', `<div style="width: ${percent}%; height: 100%; background-color: ${info.color};"></div>`);
                    chartLegend.insertAdjacentHTML('beforeend', `<div style="display: flex; align-items: center; gap: 4px;"><div style="width: 8px; height: 8px; border-radius: 50%; background: ${info.color};"></div><span style="color: var(--text-muted);">${info.label} (${Math.round(percent)}%)</span></div>`);
                }
            });
        }
    }

    // Acerto Inteligente
    const settleText = document.getElementById('fin-settlement-text');
    if (settleCard && settleText) {
        // Zera o acerto se a divisão for 100% de alguém, Single, ou Custom.
        const model = store.finances.model;
        if (!store.finances.configured || model === 'single' || model === 'custom' || model === '100-p1' || model === '100-p2' || (paidByIS === 0 && paidByVO === 0)) {
            settleCard.style.display = 'none';
        } else {
            settleCard.style.display = 'flex';
            const totalPaid = paidByIS + paidByVO;
            const targetIS = totalPaid * (pctIS / 100);
            const balanceIS = paidByIS - targetIS;
            
            if (Math.abs(balanceIS) < 1) {
                settleText.textContent = "Tudo certo! Ninguém deve ninguém."; settleText.style.color = 'var(--text-main)';
            } else {
                const owesIS = balanceIS < 0;
                const debtor = owesIS ? p1Name : p2Name;
                const creditor = owesIS ? p2Name : p1Name;
                const amount = Math.abs(balanceIS);
                if (store.finances.settleMode === 'transfer') settleText.innerHTML = `<span style="color: #E63946;">${debtor} transfere ${formatCurrency(amount)}</span> para ${creditor}`;
                else settleText.innerHTML = `<span style="color: #E07A5F;">${debtor} assume os próximos</span> (Saldo de ${formatCurrency(amount)} a quitar)`;
            }
        }
    }
};

export const initFinances = () => {
    document.getElementById('btn-open-fin-setup')?.addEventListener('click', () => openModal('fin-setup-bottom-sheet'));
    document.getElementById('fin-setup-banner')?.addEventListener('click', () => openModal('fin-setup-bottom-sheet'));

    document.getElementById('fin-model-select')?.addEventListener('change', (e) => {
        document.getElementById('fin-income-inputs').style.display = e.target.value === 'proportional' ? 'block' : 'none';
        document.getElementById('fin-settle-mode-group').style.display = (e.target.value === '50/50' || e.target.value === 'proportional') ? 'block' : 'none';
    });

    document.getElementById('form-fin-setup')?.addEventListener('submit', (e) => {
        e.preventDefault();
        store.setFinances({
            model: document.getElementById('fin-model-select').value,
            incomeIS: parseFloat(document.getElementById('fin-income-is').value) || 0,
            incomeVO: parseFloat(document.getElementById('fin-income-vo').value) || 0,
            focus: 'acerto',
            settleMode: document.getElementById('fin-settle-mode-select').value,
            configured: true
        });
        triggerHaptic(30); renderFinances(); closeAllModals();
    });
    
    // Botão Gigante de Nova Conta
    document.getElementById('btn-big-add-expense')?.addEventListener('click', () => {
        document.getElementById('form-add-expense').reset();
        document.getElementById('expense-id').value = ''; // Garante que é add, não edit
        document.getElementById('expense-modal-title').textContent = "Nova Conta";
        openModal('expense-bottom-sheet');
    });

    // Form de Nova/Editar Conta
    document.getElementById('form-add-expense')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const expenseId = document.getElementById('expense-id').value;
        const amount = parseFloat(document.getElementById('expense-amount').value);
        if(isNaN(amount) || amount <= 0) return;
        
        const expenseData = {
            title: document.getElementById('expense-title').value,
            category: document.getElementById('expense-category').value,
            amount: amount,
            date: document.getElementById('expense-date').value,
            owner: document.getElementById('expense-owner').value
        };

        if (expenseId) {
            // Edição
            const exp = store.expenses.find(x => x.id === parseInt(expenseId));
            if(exp) Object.assign(exp, expenseData);
        } else {
            // Nova Conta
            expenseData.id = Date.now();
            expenseData.completed = false;
            store.expenses.push(expenseData);
        }
        
        store.setExpenses([...store.expenses]);
        triggerHaptic(30); renderFinances(); closeAllModals();
    });

    document.getElementById('fin-history-month')?.addEventListener('change', (e) => { selectedHistoryMonth = e.target.value; renderFinances(); });
    renderFinances();
};