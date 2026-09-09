// js/store.js
const SUPABASE_URL = 'https://acgzdijucuwojlngjimu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7XKTElFFXT8zoNVk-YJ_3g_uaUu8tNM';

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

export const store = {
    profile: null,
    currentUserEmail: null,
    theme: 'system',
    finances: { model: '50/50', incomeIS: '', incomeVO: '', focus: 'acerto', configured: false },
    expenses: [],
    lists: [],
    agenda: [],
    goals: [],
    moods: { p1: null, p2: null, date: '' },
    memories: [],

    async init() {
        await Promise.all([
            this.fetchProfile(),
            this.fetchFinances(),
            this.fetchExpenses(),
            this.fetchLists(),
            this.fetchAgenda(),
            this.fetchGoals(),
            this.fetchMemories(),
            this.fetchMoods()
        ]);
        this.subscribeRealtime();
    },

    async checkSession() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
            this.currentUserEmail = session.user.email; // Salva o e-mail ativo
        }
        return session;
    },

    async login(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    },

    async logout() {
        await supabase.auth.signOut();
        window.location.reload();
    },

    async fetchProfile() {
        try {
            const { data } = await supabase.from('profiles').select('*').maybeSingle();
            if (data) {
                this.profile = {
                    p1: data.p1_name,
                    p2: data.p2_name,
                    p1Email: data.p1_email, // Novo campo
                    p2Email: data.p2_email, // Novo campo
                    startDate: data.start_date,
                    avatarP1: data.avatar_p1,
                    avatarP2: data.avatar_p2,
                    heroCover: data.hero_cover
                };
            }
        } catch (e) {
            console.warn("Erro ao buscar perfil:", e);
        }
    },

    async setProfile(data) {
        this.profile = data;
        await supabase.from('profiles').upsert({
            id: '00000000-0000-0000-0000-000000000001',
            p1_name: data.p1,
            p2_name: data.p2,
            p1_email: data.p1Email, // Salva no Supabase
            p2_email: data.p2Email, // Salva no Supabase
            start_date: data.startDate,
            avatar_p1: data.avatarP1,
            avatar_p2: data.avatarP2,
            hero_cover: data.heroCover
        });
    },

    getLoggedUser() {
        if (!this.profile || !this.currentUserEmail) return 'p1';
        // Se o email logado bater com o p2, essa pessoa é p2. Caso contrário, é p1.
        if (this.currentUserEmail.toLowerCase() === (this.profile.p2Email || '').toLowerCase()) {
            return 'p2';
        }
        return 'p1';
    },

    async fetchMoods() {
        try {
            const { data } = await supabase.from('moods').select('*').maybeSingle();
            if (data) {
                this.moods = { p1: data.p1, p2: data.p2, date: data.date };
            }
        } catch (e) {
            console.warn("Erro ao buscar humor:", e);
        }
    },

     async setMoods(data) {
        // Mantém o estado local atualizado
        this.moods = data;
        
        try {
            await supabase.from('moods').upsert({
                id: '00000000-0000-0000-0000-000000000001',
                p1: data.p1,
                p2: data.p2,
                date: data.date
            });
        } catch (e) {
            console.warn("Erro ao salvar humor:", e);
        }
    },

    async fetchExpenses() {
        const { data } = await supabase.from('expenses').select('*');
        if (data) this.expenses = data;
    },

    async setExpenses(data) {
        this.expenses = data;
        await supabase.from('expenses').upsert(data.map(e => ({
            id: typeof e.id === 'number' ? undefined : e.id,
            title: e.title,
            amount: e.amount,
            category: e.category,
            date: e.date,
            owner: e.owner,
            completed: e.completed
        })));
    },

    async fetchLists() {
        const { data } = await supabase.from('lists').select('*');
        if (data && data.length > 0) this.lists = data;
    },

    async setLists(data) {
        this.lists = data;
        await supabase.from('lists').upsert(data);
    },

    async fetchAgenda() {
        const { data } = await supabase.from('agenda').select('*');
        if (data) this.agenda = data;
    },

    async setAgenda(data) {
        this.agenda = data;
        await supabase.from('agenda').upsert(data);
    },

    async fetchGoals() {
        const { data } = await supabase.from('goals').select('*');
        if (data) this.goals = data;
    },

    async setGoals(data) {
        this.goals = data;
        await supabase.from('goals').upsert(data);
    },

    async fetchMemories() {
        const { data } = await supabase.from('memories').select('*');
        if (data) this.memories = data;
    },

    async setMemories(data) {
        this.memories = data;
        await supabase.from('memories').upsert(data);
    },

    async clearProfile() {
        this.profile = null;
        try {
            await supabase.from('profiles').delete().eq('id', '00000000-0000-0000-0000-000000000001');
        } catch(e) {
            console.warn("Erro ao limpar perfil:", e);
        }
    },

    async fetchFinances() {
        try {
            const { data } = await supabase.from('finances').select('*').maybeSingle();
            if (data) {
                this.finances = {
                    model: data.model,
                    incomeIS: data.income_is,
                    incomeVO: data.income_vo,
                    settleMode: data.settle_mode,
                    configured: data.configured
                };
            }
        } catch (e) {
            console.warn("Erro ao buscar financas:", e);
        }
    },

    async setFinances(data) {
        this.finances = data;
        await supabase.from('finances').upsert({
            id: '00000000-0000-0000-0000-000000000001',
            model: data.model,
            income_is: data.incomeIS,
            income_vo: data.incomeVO,
            settle_mode: data.settleMode,
            configured: data.configured
        });
    },

    subscribeRealtime() {
        supabase.channel('public-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public' }, () => {
                window.location.reload();
            })
            .subscribe();
    }
};