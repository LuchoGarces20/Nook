import { store } from '../store.js';
import { triggerHaptic, getInitials, escapeHTML } from '../utils.js';

let activeListId = 'atividades';
let draggedItemIndex = null; // Guarda o índice de quem está sendo arrastado

// Rotaciona a prioridade: null -> 'urgent' -> 'casual' -> null
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

    const p1Init = store.profile ? getInitials(store.profile.p1) : 'IS';
    const p2Init = store.profile ? getInitials(store.profile.p2) : 'VO';

    // 1. Renderiza as Abas Superiores
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
        triggerHaptic(15);
        const listName = prompt('Nome da nova lista:');
        if (listName?.trim()) {
            const newList = { id: 'list_' + Date.now(), name: listName.trim(), items: [] };
            store.setLists([...store.lists, newList]);
            activeListId = newList.id;
            renderLists();
        }
    });
    tabsContainer.appendChild(btnAddList);

    // 2. Renderiza os Itens
    taskContainer.innerHTML = '';
    const pendingItems = currentList.items.filter(i => !i.completed);
    if(document.getElementById('lists-section-title')) document.getElementById('lists-section-title').textContent = `PENDENTES (${pendingItems.length})`;

    if (currentList.items.length === 0) {
        taskContainer.innerHTML = `<li style="text-align:center; padding: 24px 0; color: var(--text-muted); font-size: 0.88rem;">Nenhum item nesta lista. Adicione um abaixo!</li>`;
    } else {
        currentList.items.forEach((item, index) => {
            let displayOwner = item.owner;
            if (item.owner === 'VO') displayOwner = p2Init;
            if (item.owner === 'IS') displayOwner = p1Init;
            let badgeClass = (item.owner === 'VO' || item.owner === p2Init) ? 'bg-muted' : '';
            if (item.owner === 'Casal') { badgeClass = 'bg-casal'; displayOwner = 'NÓS'; }

            const safeText = escapeHTML(item.text);
            
            // Configura a UI de Urgência
            let priorityUI = '<i class="ph ph-flag text-muted"></i>';
            let prioritySubtext = '';
            if (item.priority === 'urgent') {
                priorityUI = '🔴';
                prioritySubtext = '<span style="font-size: 0.65rem; color: #E63946; font-weight: 700; margin-top: 2px;">Urgente</span>';
            } else if (item.priority === 'casual') {
                priorityUI = '🟢';
                prioritySubtext = '<span style="font-size: 0.65rem; color: #2A9D8F; font-weight: 700; margin-top: 2px;">Quando der</span>';
            }

            const li = document.createElement('li');
            li.className = `task-item ${item.completed ? 'completed' : ''}`;
            li.draggable = true; // ATIVA API HTML5
            li.dataset.index = index;

            li.innerHTML = `
                <div class="checkbox"><i class="ph-bold ph-check"></i></div>
                
                <div class="task-content" style="flex: 1; display: flex; flex-direction: column;" title="Segure e arraste para reordenar">
                    <span class="task-text">${safeText}</span>
                    ${prioritySubtext}
                </div>
                
                <button class="btn-priority" title="Marcar prioridade">${priorityUI}</button>
                <div class="task-badge ${badgeClass}">${displayOwner}</div>
                <button class="btn-delete-event"><i class="ph ph-trash"></i></button>
            `;

            // --- LISTENERS DE AÇÕES COMUNS ---
            li.querySelector('.checkbox').addEventListener('click', () => {
                triggerHaptic(15);
                item.completed = !item.completed;
                store.setLists([...store.lists]);
                renderLists();
            });

            li.querySelector('.btn-delete-event').addEventListener('click', () => {
                triggerHaptic(20);
                currentList.items = currentList.items.filter(i => i.id !== item.id);
                store.setLists([...store.lists]);
                renderLists();
            });
            
            li.querySelector('.btn-priority').addEventListener('click', (e) => {
                triggerHaptic(15);
                item.priority = togglePriority(item.priority);
                store.setLists([...store.lists]);
                renderLists();
            });

            // --- LISTENERS: DRAG AND DROP HTML5 ---
            li.addEventListener('dragstart', (e) => {
                draggedItemIndex = index;
                e.dataTransfer.effectAllowed = 'move';
                // Timeout permite que a API nativa gere a "imagem fantasma" antes de escurecer a linha original
                setTimeout(() => li.classList.add('dragging'), 0);
                triggerHaptic(10);
            });

            li.addEventListener('dragover', (e) => {
                e.preventDefault(); // Obrigatório para permitir o drop
                e.dataTransfer.dropEffect = 'move';
                li.classList.add('drag-over');
            });

            li.addEventListener('dragleave', () => {
                li.classList.remove('drag-over');
            });

            li.addEventListener('drop', (e) => {
                e.stopPropagation();
                li.classList.remove('drag-over');
                
                const dropIndex = index;
                
                // Se arrastou para um lugar diferente do original
                if (draggedItemIndex !== null && draggedItemIndex !== dropIndex) {
                    const items = currentList.items;
                    // Remove o item da posição velha e insere na nova
                    const [draggedItem] = items.splice(draggedItemIndex, 1);
                    items.splice(dropIndex, 0, draggedItem);
                    
                    store.setLists([...store.lists]);
                    triggerHaptic(20);
                    renderLists();
                }
                return false;
            });

            li.addEventListener('dragend', () => {
                li.classList.remove('dragging');
                li.classList.remove('drag-over');
                draggedItemIndex = null;
            });

            taskContainer.appendChild(li);
        });
    }

    if(document.getElementById('metric-lists-count')) document.getElementById('metric-lists-count').textContent = store.lists.length;
    if(document.getElementById('metric-pending-count')) document.getElementById('metric-pending-count').textContent = pendingItems.length;
};

export const initLists = () => {
    // Lógica do Modal de Opções (renomear, excluir)
    const btnOptions = document.getElementById('btn-list-options');
    const overlayList = document.getElementById('list-options-modal-overlay');
    const sheetList = document.getElementById('list-options-bottom-sheet');
    const btnCloseOptions = document.getElementById('btn-close-list-options');
    const btnRename = document.getElementById('btn-rename-list');
    const btnDelete = document.getElementById('btn-delete-list');

    const closeOptions = () => {
        overlayList?.classList.remove('active');
        sheetList?.classList.remove('active');
    };

    btnOptions?.addEventListener('click', () => {
        const currentList = store.lists.find(l => l.id === activeListId);
        if (!currentList) return;
        document.getElementById('list-options-title').textContent = currentList.name;
        triggerHaptic(10);
        overlayList.classList.add('active');
        sheetList.classList.add('active');
    });

    btnCloseOptions?.addEventListener('click', closeOptions);
    overlayList?.addEventListener('click', closeOptions);

    btnRename?.addEventListener('click', () => {
        const currentList = store.lists.find(l => l.id === activeListId);
        if (currentList) {
            const newName = prompt('Novo nome para a lista:', currentList.name);
            if (newName && newName.trim()) {
                currentList.name = newName.trim();
                store.setLists([...store.lists]);
                renderLists();
                triggerHaptic(20);
            }
        }
        closeOptions();
    });

    btnDelete?.addEventListener('click', () => {
        const currentList = store.lists.find(l => l.id === activeListId);
        if (currentList) {
            if (confirm(`Tem certeza que deseja excluir a lista "${currentList.name}"?`)) {
                let newLists = store.lists.filter(l => l.id !== activeListId);
                if (newLists.length === 0) {
                    newLists.push({ id: 'list_' + Date.now(), name: 'Nova Lista', items: [] });
                }
                store.setLists(newLists);
                activeListId = newLists[0].id; 
                renderLists();
                triggerHaptic(30);
            }
        }
        closeOptions();
    });

    // Lógica de Adicionar Nova Tarefa
    const formAddTask = document.getElementById('form-add-task');
    const inputTaskText = document.getElementById('input-task-text');
    const btnListArchive = document.getElementById('btn-list-archive');

    if (formAddTask) {
        formAddTask.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = inputTaskText.value.trim();
            if (!text) return;
            const currentList = store.lists.find(l => l.id === activeListId);
            if (currentList) {
                currentList.items.push({ 
                    id: Date.now(), 
                    text, 
                    completed: false, 
                    priority: 'none', // Nasce sem prioridade por padrão
                    owner: store.profile ? getInitials(store.profile.p1) : 'IS' 
                });
                store.setLists([...store.lists]);
                triggerHaptic(20);
                inputTaskText.value = '';
                renderLists();
            }
        });
    }

    if (btnListArchive) {
        btnListArchive.addEventListener('click', () => {
            const currentList = store.lists.find(l => l.id === activeListId);
            if (currentList) {
                const initialCount = currentList.items.length;
                currentList.items = currentList.items.filter(i => !i.completed);
                if (currentList.items.length < initialCount) {
                    store.setLists([...store.lists]);
                    triggerHaptic(25);
                    renderLists();
                }
            }
        });
    }

    if (store.lists.length > 0) activeListId = store.lists[0].id;
    renderLists();
};