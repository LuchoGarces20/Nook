import { store } from '../store.js';
import { triggerHaptic, escapeHTML, getAvatarHtml, openModal, closeAllModals } from '../utils.js';

let activeListId = 'atividades';
let draggedItemIndex = null;
let activeFilter = 'all'; // NOVO: Controle do filtro ativo da lista

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
    if(document.getElementById('active-list-header-title')) document.getElementById('active-list-header-title').textContent = currentList.name;

    // Renderizando as Abas das Listas (Mercado, Casa, etc.)
    tabsContainer.innerHTML = '';
    store.lists.forEach(list => {
        const btn = document.createElement('button');
        btn.className = `tab-pill ${list.id === activeListId ? 'active' : 'outline'}`;
        btn.textContent = list.name;
        btn.addEventListener('click', () => { triggerHaptic(10); activeListId = list.id; renderLists(); });
        tabsContainer.appendChild(btn);
    });

    const btnAddList = document.createElement('button');
    btnAddList.className = 'tab-pill outline text-primary';
    btnAddList.innerHTML = '<i class="ph ph-plus"></i>';
    btnAddList.addEventListener('click', () => {
        const listName = prompt('Nome da nova lista:');
        if (listName?.trim()) {
            const newList = { id: 'list_' + Date.now(), name: listName.trim(), items: [] };
            store.setLists([...store.lists, newList]);
            activeListId = newList.id; renderLists();
        }
    });
    tabsContainer.appendChild(btnAddList);

    // --- NOVO: Renderiza o Filtro de Responsável ---
    const sectionTitle = document.getElementById('lists-section-title');
    let filtersContainer = document.getElementById('list-filters-container');

    if (!filtersContainer && sectionTitle) {
        filtersContainer = document.createElement('div');
        filtersContainer.id = 'list-filters-container';
        filtersContainer.className = 'tabs';
        filtersContainer.style.cssText = 'margin: 12px 0 16px 12px; padding-bottom: 4px;'; // Alinhado visualmente
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
    }
    // -----------------------------------------------

    taskContainer.innerHTML = '';
    
    // Aplica o filtro na lista de itens visualmente
    const filteredItems = activeFilter === 'all' ? currentList.items : currentList.items.filter(i => i.owner === activeFilter);
    const pendingCount = filteredItems.filter(i => !i.completed).length;
    
    if (sectionTitle) sectionTitle.textContent = `PENDENTES (${pendingCount})`;

    if (filteredItems.length === 0) {
        taskContainer.innerHTML = `<li style="text-align:center; padding: 24px 0; color: var(--text-muted); font-size: 0.88rem;">Nenhum item encontrado.</li>`;
    } else {
        filteredItems.forEach((item) => {
            let priorityUI = '<i class="ph ph-flag text-muted"></i>';
            let prioritySubtext = '';
            if (item.priority === 'urgent') { priorityUI = '🚩'; prioritySubtext = '<span style="font-size: 0.65rem; color: #E63946; font-weight: 700; margin-top: 2px;">Urgente</span>'; }
            else if (item.priority === 'casual') { priorityUI = '🏖️'; prioritySubtext = '<span style="font-size: 0.65rem; color: #2A9D8F; font-weight: 700; margin-top: 2px;">Quando der</span>'; }

            const li = document.createElement('li');
            li.className = `task-item ${item.completed ? 'completed' : ''}`;
            li.draggable = true;
            li.dataset.id = item.id; // Guarda o ID para o drag and drop funcionar com filtros
            
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

            li.querySelector('.checkbox').addEventListener('click', () => { triggerHaptic(15); item.completed = !item.completed; store.setLists([...store.lists]); renderLists(); });
            li.querySelector('.btn-delete-event').addEventListener('click', () => { triggerHaptic(20); currentList.items = currentList.items.filter(i => i.id !== item.id); store.setLists([...store.lists]); renderLists(); });
            li.querySelector('.btn-priority').addEventListener('click', () => { item.priority = togglePriority(item.priority); store.setLists([...store.lists]); renderLists(); });
            
            // Editar Tarefa (Abre Modal)
            li.querySelector('.btn-edit-item').addEventListener('click', () => {
                document.getElementById('edit-task-id').value = item.id;
                document.getElementById('edit-task-text').value = item.text;
                document.getElementById('edit-task-owner').value = item.owner || 'Casal';
                openModal('task-edit-bottom-sheet');
            });

            // DRAG AND DROP (Ajustado para encontrar o index real ignorando os filtros)
            li.addEventListener('dragstart', (e) => { 
                draggedItemIndex = currentList.items.findIndex(i => i.id === item.id); 
                setTimeout(() => li.classList.add('dragging'), 0); 
            });
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
                        store.setLists([...store.lists]); triggerHaptic(20); renderLists();
                    }
                }
            });
            li.addEventListener('dragend', () => { li.classList.remove('dragging'); li.classList.remove('drag-over'); draggedItemIndex = null; });
            
            taskContainer.appendChild(li);
        });
    }
};

export const initLists = () => {
    document.getElementById('btn-list-options')?.addEventListener('click', () => openModal('list-options-bottom-sheet'));

    // Edição da Tarefa Existente
    document.getElementById('form-edit-task')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const taskId = parseInt(document.getElementById('edit-task-id').value);
        const currentList = store.lists.find(l => l.id === activeListId);
        const targetTask = currentList?.items.find(i => i.id === taskId);
        
        if (targetTask) {
            targetTask.text = document.getElementById('edit-task-text').value.trim();
            targetTask.owner = document.getElementById('edit-task-owner').value;
            store.setLists([...store.lists]);
            triggerHaptic(20); renderLists(); closeAllModals();
        }
    });

    // Nova Tarefa
    document.getElementById('form-add-task')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = document.getElementById('input-task-text').value.trim();
        const owner = document.getElementById('input-task-owner').value;
        if (!text) return;
        const currentList = store.lists.find(l => l.id === activeListId);
        if (currentList) {
            // Regra: Se a pessoa adicionar uma tarefa, forçamos o filtro para mostrar a nova tarefa!
            if (activeFilter !== 'all' && activeFilter !== owner) activeFilter = 'all';
            
            currentList.items.push({ id: Date.now(), text, completed: false, priority: 'none', owner });
            store.setLists([...store.lists]);
            triggerHaptic(20); document.getElementById('input-task-text').value = ''; renderLists();
        }
    });

    document.getElementById('btn-list-archive')?.addEventListener('click', () => {
        const currentList = store.lists.find(l => l.id === activeListId);
        if (currentList) {
            currentList.items = currentList.items.filter(i => !i.completed);
            store.setLists([...store.lists]); triggerHaptic(25); renderLists();
        }
    });
    
    if (store.lists.length > 0) activeListId = store.lists[0].id;
    renderLists();
};