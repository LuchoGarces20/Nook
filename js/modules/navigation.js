import { triggerHaptic } from '../utils.js';
import { renderHome } from './home.js';

export const initNavigation = () => {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault(); 
            const targetId = item.getAttribute('data-target');
            if (!targetId) return; 

            triggerHaptic(10);

            // Atualiza os dados da Home dinamicamente ao navegar para ela
            if (targetId === 'view-home') {
                renderHome();
            }

            navItems.forEach(nav => {
                nav.classList.remove('active');
                const icon = nav.querySelector('i');
                if(icon) { icon.classList.remove('ph-fill'); icon.classList.add('ph'); }
            });
            
            item.classList.add('active');
            const activeIcon = item.querySelector('i');
            if(activeIcon) { activeIcon.classList.remove('ph'); activeIcon.classList.add('ph-fill'); }

            views.forEach(view => view.classList.remove('active'));
            const targetView = document.getElementById(targetId);
            if(targetView) targetView.classList.add('active');
        });
    });
};