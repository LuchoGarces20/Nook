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
            this.currentUserEmail = session.user.email;
        }
        return session;
    },

    async login(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data && data.user) {
            this.currentUserEmail = data.user.email;
        }
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
                    p1Email: data.p1_email,
                    p2Email: data.p2_email,
                    startDate: data.start_date,
                    avatarP1: data.avatar_p1,
                    avatarP2: data.avatar_p2,
                    heroCover: data.hero_cover
                };

                // Vinculação automática do e-mail ativo ao perfil correto (P1 ou P2)
                if (this.currentUserEmail) {
                    const loggedEmail = this.currentUserEmail.toLowerCase();
                    let needsUpdate = false;

                    if (!this.profile.p1Email) {
                        this.profile.p1Email = loggedEmail;
                        needsUpdate = true;
                    } else if (this.profile.p1Email.toLowerCase() !== loggedEmail && !this.profile.p2Email) {
                        this.profile.p2Email = loggedEmail;
                        needsUpdate = true;
                    }

                    if (needsUpdate) {
                        await supabase.from('profiles').upsert({
                            id: '00000000-0000-0000-0000-000000000001',
                            p1_name: this.profile.p1,
                            p2_name: this.profile.p2,
                            p1_email: this.profile.p1Email,
                            p2_email: this.profile.p2Email,
                            start_date: this.profile.startDate,
                            avatar_p1: this.profile.avatarP1,
                            avatar_p2: this.profile.avatarP2,
                            hero_cover: this.profile.heroCover
                        });
                    }
                }
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
            p1_email: data.p1Email || (this.currentUserEmail ? this.currentUserEmail : null),
            p2_email: data.p2Email || null,
            start_date: data.startDate,
            avatar_p1: data.avatarP1,
            avatar_p2: data.avatarP2,
            hero_cover: data.heroCover
        });
    },

    getLoggedUser() {
        if (!this.profile || !this.currentUserEmail) return 'p1';
        const email = this.currentUserEmail.toLowerCase();
        if (this.profile.p2Email && email === this.profile.p2Email.toLowerCase()) {
            return 'p2';
        }
        return 'p1';
    },

    async fetchMoods() {
        try {
            const { data } = await supabase.from('moods').select('*').maybeSingle();
            if (data && data.date) {
                this.moods = { p1: data.p1, p2: data.p2, date: data.date };
                localStorage.setItem('nook_moods', JSON.stringify(this.moods));
            } else {
                const local = localStorage.getItem('nook_moods');
                if (local) this.moods = JSON.parse(local);
            }
        } catch (e) {
            console.warn("Erro ao buscar humor:", e);
            const local = localStorage.getItem('nook_moods');
            if (local) this.moods = JSON.parse(local);
        }
    },

    async setMoods(data) {
        this.moods = data;
        localStorage.setItem('nook_moods', JSON.stringify(data));
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