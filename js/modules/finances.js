import { store } from '../store.js';
import { triggerHaptic, getInitials, formatCurrency, escapeHTML } from '../utils.js';

// Mapa de cores e nomes para o Gráfico de Categorias
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
    const expensesContainer = document.getElementById('expenses-list-container');
    const historyContainer = document.getElementById('expenses-history-list');
    
    if (!title || !valM2) return;
    
    const p1Init = store.profile ? getInitials(store.profile.p1) : 'IS';
    const p2Init = store.profile ? getInitials(store.profile.p2) : 'VO';

    let pctIS = 50;
    let pctVO = 50;

    // 1. HEADER E REGRAS DE DIVISÃO
    if (!store.finances.configured) {
        title.textContent = "Como vocês dividem as contas?";
        valM2.textContent = "Definir";
        if (propBar) propBar.style.display = 'none';
        document.getElementById('fin-settlement-card').style.display = 'none';
    } else {
        if (store.finances.model === '50/50') {
            valM2.textContent = "50 / 50";
            title.textContent = "Regra Ativa: Divisão 50/50";
            if (propBar) propBar.style.display = 'none';
        } else if (store.finances.model === 'proportional') {
            const totalIncome = store.finances.incomeIS + store.finances.incomeVO;
            pctIS = totalIncome > 0 ? Math.round((store.finances.incomeIS / totalIncome) * 100) : 50; 
            pctVO = 100 - pctIS;
            
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

    // 2. FILTRAR, SOMAR E RENDERIZAR LISTAS
    expensesContainer.innerHTML = '';
    historyContainer.innerHTML = '';
    
    let totalPending = 0;
    let totalOverall = 0;
    let paidByIS = 0;
    let paidByVO = 0;
    
    const categoryTotals = { moradia: 0, mercado: 0, lazer: 0, transporte: 0, outros: 0 };

    const sortedExpenses = [...store.expenses].sort((a, b) => a.date.localeCompare(b.date));
    const pendingList = sortedExpenses.filter(e => !e.completed);
    const paidList = sortedExpenses.filter(e => e.completed);

    const createExpenseElement = (exp) => {
        const catInfo = CAT_INFO[exp.category || 'outros'];
        let displayOwner = exp.owner;
        if (exp.owner === 'VO') displayOwner = p2Init;
        if (exp.owner === 'IS') displayOwner = p1Init;
        if (exp.owner === 'Casal') displayOwner = 'Casal';
        
        const safeTitle = escapeHTML(exp.title);
        const [ey, em, ed] = exp.date.split('-');
        
        const li = document.createElement('li');
        li.className = `task-item expense-item ${exp.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <div class="checkbox" style="margin-right: 12px; flex-shrink: 0;"><i class="ph-bold ph-check"></i></div>
            <div class="dash-icon" style="background: ${catInfo.color}20; width: 32px; height: 32px; font-size: 1rem; margin-right: 12px;">
                <div style="width: 12px; height: 12px; border-radius: 50%; background: ${catInfo.color};"></div>
            </div>
            <div class="task-text" style="flex: 1;">
                <strong style="font-size: 0.95rem; color: var(--text-main);">${safeTitle}</strong>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Vence dia ${ed}/${em} - Resp: ${displayOwner}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-main);">${formatCurrency(exp.amount)}</span>
                <button class="btn-delete-event btn-delete-expense"><i class="ph ph-trash"></i></button>
            </div>
        `;

        // Marcar como pago/pendente
        li.querySelector('.checkbox').addEventListener('click', () => {
            triggerHaptic(15);
            exp.completed = !exp.completed;
            store.setExpenses([...store.expenses]);
            renderFinances();
        });

        // Deletar
        li.querySelector('.btn-delete-expense').addEventListener('click', (e) => {
            e.stopPropagation();
            triggerHaptic(20);
            store.setExpenses(store.expenses.filter(e => e.id !== exp.id));
            renderFinances();
        });

        return li;
    };

    // Renderiza Pendentes
    if (pendingList.length === 0) {
        expensesContainer.innerHTML = `<li style="text-align:center; padding: 24px 0; color: var(--text-muted); font-size: 0.88rem;">Tudo pago! Nenhuma conta pendente.</li>`;
    } else {
        pendingList.forEach(exp => {
            totalPending += exp.amount;
            totalOverall += exp.amount;
            categoryTotals[exp.category || 'outros'] += exp.amount;
            expensesContainer.appendChild(createExpenseElement(exp));
        });
    }

    // Renderiza Histórico (Pagas)
    if (paidList.length === 0) {
        historyContainer.innerHTML = `<li style="text-align:center; padding: 24px 0; color: var(--text-muted); font-size: 0.88rem;">Nenhuma conta paga ainda.</li>`;
    } else {
        paidList.forEach(exp => {
            totalOverall += exp.amount;
            categoryTotals[exp.category || 'outros'] += exp.amount;
            
            // Soma para o cálculo de acerto de quem pagou o quê
            if(exp.owner === 'IS') paidByIS += exp.amount;
            else if(exp.owner === 'VO') paidByVO += exp.amount;
            else if(exp.owner === 'Casal') { paidByIS += exp.amount/2; paidByVO += exp.amount/2; }

            historyContainer.appendChild(createExpenseElement(exp));
        });
    }

    // Métrica principal no topo (só as pendentes)
    const valM1 = document.getElementById('val-fin-m1');
    const labelM1 = document.getElementById('label-fin-m1');
    if (valM1 && labelM1) {
        labelM1.textContent = "Pendente a Pagar";
        valM1.textContent = formatCurrency(totalPending);
    }

    // 3. GRÁFICO DE CATEGORIAS (FLEXBOX)
    const chartCard = document.getElementById('fin-chart-card');
    const chartBar = document.getElementById('fin-chart-bar');
    const chartLegend = document.getElementById('fin-chart-legend');
    
    if (chartCard && chartBar && chartLegend) {
        if (totalOverall === 0) {
            chartCard.style.display = 'none';
        } else {
            chartCard.style.display = 'flex';
            chartBar.innerHTML = '';
            chartLegend.innerHTML = '';
            
            Object.keys(categoryTotals).forEach(cat => {
                const amount = categoryTotals[cat];
                if (amount > 0) {
                    const percent = (amount / totalOverall) * 100;
                    const info = CAT_INFO[cat];
                    
                    // Segmento da Barra
                    const segment = document.createElement('div');
                    segment.style.width = `${percent}%`;
                    segment.style.height = '100%';
                    segment.style.backgroundColor = info.color;
                    chartBar.appendChild(segment);
                    
                    // Legenda
                    const leg = document.createElement('div');
                    leg.style.display = 'flex';
                    leg.style.alignItems = 'center';
                    leg.style.gap = '4px';
                    leg.innerHTML = `<div style="width: 8px; height: 8px; border-radius: 50%; background: ${info.color};"></div> <span style="color: var(--text-muted);">${info.label} (${Math.round(percent)}%)</span>`;
                    chartLegend.appendChild(leg);
                }
            });
        }
    }

    // 4. ACERTO INTELIGENTE DE CONTAS
    const settleCard = document.getElementById('fin-settlement-card');
    const settleText = document.getElementById('fin-settlement-text');
    
    if (settleCard && settleText) {
        if (!store.finances.configured || store.finances.model === 'single' || store.finances.model === 'custom' || (paidByIS === 0 && paidByVO === 0)) {
            settleCard.style.display = 'none';
        } else {
            settleCard.style.display = 'flex';
            const totalPaid = paidByIS + paidByVO;
            
            // Qual era o alvo que cada um deveria ter pago baseado na regra?
            const targetIS = totalPaid * (pctIS / 100);
            const balanceIS = paidByIS - targetIS; // Positivo = Pagou a mais. Negativo = Pagou a menos.
            
            const settleMode = store.finances.settleMode || 'prioritize';
            
            if (Math.abs(balanceIS) < 1) { // Margem de erro de R$1
                settleText.textContent = "Tudo certo! Ninguém deve ninguém.";
                settleText.style.color = 'var(--text-main)';
            } else {
                const owesIS = balanceIS < 0; // Se IS pagou menos que o alvo, IS deve pro VO.
                const debtor = owesIS ? p1Init : p2Init;
                const creditor = owesIS ? p2Init : p1Init;
                const amount = Math.abs(balanceIS);
                
                if (settleMode === 'transfer') {
                    settleText.innerHTML = `<span style="color: #E63946;">${debtor} deve transferir ${formatCurrency(amount)}</span> para ${creditor}`;
                } else {
                    settleText.innerHTML = `<span style="color: #E07A5F;">${debtor} deve assumir as próximas contas</span> (Saldo de ${formatCurrency(amount)} com ${creditor})`;
                }
            }
        }
    }
};

export const initFinances = () => {
    // --- LÓGICA DO MODAL DE CONFIGURAÇÕES DE FINANÇAS ---
    const overlayFin = document.getElementById('fin-setup-modal-overlay');
    const sheetFin = document.getElementById('fin-setup-bottom-sheet');
    const formFin = document.getElementById('form-fin-setup');
    
    const closeFin = () => { overlayFin.classList.remove('active'); sheetFin.classList.remove('active'); };
    const openFin = () => { 
        triggerHaptic(10); 
        overlayFin.classList.add('active'); 
        sheetFin.classList.add('active'); 
        // Preenche com o modo atual se existir
        if(document.getElementById('fin-settle-mode-select') && store.finances.settleMode) {
            document.getElementById('fin-settle-mode-select').value = store.finances.settleMode;
        }
    };
    
    document.getElementById('btn-open-fin-setup')?.addEventListener('click', openFin);
    document.getElementById('fin-setup-banner')?.addEventListener('click', openFin);
    document.getElementById('btn-close-fin-setup')?.addEventListener('click', closeFin);
    
    document.getElementById('fin-model-select')?.addEventListener('change', (e) => {
        document.getElementById('fin-income-inputs').style.display = e.target.value === 'proportional' ? 'block' : 'none';
        document.getElementById('fin-settle-mode-group').style.display = (e.target.value === '50/50' || e.target.value === 'proportional') ? 'block' : 'none';
    });

    formFin?.addEventListener('submit', (e) => {
        e.preventDefault();
        store.setFinances({
            model: document.getElementById('fin-model-select').value,
            incomeIS: parseFloat(document.getElementById('fin-income-is').value) || 0,
            incomeVO: parseFloat(document.getElementById('fin-income-vo').value) || 0,
            focus: document.getElementById('fin-focus-select').value,
            settleMode: document.getElementById('fin-settle-mode-select') ? document.getElementById('fin-settle-mode-select').value : 'prioritize',
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
            category: document.getElementById('expense-category') ? document.getElementById('expense-category').value : 'outros',
            amount: amount,
            date: document.getElementById('expense-date').value,
            owner: document.getElementById('expense-owner').value,
            completed: false // Nasce pendente por padrão
        }]);
        
        triggerHaptic(30); renderFinances(); closeExp();
    });

    renderFinances();
};