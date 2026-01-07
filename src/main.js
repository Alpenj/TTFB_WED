import './style.css'
import { fetchData, getStats, getSchedule } from './data.js'
import { SetupDashboard } from './ui.js' // We'll create this

console.log('App initialized');

async function init() {
    try {
        await fetchData();
        SetupDashboard();
    } catch (e) {
        console.error("Failed to load app", e);
        document.querySelector('#app').innerHTML = `
            <div class="flex items-center justify-center h-screen text-red-500">
                <p>Failed to load data. Please try again later.</p>
            </div>
        `;
    }
}

init();
