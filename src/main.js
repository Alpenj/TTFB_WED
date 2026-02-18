import './style.css'
import { fetchData } from './data.js'
import { SetupDashboard, renderBootShell } from './ui.js'

console.log('App initialized');

function renderFatalError() {
    const app = document.querySelector('#app');
    if (!app) return;

    app.innerHTML = `
        <div class="flex items-center justify-center h-screen text-red-500">
            <p>Failed to load data. Please try again later.</p>
        </div>
    `;
}

function init() {
    // Render shell first so mobile users see UI immediately.
    renderBootShell();

    fetchData()
        .then(() => {
            SetupDashboard();
        })
        .catch((e) => {
            console.error('Failed to load app', e);
            renderFatalError();
        });
}

init();

// [DEPLOY TRIGGER] Force update: 2026-01-28 16:15 (Version 1.0.1)
