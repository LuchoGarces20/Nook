// Centraliza todos os dados do app e salva automaticamente no LocalStorage
const PREFIX = 'nook_';

const load = (key, defaultData) => {
    try {
        const data = window.localStorage.getItem(PREFIX + key);
        return data ? JSON.parse(data) : defaultData;
    } catch (e) {
        return defaultData;
    }
};

const save = (key, data) => {
    try {
        window.localStorage.setItem(PREFIX + key, JSON.stringify(data));
    } catch (e) {
        console.warn("Sem acesso ao LocalStorage", e);
    }
};

export const store = {
    profile: load('profile', null),
    finances: load('finances', { model: '50/50', incomeIS: '', incomeVO: '', focus: 'acerto', configured: false }),
    expenses: load('expenses', []), // Novo banco de dados para contas
    lists: load('lists', [
        { id: 'atividades', name: 'Atividades', items: [] },
        { id: 'mercado', name: 'Mercado', items: [] }
    ]),
    agenda: load('agenda', []),
    goals: load('goals', []),
    moods: load('moods', { p1: null, p2: null, date: '' }),

    setProfile(data) { this.profile = data; save('profile', data); },
    setTheme(data) { this.theme = data; save('theme', data); },
    setFinances(data) { this.finances = data; save('finances', data); },
    setExpenses(data) { this.expenses = data; save('expenses', data); },
    setLists(data) { this.lists = data; save('lists', data); },
    setAgenda(data) { this.agenda = data; save('agenda', data); },
    setGoals(data) { this.goals = data; save('goals', data); },
    setMoods(data) { this.moods = data; save('moods', data); },
    
    clearProfile() { 
        this.profile = null; 
        try { window.localStorage.removeItem(PREFIX + 'profile'); } catch(e){} 
    }
};