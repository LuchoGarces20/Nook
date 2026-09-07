// js/modules/lists.js
import { store } from '../store.js';
import { triggerHaptic, escapeHTML, getAvatarHtml, openModal, closeAllModals, enableDesktopScroll } from '../utils.js';

let activeListId = 'atividades';
let draggedItemIndex = null;
let activeFilter = 'all';

const togglePriority = (current) => {
    if (!current || current === 'none') return 'urgent';
    if (current === 'urgent') return 'casual';
    return 'none';
};

export const renderLists = () => {
    const tabsContainer = document.getElementById('lists-tabs-container');
    const taskContainer = document.getElementById('task-list-container');
    if (!tabsContainer || !taskContainer) return;

    const currentList = store.lists.find(l => l.id === activeListId) || store.lists[0];
    if (document.getElementById('active-list-header-title')) {
        document.getElementById('active-list-header-title').textContent = currentList.name;
    }

    // 1. RENDERIZAR ABAS COM INDICADOR VISUAL DE MÓDULO DE DECISÃO
    tabsContainer.innerHTML = '';
    store.lists.forEach(list => {
        const btn = document.createElement('button');
        const isDecision = list.type === 'decision';
        const isActive = list.id === activeListId;
        
        btn.className = `tab-pill ${isActive ? 'active' : 'outline'} ${isDecision ? 'tab-decision' : ''}`;
        btn.innerHTML = isDecision ? `<i class="ph-bold ph-dice-five" style="margin-right: 4px;"></i>${list.name}` : list.name;
        
        btn.addEventListener('click', () => { 
            triggerHaptic(10); 
            activeListId = list.id; 
            renderLists(); 
        });
        tabsContainer.appendChild(btn);
    });

    // Botão Criar Lista (Permite escolher tipo)
    const btnAddList = document.createElement('button');
    btnAddList.className = 'tab-pill outline text-primary';
    btnAddList.innerHTML = '<i class="ph ph-plus"></i>';
    btnAddList.title = 'Criar Lista ou Módulo de Decisão';
    btnAddList.addEventListener('click', () => {
        openModal('create-list-bottom-sheet');
    });
    tabsContainer.appendChild(btnAddList);

    // Habilita scroll/arraste no desktop para as abas de listas
    enableDesktopScroll(tabsContainer);

    // 2. BANNER DE DECISÃO RÁPIDA (SORTEADOR "DECIDIR POR NÓS!")
    const decisionBanner = document.getElementById('decision-roulette-banner');
    if (decisionBanner) {
        if (currentList.type === 'decision') {
            decisionBanner.style.display = 'flex';
            document.getElementById('decision-banner-title').textContent = `Dúvida no ${currentList.name}?`;
        } else {
            decisionBanner.style.display = 'none';
        }
    }

    // 3. FILTROS DE RESPONSÁVEL
    const sectionTitle = document.getElementById('lists-section-title');
    let filtersContainer = document.getElementById('list-filters-container');
    if (!filtersContainer && sectionTitle) {
        filtersContainer = document.createElement('div');
        filtersContainer.id = 'list-filters-container';
        filtersContainer.className = 'tabs';
        filtersContainer.style.cssText = 'margin: 12px 0 16px 0; padding-bottom: 4px;';
        sectionTitle.parentNode.insertBefore(filtersContainer, sectionTitle.nextSibling);
    }

    if (filtersContainer) {
        filtersContainer.innerHTML = '';
        const p1Name = store.profile?.p1 || 'Minhas';
        const p2Name = store.profile?.p2 || 'Parceiro';
        const filters = [
            { id: 'all', label: 'Todas' },
            { id: 'IS', label: p1Name },
            { id: 'VO', label: p2Name },
            { id: 'Casal', label: 'Nós (Casal)' }
        ];
        filters.forEach(f => {
            const btn = document.createElement('button');
            btn.className = `tab-pill ${activeFilter === f.id ? 'active' : 'outline'}`;
            btn.style.cssText = 'padding: 6px 14px; font-size: 0.8rem;';
            btn.textContent = f.label;
            btn.addEventListener('click', () => {
                triggerHaptic(10);
                activeFilter = f.id;
                renderLists();
            });
            filtersContainer.appendChild(btn);
        });

        // Habilita scroll/arraste no desktop para os filtros
        enableDesktopScroll(filtersContainer);
    }

    // 4. RENDERIZAR ITENS DA LISTA
    taskContainer.innerHTML = '';
    const filteredItems = activeFilter === 'all' ? currentList.items : currentList.items.filter(i => i.owner === activeFilter);
    const pendingCount = filteredItems.filter(i => !i.completed).length;

    if (sectionTitle) sectionTitle.textContent = `PENDENTES (${pendingCount})`;

    if (filteredItems.length === 0) {
        taskContainer.innerHTML = `<li style="text-align:center; padding: 24px 0; color: var(--text-muted); font-size: 0.88rem;">Nenhum item nesta lista.</li>`;
    } else {
        filteredItems.forEach((item) => {
            let priorityUI = '<i class="ph ph-flag text-muted"></i>';
            let prioritySubtext = '';
            if (item.priority === 'urgent') { priorityUI = '🔴'; prioritySubtext = '<span style="font-size: 0.65rem; color: #E63946; font-weight: 700; margin-top: 2px;">Urgente</span>'; }
            else if (item.priority === 'casual') { priorityUI = '🟢'; prioritySubtext = '<span style="font-size: 0.65rem; color: #2A9D8F; font-weight: 700; margin-top: 2px;">Quando der</span>'; }

            const li = document.createElement('li');
            li.className = `task-item ${item.completed ? 'completed' : ''}`;
            li.draggable = true;
            li.dataset.id = item.id;

            li.innerHTML = `
                <div class="checkbox"><i class="ph-bold ph-check"></i></div>
                <div class="task-content" style="flex: 1; display: flex; flex-direction: column;" title="Arraste para reordenar">
                    <span class="task-text">${escapeHTML(item.text)}</span>
                    ${prioritySubtext}
                </div>
                <button class="btn-priority">${priorityUI}</button>
                ${getAvatarHtml(item.owner)}
                <button class="btn-edit-item" title="Editar Tarefa"><i class="ph ph-pencil-simple"></i></button>
                <button class="btn-delete-event"><i class="ph ph-trash"></i></button>
            `;

            li.querySelector('.checkbox').addEventListener('click', () => { item.completed = !item.completed; store.setLists([...store.lists]); renderLists(); });
            li.querySelector('.btn-delete-event').addEventListener('click', () => { currentList.items = currentList.items.filter(i => i.id !== item.id); store.setLists([...store.lists]); renderLists(); });
            li.querySelector('.btn-priority').addEventListener('click', () => { item.priority = togglePriority(item.priority); store.setLists([...store.lists]); renderLists(); });
            li.querySelector('.btn-edit-item').addEventListener('click', () => {
                document.getElementById('edit-task-id').value = item.id;
                document.getElementById('edit-task-text').value = item.text;
                document.getElementById('edit-task-owner').value = item.owner || 'Casal';
                openModal('task-edit-bottom-sheet');
            });

            // Drag and drop
            li.addEventListener('dragstart', () => { draggedItemIndex = currentList.items.findIndex(i => i.id === item.id); setTimeout(() => li.classList.add('dragging'), 0); });
            li.addEventListener('dragover', (e) => { e.preventDefault(); li.classList.add('drag-over'); });
            li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
            li.addEventListener('drop', (e) => {
                e.stopPropagation(); li.classList.remove('drag-over');
                if (draggedItemIndex !== null) {
                    const dropTargetIndex = currentList.items.findIndex(i => i.id === item.id);
                    if (draggedItemIndex !== dropTargetIndex && dropTargetIndex !== -1) {
                        const items = currentList.items;
                        const [draggedItem] = items.splice(draggedItemIndex, 1);
                        items.splice(dropTargetIndex, 0, draggedItem);
                        store.setLists([...store.lists]); renderLists();
                    }
                }
            });
            li.addEventListener('dragend', () => { li.classList.remove('dragging'); li.classList.remove('drag-over'); draggedItemIndex = null; });

            taskContainer.appendChild(li);
        });
    }
};

// MOTOR DA ROLETA DE DECISÃO RÁPIDA
const runDecisionRoulette = () => {
    const currentList = store.lists.find(l => l.id === activeListId);
    if (!currentList) return;

    const pending = currentList.items.filter(i => !i.completed);
    if (pending.length === 0) {
        alert('Todos os itens dessa lista já foram concluídos! Adicione mais opções.');
        return;
    }

    const modalTitle = document.getElementById('roulette-modal-title');
    const resultBox = document.getElementById('roulette-result-display');
    const btnConfirm = document.getElementById('btn-accept-decision');

    modalTitle.textContent = `Sortear: ${currentList.name}`;
    resultBox.textContent = "Girando a roleta...";
    btnConfirm.style.display = 'none';

    openModal('roulette-bottom-sheet');

    // Efeito Visual de Sorteio (Embaralhar rápido por 2 segundos)
    let counter = 0;
    const interval = setInterval(() => {
        triggerHaptic(10);
        const randomTemp = pending[Math.floor(Math.random() * pending.length)];
        resultBox.textContent = randomTemp.text;
        counter++;

        if (counter > 15) {
            clearInterval(interval);
            // Escolha final real
            const chosen = pending[Math.floor(Math.random() * pending.length)];
            resultBox.textContent = chosen.text;
            btnConfirm.style.display = 'block';

            triggerHaptic([100, 50, 100, 50, 200]);
            if (window.confetti) confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } });

            btnConfirm.onclick = () => {
                chosen.completed = true;
                store.setLists([...store.lists]);
                renderLists();
                closeAllModals(true);
            };
        }
    }, 100);
};

export const initLists = () => {
    document.getElementById('btn-list-options')?.addEventListener('click', () => openModal('list-options-bottom-sheet'));

    // Form Criar Nova Lista / Módulo de Decisão
    document.getElementById('form-create-list')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('create-list-name').value.trim();
        const type = document.getElementById('create-list-type').value;

        if (name) {
            const newList = {
                id: 'list_' + Date.now(),
                name,
                type,
                items: []
            };
            store.setLists([...store.lists, newList]);
            activeListId = newList.id;
            renderLists();
            closeAllModals(true);
        }
    });

    // Evento do Botão Sorteador
    document.getElementById('btn-trigger-roulette')?.addEventListener('click', () => {
        triggerHaptic(20);
        runDecisionRoulette();
    });

    // Form Editar Tarefa
    document.getElementById('form-edit-task')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const taskId = parseInt(document.getElementById('edit-task-id').value);
        const currentList = store.lists.find(l => l.id === activeListId);
        const targetTask = currentList?.items.find(i => i.id === taskId);

        if (targetTask) {
            targetTask.text = document.getElementById('edit-task-text').value.trim();
            targetTask.owner = document.getElementById('edit-task-owner').value;
            store.setLists([...store.lists]);
            renderLists(); closeAllModals(true);
        }
    });

    // Form Nova Tarefa
    document.getElementById('form-add-task')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = document.getElementById('input-task-text').value.trim();
        const owner = document.getElementById('input-task-owner').value;
        if (!text) return;
        const currentList = store.lists.find(l => l.id === activeListId);
        if (currentList) {
            if (activeFilter !== 'all' && activeFilter !== owner) activeFilter = 'all';
            currentList.items.push({ id: Date.now(), text, completed: false, priority: 'none', owner });
            store.setLists([...store.lists]);
            document.getElementById('input-task-text').value = ''; 
            renderLists();
        }
    });

    document.getElementById('btn-list-archive')?.addEventListener('click', () => {
        const currentList = store.lists.find(l => l.id === activeListId);
        if (currentList) {
            currentList.items = currentList.items.filter(i => !i.completed);
            store.setLists([...store.lists]); renderLists();
        }
    });

    if (store.lists.length > 0) activeListId = store.lists[0].id;
    renderLists();
};