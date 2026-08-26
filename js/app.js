import { initNavigation } from './modules/navigation.js';
import { initOnboarding } from './modules/onboarding.js';
import { initHome } from './modules/home.js';
import { initLists } from './modules/lists.js';
import { initAgenda } from './modules/agenda.js';
import { initGoals } from './modules/goals.js';
import { initFinances } from './modules/finances.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initOnboarding();
    initHome(); // Inicializa a nova tela Home
    initLists();
    initAgenda();
    initGoals();
    initFinances();
});