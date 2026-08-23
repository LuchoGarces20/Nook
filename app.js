document.addEventListener('DOMContentLoaded', () => {
    
    const triggerHaptic = (ms = 15) => {
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(ms);
        }
    };

    // ==========================================
    // 1. NAVEGAÇÃO ENTRE ABAS (SPA)
    // ==========================================
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault(); 
            const targetId = item.getAttribute('data-target');
            if (!targetId) return; 

            triggerHaptic(10);

            navItems.forEach(nav => {
                nav.classList.remove('active');
                const icon = nav.querySelector('i');
                if(icon) {
                    icon.classList.remove('ph-fill');
                    icon.classList.add('ph');
                }
            });
            
            item.classList.add('active');
            const activeIcon = item.querySelector('i');
            if(activeIcon) {
                activeIcon.classList.remove('ph');
                activeIcon.classList.add('ph-fill');
            }

            views.forEach(view => {
                view.classList.remove('active');
            });
            
            const targetView = document.getElementById(targetId);
            if(targetView) {
                targetView.classList.add('active');
            }
        });
    });

    // ==========================================
    // 2. SAUDAÇÃO & DIAS JUNTOS (HOME)
    // ==========================================
    const greetingElement = document.getElementById('dynamic-greeting');
    if (greetingElement) {
        const hour = new Date().getHours();
        const day = new Date().getDay(); 
        let greetingText = "";

        if (day === 5 && hour > 17) greetingText = "Sextou, casal! 🍷";
        else if (day === 0 && hour < 12) greetingText = "Domingo de preguiça! ☕";
        else if (hour >= 5 && hour < 12) greetingText = "Bom dia, amores! ☀️";
        else if (hour >= 12 && hour < 18) greetingText = "Boa tarde! 🌻";
        else greetingText = "Boa noite! Descansem 🌙";

        greetingElement.textContent = greetingText;
    }

    const daysElement = document.getElementById('days-together');
    if (daysElement) {
        const startDate = new Date(2022, 3, 15); 
        const today = new Date();
        const diffTime = Math.abs(today - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        daysElement.textContent = diffDays;
    }

    document.querySelectorAll('.setting-item').forEach(item => {
        item.addEventListener('click', () => triggerHaptic(10));
    });

    // ==========================================
    // 3. MÓDULO: LISTAS DINÂMICAS
    // ==========================================
    let userLists = [
        {
            id: 'atividades',
            name: 'Atividades',
            items: [
                { id: 101, text: 'trocar aquilo lá do chuveiro elétrico', completed: false, owner: 'IS' },
                { id: 102, text: 'trancar matrícula do curso de inglês', completed: false, owner: 'VO' }
            ]
        },
        {
            id: 'mercado',
            name: 'Mercado',
            items: [
                { id: 201, text: 'Café em grãos', completed: false, owner: 'Casal' },
                { id: 202, text: 'Leite de aveia', completed: true, owner: 'IS' },
                { id: 203, text: 'Pão artesanal', completed: false, owner: 'VO' }
            ]
        }
    ];

    let activeListId = 'atividades';

    const tabsContainer = document.getElementById('lists-tabs-container');
    const taskContainer = document.getElementById('task-list-container');
    const activeHeaderTitle = document.getElementById('active-list-header-title');
    const sectionTitle = document.getElementById('lists-section-title');
    const metricListsCount = document.getElementById('metric-lists-count');
    const metricPendingCount = document.getElementById('metric-pending-count');
    const formAddTask = document.getElementById('form-add-task');
    const inputTaskText = document.getElementById('input-task-text');
    const btnListArchive = document.getElementById('btn-list-archive');
    const btnListRemind = document.getElementById('btn-list-remind');

    const renderListsModule = () => {
        if (!tabsContainer || !taskContainer) return;

        const currentList = userLists.find(l => l.id === activeListId) || userLists[0];

        if (activeHeaderTitle) activeHeaderTitle.textContent = currentList.name;

        tabsContainer.innerHTML = '';
        userLists.forEach(list => {
            const btn = document.createElement('button');
            const isActive = list.id === activeListId;
            btn.className = `tab-pill ${isActive ? 'active' : 'outline'}`;
            btn.textContent = list.name;
            btn.addEventListener('click', () => {
                triggerHaptic(10);
                activeListId = list.id;
                renderListsModule();
            });
            tabsContainer.appendChild(btn);
        });

        const btnAddList = document.createElement('button');
        btnAddList.className = 'tab-pill outline text-primary';
        btnAddList.innerHTML = '<i class="ph ph-plus"></i>';
        btnAddList.title = 'Criar Nova Lista';
        btnAddList.addEventListener('click', () => {
            triggerHaptic(15);
            const listName = prompt('Nome da nova lista:');
            if (listName && listName.trim() !== '') {
                const newListId = 'list_' + Date.now();
                userLists.push({ id: newListId, name: listName.trim(), items: [] });
                activeListId = newListId;
                renderListsModule();
            }
        });
        tabsContainer.appendChild(btnAddList);

        taskContainer.innerHTML = '';
        const pendingItems = currentList.items.filter(i => !i.completed);
        sectionTitle.textContent = `PENDENTES (${pendingItems.length})`;

        if (currentList.items.length === 0) {
            taskContainer.innerHTML = `
                <li style="text-align:center; padding: 24px 0; color: var(--text-muted); font-size: 0.88rem;">
                    Nenhum item nesta lista. Adicione um abaixo! ✨
                </li>
            `;
        } else {
            currentList.items.forEach(item => {
                let badgeClass = '';
                if (item.owner === 'VO') badgeClass = 'bg-muted';
                else if (item.owner === 'Casal') badgeClass = 'bg-casal';

                const li = document.createElement('li');
                li.className = `task-item ${item.completed ? 'completed' : ''}`;
                li.innerHTML = `
                    <div class="checkbox"><i class="ph-bold ph-check"></i></div>
                    <span class="task-text">${item.text}</span>
                    <div class="task-badge ${badgeClass}">${item.owner === 'Casal' ? 'NÓS' : item.owner}</div>
                    <button class="btn-delete-event" title="Apagar item"><i class="ph ph-trash"></i></button>
                `;

                li.querySelector('.checkbox').addEventListener('click', () => {
                    triggerHaptic(15);
                    item.completed = !item.completed;
                    renderListsModule();
                });

                li.querySelector('.btn-delete-event').addEventListener('click', (e) => {
                    e.stopPropagation();
                    triggerHaptic(20);
                    currentList.items = currentList.items.filter(i => i.id !== item.id);
                    renderListsModule();
                });

                taskContainer.appendChild(li);
            });
        }

        if (metricListsCount) metricListsCount.textContent = userLists.length;
        if (metricPendingCount) metricPendingCount.textContent = currentList.items.filter(i => !i.completed).length;
    };

    if (formAddTask) {
        formAddTask.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = inputTaskText.value.trim();
            if (!text) return;

            const currentList = userLists.find(l => l.id === activeListId);
            if (currentList) {
                currentList.items.push({ id: Date.now(), text, completed: false, owner: 'IS' });
                triggerHaptic(20);
                inputTaskText.value = '';
                renderListsModule();
            }
        });
    }

    if (btnListArchive) {
        btnListArchive.addEventListener('click', () => {
            const currentList = userLists.find(l => l.id === activeListId);
            if (currentList) {
                const initialCount = currentList.items.length;
                currentList.items = currentList.items.filter(i => !i.completed);
                if (currentList.items.length < initialCount) {
                    triggerHaptic(25);
                    renderListsModule();
                }
            }
        });
    }

    if (btnListRemind) {
        btnListRemind.addEventListener('click', () => {
            triggerHaptic(30);
            alert('Lembrete enviado para o parceiro! 🔔');
        });
    }

    renderListsModule();

    // ==========================================
    // 4. MÓDULO: AGENDA DUAL
    // ==========================================
    const getLocalDateString = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const hoje = new Date();
    const amanha = new Date(hoje); amanha.setDate(hoje.getDate() + 1);
    const proximaSemana = new Date(hoje); proximaSemana.setDate(hoje.getDate() + 5);

    let agendaEvents = [
        { id: 1, title: 'Veterinário do AuAu', date: getLocalDateString(hoje), time: '14:30', owner: 'VO', subtitle: 'Clínica Pet Feliz' },
        { id: 2, title: 'Jantar de Aniversário', date: getLocalDateString(amanha), time: '20:00', owner: 'IS', subtitle: 'Restaurante Mimo' },
        { id: 3, title: 'Viagem de Fim de Semana', date: getLocalDateString(proximaSemana), time: '09:00', owner: 'Casal', subtitle: 'Praia de Maresias' }
    ];

    let selectedDateStr = getLocalDateString(hoje);

    const scrollerEl = document.getElementById('agenda-date-scroller');
    const selectedListEl = document.getElementById('agenda-selected-list');
    const allListEl = document.getElementById('agenda-all-list');
    const selectedTitleEl = document.getElementById('agenda-selected-title');
    const jumpDateInput = document.getElementById('agenda-jump-date');
    const btnGoToday = document.getElementById('btn-go-today');

    const deleteEvent = (id) => {
        agendaEvents = agendaEvents.filter(ev => ev.id !== id);
        triggerHaptic(20);
        renderDateScroller();
        renderAgendaView();
    };

    const createEventElement = (ev, showDateBadge = false) => {
        let badgeClass = '';
        if (ev.owner === 'VO') badgeClass = 'bg-muted';
        else if (ev.owner === 'Casal') badgeClass = 'bg-casal';

        const [y, m, d] = ev.date.split('-');
        const dateTag = showDateBadge ? `<span style="font-size: 0.75rem; background: var(--primary-light); color: var(--primary); padding: 2px 6px; border-radius: 6px; font-weight: 700; margin-right: 6px;">${d}/${m}</span>` : '';

        const li = document.createElement('li');
        li.className = 'task-item';
        li.innerHTML = `
            <div class="task-text">
                <strong style="font-size: 0.95rem; color: var(--text-main);">${ev.title}</strong>
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
                    ${dateTag}🕒 ${ev.time} ${ev.subtitle ? '• ' + ev.subtitle : ''}
                </div>
            </div>
            <div class="task-badge ${badgeClass}">${ev.owner === 'Casal' ? 'NÓS' : ev.owner}</div>
            <button class="btn-delete-event" title="Excluir compromisso"><i class="ph ph-trash"></i></button>
        `;

        li.querySelector('.btn-delete-event').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteEvent(ev.id);
        });

        return li;
    };

    const renderDateScroller = () => {
        if (!scrollerEl) return;
        scrollerEl.innerHTML = '';
        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        const [y, m, d] = selectedDateStr.split('-').map(Number);
        const baseDate = new Date(y, m - 1, d);

        for (let i = -4; i <= 10; i++) {
            const tempDate = new Date(baseDate);
            tempDate.setDate(baseDate.getDate() + i);
            const dateStr = getLocalDateString(tempDate);

            const hasEvent = agendaEvents.some(ev => ev.date === dateStr);
            const isActive = dateStr === selectedDateStr;

            const bubble = document.createElement('div');
            bubble.className = `date-bubble ${isActive ? 'active' : ''} ${hasEvent ? 'has-events' : ''}`;
            bubble.dataset.date = dateStr;
            bubble.innerHTML = `
                <span class="day-name">${diasSemana[tempDate.getDay()]}</span>
                <span class="day-number">${tempDate.getDate()}</span>
                <div class="event-dot"></div>
            `;

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
        if (!selectedListEl || !allListEl) return;
        selectedListEl.innerHTML = '';
        allListEl.innerHTML = '';

        const [y, m, d] = selectedDateStr.split('-');
        const todayStr = getLocalDateString(new Date());

        if (selectedDateStr === todayStr) {
            selectedTitleEl.textContent = `HOJE • ${d}/${m}/${y}`;
        } else {
            selectedTitleEl.textContent = `DIA SELECIONADO • ${d}/${m}/${y}`;
        }

        const selectedEvents = agendaEvents.filter(ev => ev.date === selectedDateStr);
        selectedEvents.sort((a, b) => a.time.localeCompare(b.time));

        if (selectedEvents.length === 0) {
            selectedListEl.innerHTML = `
                <li style="text-align:center; padding: 20px 0; color: var(--text-muted); font-size: 0.88rem;">
                    ☕ Dia livre por aqui! Nenhum compromisso nesta data.
                </li>
            `;
        } else {
            selectedEvents.forEach(ev => selectedListEl.appendChild(createEventElement(ev, false)));
        }

        const futureEvents = agendaEvents.filter(ev => ev.date >= todayStr);
        futureEvents.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

        if (futureEvents.length === 0) {
            allListEl.innerHTML = `
                <li style="text-align:center; padding: 20px 0; color: var(--text-muted); font-size: 0.88rem;">
                    Nenhum compromisso agendado para o futuro.
                </li>
            `;
        } else {
            futureEvents.forEach(ev => allListEl.appendChild(createEventElement(ev, true)));
        }
    };

    if (btnGoToday) {
        btnGoToday.addEventListener('click', () => {
            selectedDateStr = getLocalDateString(new Date());
            renderDateScroller();
            renderAgendaView();
            triggerHaptic(15);
            setTimeout(() => {
                const activeBubble = document.querySelector('.date-bubble.active');
                if (activeBubble) activeBubble.scrollIntoView({ behavior: 'smooth', inline: 'center' });
            }, 50);
        });
    }

    if (jumpDateInput) {
        const jumpLabel = jumpDateInput.previousElementSibling;
        if (jumpLabel) {
            jumpLabel.addEventListener('click', () => {
                if (typeof jumpDateInput.showPicker === 'function') jumpDateInput.showPicker();
                else jumpDateInput.click();
            });
        }
        jumpDateInput.addEventListener('change', (e) => {
            if (e.target.value) {
                selectedDateStr = e.target.value;
                renderDateScroller();
                renderAgendaView();
                triggerHaptic(15);
            }
        });
    }

    renderDateScroller();
    renderAgendaView();

    // ==========================================
    // 5. MÓDULO: METAS HÍBRIDAS
    // ==========================================
    let userGoals = [
        { id: 1, type: 'financial', title: 'Viagem de Fim de Ano', icon: '✈️', current: 4500, target: 6000, owner: 'Casal' },
        { id: 2, type: 'financial', title: 'Reserva de Emergência', icon: '🛡️', current: 4000, target: 10000, owner: 'Casal' },
        { id: 3, type: 'habit', title: 'Encontros Especiais (Date Nights)', icon: '🍷', current: 4, target: 12, unit: 'encontros', owner: 'Casal' },
        { id: 4, type: 'habit', title: 'Treinos em Dupla', icon: '🏃', current: 18, target: 50, unit: 'treinos', owner: 'Casal' }
    ];

    const goalsContainer = document.getElementById('goals-list-container');
    const metricGoalsSaved = document.getElementById('metric-goals-saved');
    const metricGoalsCount = document.getElementById('metric-goals-count');

    const formatCurrency = (val) => {
        return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const renderGoalsModule = () => {
        if (!goalsContainer) return;
        goalsContainer.innerHTML = '';

        let totalSaved = 0;

        if (userGoals.length === 0) {
            goalsContainer.innerHTML = `
                <div style="text-align:center; padding: 32px 0; color: var(--text-muted); font-size: 0.9rem;">
                    Nenhuma meta cadastrada. Clique no + acima para começar! 🎯
                </div>
            `;
        } else {
            userGoals.forEach(goal => {
                if (goal.type === 'financial') totalSaved += goal.current;

                const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));

                let badgeClass = '';
                if (goal.owner === 'VO') badgeClass = 'bg-muted';
                else if (goal.owner === 'Casal') badgeClass = 'bg-casal';

                const card = document.createElement('div');
                card.className = 'dash-card';
                card.style.flexDirection = 'column';
                card.style.alignItems = 'flex-start';
                card.style.gap = '12px';

                const textDetail = goal.type === 'financial'
                    ? `${formatCurrency(goal.current)} de ${formatCurrency(goal.target)}`
                    : `${goal.current} de ${goal.target} ${goal.unit || 'vezes'}`;

                const actionBtnHTML = goal.type === 'financial'
                    ? `<button class="btn-deposit btn-action-financial" title="Adicionar aporte">
                            <i class="ph ph-plus-circle"></i> Guardar
                       </button>`
                    : `<button class="btn-deposit btn-action-habit" title="Registrar repetição">
                            <i class="ph ph-check-circle"></i> +1 ${goal.unit ? goal.unit.slice(0, 7) : ''}
                       </button>`;

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                        <span class="dash-title">${goal.icon} ${goal.title}</span>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="dash-value" style="font-weight: 700; color: var(--primary); font-size: 0.95rem;">${percent}%</span>
                            <div class="task-badge ${badgeClass}" style="width: 24px; height: 24px; font-size: 0.65rem;">
                                ${goal.owner === 'Casal' ? 'NÓS' : goal.owner}
                            </div>
                        </div>
                    </div>
                    
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percent}%;"></div>
                    </div>

                    <div style="display: flex; justify-content: space-between; width: 100%; align-items: center; margin-top: 2px;">
                        <span class="dash-value">${textDetail}</span>
                        <div style="display: flex; align-items: center; gap: 4px;">
                            ${actionBtnHTML}
                            <button class="btn-delete-event btn-delete-goal" title="Excluir meta">
                                <i class="ph ph-trash"></i>
                            </button>
                        </div>
                    </div>
                `;

                const finBtn = card.querySelector('.btn-action-financial');
                if (finBtn) {
                    finBtn.addEventListener('click', () => {
                        triggerHaptic(10);
                        openDepositModal(goal.id);
                    });
                }

                const habitBtn = card.querySelector('.btn-action-habit');
                if (habitBtn) {
                    habitBtn.addEventListener('click', () => {
                        if (goal.current < goal.target) {
                            goal.current += 1;
                            triggerHaptic(20);
                            renderGoalsModule();
                        } else {
                            triggerHaptic(30);
                            alert('Meta já concluída! Parabéns, casal! 🎉');
                        }
                    });
                }

                card.querySelector('.btn-delete-goal').addEventListener('click', () => {
                    triggerHaptic(20);
                    userGoals = userGoals.filter(g => g.id !== goal.id);
                    renderGoalsModule();
                });

                goalsContainer.appendChild(card);
            });
        }

        if (metricGoalsSaved) metricGoalsSaved.textContent = formatCurrency(totalSaved);
        if (metricGoalsCount) metricGoalsCount.textContent = userGoals.length;
    };

    renderGoalsModule();

    // ==========================================
    // 6. MÓDULO: REGRAS DE FINANÇAS DO CASAL
    // ==========================================
    let coupleFinSettings = {
        model: '50/50', // Options: '50/50', 'proportional', 'single', 'custom'
        incomeIS: 4500,
        incomeVO: 4000,
        focus: 'acerto',
        configured: false
    };

    const finBannerTitle = document.getElementById('fin-banner-title');
    const finBannerSubtitle = document.getElementById('fin-banner-subtitle');
    const valFinM2 = document.getElementById('val-fin-m2');
    const propBarContainer = document.getElementById('fin-proportional-bar-container');
    const propValIS = document.getElementById('prop-val-is');
    const propValVO = document.getElementById('prop-val-vo');
    const propFillIS = document.getElementById('prop-fill-is');

    const updateFinancesUI = () => {
        if (!finBannerTitle || !valFinM2) return;

        if (!coupleFinSettings.configured) {
            finBannerTitle.textContent = "Como vocês dividem as contas?";
            finBannerSubtitle.textContent = "Clique para escolher entre 50/50, proporcional à renda ou conta conjunta.";
            valFinM2.textContent = "Definir";
            propBarContainer.style.display = 'none';
            return;
        }

        let modelLabel = "";
        if (coupleFinSettings.model === '50/50') {
            modelLabel = "50 / 50";
            finBannerTitle.textContent = "Regra Ativa: Divisão 50/50";
            finBannerSubtitle.textContent = "Cada um contribui exatamente com metade das despesas da casa.";
            propBarContainer.style.display = 'none';
        } else if (coupleFinSettings.model === 'proportional') {
            const total = coupleFinSettings.incomeIS + coupleFinSettings.incomeVO;
            const pctIS = Math.round((coupleFinSettings.incomeIS / total) * 100);
            const pctVO = 100 - pctIS;

            modelLabel = `${pctIS}% / ${pctVO}%`;
            finBannerTitle.textContent = `Regra Ativa: Proporcional à Renda`;
            finBannerSubtitle.textContent = `IS contribui com ${pctIS}% e VO contribui com ${pctVO}% das contas.`;

            if (propBarContainer && propValIS && propValVO && propFillIS) {
                propBarContainer.style.display = 'block';
                propValIS.textContent = `${pctIS}%`;
                propValVO.textContent = `${pctVO}%`;
                propFillIS.style.width = `${pctIS}%`;
            }
        } else if (coupleFinSettings.model === 'single') {
            modelLabel = "Conta Única";
            finBannerTitle.textContent = "Regra Ativa: Conta Conjunta Única";
            finBannerSubtitle.textContent = "Todas as entradas e saídas acontecem na mesma conta.";
            propBarContainer.style.display = 'none';
        } else {
            modelLabel = "Por Contas";
            finBannerTitle.textContent = "Regra Ativa: Contas Específicas";
            finBannerSubtitle.textContent = "Cada parceiro assume boletos fixos pré-definidos.";
            propBarContainer.style.display = 'none';
        }

        valFinM2.textContent = modelLabel;
    };

    // ==========================================
    // 7. MODAIS DO SISTEMA
    // ==========================================
    
    // Modal Compromisso
    const btnOpenModal = document.getElementById('btn-open-event-modal');
    const btnCloseModal = document.getElementById('btn-close-event-modal');
    const modalOverlay = document.getElementById('event-modal-overlay');
    const bottomSheet = document.getElementById('event-bottom-sheet');
    const formAddEvent = document.getElementById('form-add-event');

    const openModal = () => {
        triggerHaptic(10);
        modalOverlay.classList.add('active');
        bottomSheet.classList.add('active');
        document.getElementById('event-date').value = selectedDateStr;
    };
    const closeModal = () => {
        modalOverlay.classList.remove('active');
        bottomSheet.classList.remove('active');
        if (formAddEvent) formAddEvent.reset();
    };

    if (btnOpenModal) btnOpenModal.addEventListener('click', openModal);
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

    if (formAddEvent) {
        formAddEvent.addEventListener('submit', (e) => {
            e.preventDefault();
            agendaEvents.push({
                id: Date.now(),
                title: document.getElementById('event-title').value,
                date: document.getElementById('event-date').value,
                time: document.getElementById('event-time').value,
                owner: document.getElementById('event-owner').value,
                subtitle: document.getElementById('event-subtitle').value
            });
            renderDateScroller();
            renderAgendaView();
            triggerHaptic(30);
            closeModal();
        });
    }

    // Modal Nova Meta
    const btnOpenGoalModal = document.getElementById('btn-open-goal-modal');
    const btnCloseGoalModal = document.getElementById('btn-close-goal-modal');
    const goalModalOverlay = document.getElementById('goal-modal-overlay');
    const goalBottomSheet = document.getElementById('goal-bottom-sheet');
    const formAddGoal = document.getElementById('form-add-goal');
    const goalTypeSelect = document.getElementById('goal-type');
    const groupFinancial = document.getElementById('group-goal-financial');
    const groupHabit = document.getElementById('group-goal-habit');

    if (goalTypeSelect) {
        goalTypeSelect.addEventListener('change', (e) => {
            if (e.target.value === 'financial') {
                groupFinancial.style.display = 'flex';
                groupHabit.style.display = 'none';
            } else {
                groupFinancial.style.display = 'none';
                groupHabit.style.display = 'flex';
            }
        });
    }

    const openGoalModal = () => {
        triggerHaptic(10);
        goalModalOverlay.classList.add('active');
        goalBottomSheet.classList.add('active');
    };
    const closeGoalModal = () => {
        goalModalOverlay.classList.remove('active');
        goalBottomSheet.classList.remove('active');
        if (formAddGoal) formAddGoal.reset();
    };

    if (btnOpenGoalModal) btnOpenGoalModal.addEventListener('click', openGoalModal);
    if (btnCloseGoalModal) btnCloseGoalModal.addEventListener('click', closeGoalModal);
    if (goalModalOverlay) goalModalOverlay.addEventListener('click', closeGoalModal);

    if (formAddGoal) {
        formAddGoal.addEventListener('submit', (e) => {
            e.preventDefault();
            const type = goalTypeSelect.value;
            const title = document.getElementById('goal-title').value;
            const icon = document.getElementById('goal-icon').value || '🎯';
            const owner = document.getElementById('goal-owner').value;

            if (type === 'financial') {
                const target = parseFloat(document.getElementById('goal-target-fin').value) || 0;
                const current = parseFloat(document.getElementById('goal-initial-fin').value) || 0;
                userGoals.push({ id: Date.now(), type, title, icon, owner, target, current });
            } else {
                const target = parseInt(document.getElementById('goal-target-habit').value) || 10;
                const unit = document.getElementById('goal-unit-habit').value || 'vezes';
                userGoals.push({ id: Date.now(), type, title, icon, owner, target, current: 0, unit });
            }

            triggerHaptic(30);
            renderGoalsModule();
            closeGoalModal();
        });
    }

    // Modal Aporte
    const btnCloseDepositModal = document.getElementById('btn-close-deposit-modal');
    const depositModalOverlay = document.getElementById('deposit-modal-overlay');
    const depositBottomSheet = document.getElementById('deposit-bottom-sheet');
    const formAddDeposit = document.getElementById('form-add-deposit');

    const openDepositModal = (goalId) => {
        document.getElementById('deposit-goal-id').value = goalId;
        depositModalOverlay.classList.add('active');
        depositBottomSheet.classList.add('active');
    };
    const closeDepositModal = () => {
        depositModalOverlay.classList.remove('active');
        depositBottomSheet.classList.remove('active');
        if (formAddDeposit) formAddDeposit.reset();
    };

    if (btnCloseDepositModal) btnCloseDepositModal.addEventListener('click', closeDepositModal);
    if (depositModalOverlay) depositModalOverlay.addEventListener('click', closeDepositModal);

    if (formAddDeposit) {
        formAddDeposit.addEventListener('submit', (e) => {
            e.preventDefault();
            const goalId = parseInt(document.getElementById('deposit-goal-id').value);
            const amount = parseFloat(document.getElementById('deposit-amount').value);

            const targetGoal = userGoals.find(g => g.id === goalId);
            if (targetGoal && !isNaN(amount) && amount > 0) {
                targetGoal.current += amount;
                triggerHaptic(30);
                renderGoalsModule();
            }
            closeDepositModal();
        });
    }

    // Modal Configuração de Finanças (Onboarding)
    const btnOpenFinSetup = document.getElementById('btn-open-fin-setup');
    const btnCloseFinSetup = document.getElementById('btn-close-fin-setup');
    const finSetupBanner = document.getElementById('fin-setup-banner');
    const finSetupOverlay = document.getElementById('fin-setup-modal-overlay');
    const finSetupSheet = document.getElementById('fin-setup-bottom-sheet');
    const formFinSetup = document.getElementById('form-fin-setup');
    const finModelSelect = document.getElementById('fin-model-select');
    const finIncomeInputs = document.getElementById('fin-income-inputs');

    const openFinSetupModal = () => {
        triggerHaptic(10);
        finSetupOverlay.classList.add('active');
        finSetupSheet.classList.add('active');
    };

    const closeFinSetupModal = () => {
        finSetupOverlay.classList.remove('active');
        finSetupSheet.classList.remove('active');
    };

    if (finModelSelect) {
        finModelSelect.addEventListener('change', (e) => {
            if (e.target.value === 'proportional') {
                finIncomeInputs.style.display = 'block';
            } else {
                finIncomeInputs.style.display = 'none';
            }
        });
    }

    if (btnOpenFinSetup) btnOpenFinSetup.addEventListener('click', openFinSetupModal);
    if (finSetupBanner) finSetupBanner.addEventListener('click', openFinSetupModal);
    if (btnCloseFinSetup) btnCloseFinSetup.addEventListener('click', closeFinSetupModal);
    if (finSetupOverlay) finSetupOverlay.addEventListener('click', closeFinSetupModal);

    if (formFinSetup) {
        formFinSetup.addEventListener('submit', (e) => {
            e.preventDefault();
            
            coupleFinSettings.model = finModelSelect.value;
            coupleFinSettings.incomeIS = parseFloat(document.getElementById('fin-income-is').value) || 0;
            coupleFinSettings.incomeVO = parseFloat(document.getElementById('fin-income-vo').value) || 0;
            coupleFinSettings.focus = document.getElementById('fin-focus-select').value;
            coupleFinSettings.configured = true;

            triggerHaptic(30);
            updateFinancesUI();
            closeFinSetupModal();
        });
    }

    updateFinancesUI();

});