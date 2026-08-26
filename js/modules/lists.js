import { store } from '../store.js';
import { triggerHaptic, getInitials, escapeHTML } from '../utils.js';

let activeListId = 'atividades';

export const renderLists = () => {
    const tabsContainer = document.getElementById('lists-tabs-container');
    const taskContainer = document.getElementById('task-list-container');
    if (!tabsContainer || !taskContainer) return;

    const currentList = store.lists.find(l => l.id === activeListId) || store.lists[0];
    if(document.getElementById('active-list-header-title')) document.getElementById('active-list-header-title').textContent = currentList.name;

    const p1Init = store.profile ? getInitials(store.profile.p1) : 'IS';
    const p2Init = store.profile ? getInitials(store.profile.p2) : 'VO';

    tabsContainer.innerHTML = '';
    store.lists.forEach(list => {
        const btn = document.createElement('button');
        btn.className = `tab-pill ${list.id === activeListId ? 'active' : 'outline'}`;
        btn.textContent = list.name; // textContent nativamente já é seguro contra XSS
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

    taskContainer.innerHTML = '';
    const pendingItems = currentList.items.filter(i => !i.completed);
    if(document.getElementById('lists-section-title')) document.getElementById('lists-section-title').textContent = `PENDENTES (${pendingItems.length})`;

    if (currentList.items.length === 0) {
        taskContainer.innerHTML = `<li style="text-align:center; padding: 24px 0; color: var(--text-muted); font-size: 0.88rem;">Nenhum item nesta lista. Adicione um abaixo!</li>`;
    } else {
        currentList.items.forEach(item => {
            let displayOwner = item.owner;
            if (item.owner === 'VO') displayOwner = p2Init;
            if (item.owner === 'IS') displayOwner = p1Init;
            let badgeClass = (item.owner === 'VO' || item.owner === p2Init) ? 'bg-muted' : '';
            if (item.owner === 'Casal') { badgeClass = 'bg-casal'; displayOwner = 'N S'; }

            const safeText = escapeHTML(item.text);

            const li = document.createElement('li');
            li.className = `task-item ${item.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <div class="checkbox"><i class="ph-bold ph-check"></i></div>
                <span class="task-text">${safeText}</span>
                <div class="task-badge ${badgeClass}">${displayOwner}</div>
                <button class="btn-delete-event"><i class="ph ph-trash"></i></button>
            `;
            
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
            
            taskContainer.appendChild(li);
        });
    }
    
    if(document.getElementById('metric-lists-count')) document.getElementById('metric-lists-count').textContent = store.lists.length;
    if(document.getElementById('metric-pending-count')) document.getElementById('metric-pending-count').textContent = pendingItems.length;
};

export const initLists = () => {
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
                currentList.items.push({ id: Date.now(), text, completed: false, owner: store.profile ? getInitials(store.profile.p1) : 'IS' });
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