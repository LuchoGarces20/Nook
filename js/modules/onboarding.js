import { store } from '../store.js';
import { triggerHaptic, getInitials } from '../utils.js';
import { renderFinances } from './finances.js';
import { renderHome } from './home.js';

export const updateProfileUI = () => {
    if (!store.profile) return;
    const init1 = getInitials(store.profile.p1);
    const init2 = getInitials(store.profile.p2);

    document.querySelectorAll('.my-avatar').forEach(el => el.textContent = init1);
    document.querySelectorAll('.partner-avatar').forEach(el => el.textContent = init2);

    const updateSelect = (selectId) => {
        const select = document.getElementById(selectId);
        if (!select) return;
        const optP1 = select.querySelector('option[value="IS"]');
        const optP2 = select.querySelector('option[value="VO"]');
        if (optP1) optP1.textContent = `${init1} (${store.profile.p1})`;
        if (optP2) optP2.textContent = `${init2} (${store.profile.p2})`;
    };

    updateSelect('event-owner');
    updateSelect('goal-owner');
    updateSelect('expense-owner');

    const finLabels = document.querySelectorAll('#fin-income-inputs label');
    if (finLabels.length >= 2) {
        finLabels[0].textContent = `${init1} (R$)`;
        finLabels[1].textContent = `${init2} (R$)`;
    }
};

export const initOnboarding = () => {
    const onboardingView = document.getElementById('view-onboarding');
    const homeView = document.getElementById('view-home');
    const bottomBar = document.querySelector('.bottom-bar');
    const formOnboarding = document.getElementById('form-onboarding');
    const btnReopen = document.getElementById('btn-reopen-onboarding');
    const views = document.querySelectorAll('.view');

    const isProfileValid = store.profile?.p1 && store.profile?.p2 && store.profile?.startDate;

    views.forEach(v => v.classList.remove('active'));

    if (!isProfileValid) {
        store.clearProfile();
        if (onboardingView) onboardingView.classList.add('active');
        if (bottomBar) bottomBar.classList.add('hidden');
    } else {
        if (homeView) homeView.classList.add('active');
        if (bottomBar) bottomBar.classList.remove('hidden');
        updateProfileUI();
        renderHome();
    }

    if (formOnboarding) {
        formOnboarding.addEventListener('submit', (e) => {
            e.preventDefault();
            const p1 = document.getElementById('onboarding-p1').value.trim();
            const p2 = document.getElementById('onboarding-p2').value.trim();
            const startDate = document.getElementById('onboarding-date').value;

            if (!p1 || !p2 || !startDate) return;

            store.setProfile({ p1, p2, startDate });
            triggerHaptic(30);

            views.forEach(v => v.classList.remove('active'));
            if (homeView) homeView.classList.add('active');
            if (bottomBar) bottomBar.classList.remove('hidden');

            updateProfileUI();
            renderFinances(); 
            renderHome();
        });
    }

    if (btnReopen) {
        btnReopen.addEventListener('click', () => {
            triggerHaptic(10);
            if (store.profile) {
                document.getElementById('onboarding-p1').value = store.profile.p1;
                document.getElementById('onboarding-p2').value = store.profile.p2;
                document.getElementById('onboarding-date').value = store.profile.startDate;
            }
            views.forEach(v => v.classList.remove('active'));
            if (onboardingView) onboardingView.classList.add('active');
            if (bottomBar) bottomBar.classList.add('hidden');
        });
    }
};