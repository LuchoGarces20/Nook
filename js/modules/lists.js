import { store } from '../store.js';
import { triggerHaptic, escapeHTML, getAvatarHtml, openModal, closeAllModals } from '../utils.js';

let activeListId = 'atividades';
let draggedItemIndex = null;

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
    
    // Atualiza os labels dos selects dinamicamente
    if (store.profile) {
        const updateSelectNames = (prefix) => {
            const optP1 = document.getElementById(`opt-${prefix}-p1`);
            const optP2 = document.getElementById(`opt-${prefix}-p2`);
            if (optP1) optP1.textContent = store.profile.p1;
            if (optP2) optP2.textContent = store.profile.p2;
        };
        updateSelectNames('owner');
        updateSelectNames('edit-task');
    }

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

    taskContainer.innerHTML = '';
    const pendingItems = currentList.items.filter(i => !i.completed);
    document.getElementById('lists-section-title').textContent = `PENDENTES (${pendingItems.length})`;

    if (currentList.items.length === 0) {
        taskContainer.innerHTML = `<li style="text-align:center; padding: 24px 0; color: var(--text-muted); font-size: 0.88rem;">Nenhum item nesta lista.</li>`;
    } else {
        currentList.items.forEach((item, index) => {
            let priorityUI = '<i class="ph ph-flag text-muted"></i>';
            let prioritySubtext = '';
            if (item.priority === 'urgent') { priorityUI = '🚩'; prioritySubtext = '<span style="font-size: 0.65rem; color: #E63946; font-weight: 700; margin-top: 2px;">Urgente</span>'; }
            else if (item.priority === 'casual') { priorityUI = '🏖️'; prioritySubtext = '<span style="font-size: 0.65rem; color: #2A9D8F; font-weight: 700; margin-top: 2px;">Quando der</span>'; }

            const li = document.createElement('li');
            li.className = `task-item ${item.completed ? 'completed' : ''}`;
            li.draggable = true;
            li.dataset.index = index;
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

            // DRAG AND DROP
            li.addEventListener('dragstart', (e) => { draggedItemIndex = index; setTimeout(() => li.classList.add('dragging'), 0); });
            li.addEventListener('dragover', (e) => { e.preventDefault(); li.classList.add('drag-over'); });
            li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
            li.addEventListener('drop', (e) => {
                e.stopPropagation(); li.classList.remove('drag-over');
                if (draggedItemIndex !== null && draggedItemIndex !== index) {
                    const items = currentList.items;
                    const [draggedItem] = items.splice(draggedItemIndex, 1);
                    items.splice(index, 0, draggedItem);
                    store.setLists([...store.lists]); triggerHaptic(20); renderLists();
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

    // Nova Tarefa (Agora pega o responsável do mini Select)
    document.getElementById('form-add-task')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = document.getElementById('input-task-text').value.trim();
        const owner = document.getElementById('input-task-owner').value;
        if (!text) return;
        const currentList = store.lists.find(l => l.id === activeListId);
        if (currentList) {
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