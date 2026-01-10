import Chart from 'chart.js/auto';
import { getSchedule, getStats, getTeamStats, getStadium, getStadiumStats, getAvailableSeasons, getAvailableMatchTypes, getMatchRecords, getPlayerEvents, getOpponentStats, getPlayerMatchHistory, getLinkedMatchStats } from './data.js';

window.getPlayerMatchHistory = getPlayerMatchHistory; // Expose for inline onclick handlers

export function SetupDashboard() {
    const app = document.querySelector('#app');

    // State
    const seasons = getAvailableSeasons();
    const matchTypes = getAvailableMatchTypes();
    let currentSeason = 'all'; // Default to "All Time" per user request: ensure data is shown on load.
    let currentMatchType = 'all';

    // Initial Layout: Header, Main Content, Bottom Nav
    app.innerHTML = `
        <header class="p-4 flex items-center justify-between bg-black/50 backdrop-blur-md z-10 border-b border-gray-800 shrink-0">
            <h1 id="app-title" class="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity">TTFB_WED</h1>
            <div class="flex items-center space-x-2">
                 <select id="season-selector" class="bg-gray-800 text-white text-xs rounded-lg px-2 py-1 border border-gray-700 outline-none focus:border-neonGreen">
                    <option value="all">통산 기록</option>
                    ${seasons.map(s => `<option value="${s}">${s} 시즌</option>`).join('')}
                 </select>
            </div>
        </header>
        
        <!-- Match Type Tabs -->
        <div class="z-[5] bg-black/50 backdrop-blur-md border-b border-gray-800 overflow-x-auto custom-scrollbar shrink-0">
            <div class="flex items-center px-4 space-x-4 min-w-max h-12" id="type-tabs">
                <button data-type="all" class="type-tab-btn relative px-1 py-3 text-sm font-bold text-neonGreen transition-colors">
                    전체
                    <span class="absolute bottom-0 left-0 w-full h-0.5 bg-neonGreen rounded-t-full transition-all"></span>
                </button>
                ${matchTypes.map(t => `
                    <button data-type="${t}" class="type-tab-btn relative px-1 py-3 text-sm font-medium text-gray-500 hover:text-gray-300 transition-colors">
                        ${t}
                        <span class="absolute bottom-0 left-0 w-full h-0.5 bg-neonGreen rounded-t-full opacity-0 transition-all"></span>
                    </button>
                `).join('')}
            </div>
        </div>

        <main id="content" class="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
            <!-- Dynamic Content -->
        </main>

        <nav class="w-full bg-black/80 backdrop-blur-lg border-t border-gray-800 p-2 shrink-0 z-20">
            <ul class="flex justify-around items-center">
                <li>
                    <button data-target="home" class="nav-btn flex flex-col items-center p-2 text-neonGreen transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span class="text-xs mt-1">홈</span>
                    </button>
                </li>
                <li>
                    <button data-target="matches" class="nav-btn flex flex-col items-center p-2 text-gray-500 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span class="text-xs mt-1">일정</span>
                    </button>
                </li>
                <li>
                    <button data-target="stats" class="nav-btn flex flex-col items-center p-2 text-gray-500 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                        </svg>
                        <span class="text-xs mt-1">기록</span>
                    </button>
                </li>
                <li>
                    <a href="https://docs.google.com/spreadsheets/d/1zGMli5RMTM83TTRwZz-EiA_oXkJX6-IehnHZy6v0Phg/edit#gid=426357573" target="_blank" class="flex flex-col items-center p-2 text-gray-500 hover:text-white transition-colors">
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span class="text-xs mt-1">관리</span>
                    </a>
                </li>
            </ul>
        </nav>
    `;

    const seasonSelector = document.getElementById('season-selector');
    const typeSelector = document.getElementById('type-selector');

    function getCurrentView() {
        // Find which button is active
        const activeBtn = document.querySelector('.nav-btn.text-neonGreen');
        return activeBtn ? activeBtn.dataset.target : 'home';
    }

    // Initialize Router logic
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget.dataset.target;

            // Update Active State
            document.querySelectorAll('.nav-btn').forEach(b => {
                b.classList.remove('text-neonGreen');
                b.classList.add('text-gray-500');
            });
            e.currentTarget.classList.remove('text-gray-500');
            e.currentTarget.classList.add('text-neonGreen');

            // Render content
            renderView(target, currentSeason);
        });
    });

    // Handle Season Change
    seasonSelector.addEventListener('change', (e) => {
        currentSeason = e.target.value;
        const view = getCurrentView();
        renderView(view, currentSeason, currentMatchType);
    });

    // Handle Type Tab Click
    const typeTabsContainer = document.getElementById('type-tabs');
    if (typeTabsContainer) {
        // Event delegation
        typeTabsContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.type-tab-btn');
            if (!btn) return;

            const selectedType = btn.dataset.type;
            currentMatchType = selectedType === 'all' ? 'all' : selectedType;

            // Update UI State
            document.querySelectorAll('.type-tab-btn').forEach(b => {
                b.classList.remove('text-neonGreen', 'font-bold');
                b.classList.add('text-gray-500', 'font-medium');
                b.querySelector('span').classList.remove('opacity-100');
                b.querySelector('span').classList.add('opacity-0');
            });
            btn.classList.remove('text-gray-500', 'font-medium');
            btn.classList.add('text-neonGreen', 'font-bold');
            btn.querySelector('span').classList.remove('opacity-0');
            btn.querySelector('span').classList.add('opacity-100');

            const view = getCurrentView();
            renderView(view, currentSeason, currentMatchType);
        });
    }

    // Handle Title Click -> Go Home
    const appTitle = document.getElementById('app-title');
    if (appTitle) {
        appTitle.addEventListener('click', () => {
            // Update Active State to Home
            document.querySelectorAll('.nav-btn').forEach(b => {
                b.classList.remove('text-neonGreen');
                b.classList.add('text-gray-500');
            });
            const homeBtn = document.querySelector('button[data-target="home"]');
            if (homeBtn) {
                homeBtn.classList.remove('text-gray-500');
                homeBtn.classList.add('text-neonGreen');
            }
            renderView('home', currentSeason);
        });
    }

    // Default Render
    renderView('home', currentSeason, currentMatchType);
}

function renderView(view, currentSeason, currentMatchType) {
    const content = document.querySelector('#content');
    content.innerHTML = ''; // Clear content
    content.className = 'flex-1 overflow-y-auto p-4 pb-20 space-y-6 opacity-0 transition-opacity duration-300';

    setTimeout(() => {
        content.classList.remove('opacity-0');
    }, 50);

    if (view === 'home') renderHome(content, currentSeason, currentMatchType);
    else if (view === 'matches') renderMatches(content, currentSeason, currentMatchType);
    else if (view === 'stats') renderStats(content, currentSeason, currentMatchType);
}

function renderHome(container, currentSeason, currentMatchType) {
    const schedule = getSchedule(currentSeason);
    const stats = getStats(currentSeason, currentMatchType);
    const teamStats = getTeamStats(currentSeason, currentMatchType);

    const today = new Date();
    // Parse '2026.01.18' format
    const upcomingMatch = schedule
        .filter(m => currentMatchType === 'all' ? true : m.matchType === currentMatchType)
        .find(m => {
            if (!m.date) return false;
            const parts = m.date.split('.');
            if (parts.length !== 3) return false;
            const date = new Date(parts[0], parts[1] - 1, parts[2]);
            return date >= today;
        });

    let dDayMarkup = '';
    if (upcomingMatch) {
        const parts = upcomingMatch.date.split('.');
        const matchDate = new Date(parts[0], parts[1] - 1, parts[2]);
        const diffTime = matchDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const dDay = diffDays <= 0 ? 'D-Day' : `D-${diffDays}`;
        dDayMarkup = `<span class="bg-neonGreen text-black font-bold px-2 py-0.5 rounded text-xs animate-pulse">${dDay}</span>`;
    }

    const lastMatch = currentMatchType === '연습경기' ? null : [...schedule]
        .filter(m => currentMatchType === 'all' ? m.matchType !== '연습경기' : m.matchType === currentMatchType) // Filter by type if selected, otherwise exclude practice for 'all'
        .reverse()
        .find(m => m.result && m.result.trim() !== '');

    let recentResultMarkup = '';
    if (lastMatch) {
        const parts = lastMatch.result.split(':');
        const isScore = parts.length === 2 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]));

        const isWin = lastMatch.result.includes('승') || (isScore && parseInt(parts[0]) > parseInt(parts[1]));
        const isDraw = lastMatch.result.includes('무') || (isScore && parseInt(parts[0]) === parseInt(parts[1]));
        const resultColor = isWin ? 'text-neonGreen' : (isDraw ? 'text-yellow-400' : 'text-red-400');

        recentResultMarkup = `
            <div class="bg-gray-800 rounded-3xl p-6 border border-gray-700 cursor-pointer hover:bg-gray-750 transition-colors" id="btn-recent-match" onclick="
                const selector = document.getElementById('season-selector');
                if (selector) {
                    selector.value = '${lastMatch.season}';
                    selector.dispatchEvent(new Event('change'));
                }
                document.querySelector('button[data-target=\\'matches\\']').click();
            ">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-lg font-bold text-white">최근 경기 결과</h2>
                    <span class="text-xs text-gray-400 flex items-center">
                        <span class="w-2 h-2 rounded-full ${isWin ? 'bg-neonGreen' : (isDraw ? 'bg-yellow-400' : 'bg-red-500')} mr-2"></span>
                        ${lastMatch.result}
                    </span>
                </div>
                <div class="flex items-center justify-between">
                   <div class="flex flex-col">
                        <span class="text-gray-400 text-xs mb-1">${lastMatch.date}</span>
                        <span class="text-xl font-bold text-white">vs ${lastMatch.opponent}</span>
                   </div>
                   <div class="text-2xl font-black ${resultColor}">${lastMatch.result}</div>
                </div>
            </div>
        `;
    } else {
        recentResultMarkup = `
            <div class="bg-gray-800 rounded-3xl p-6 border border-gray-700 flex items-center justify-center h-24">
                <span class="text-gray-500 text-sm">최근 경기 기록 없음</span>
            </div>
        `;
    }

    container.innerHTML = `
        <!-- Team Stats Summary -->
        <div class="grid grid-cols-2 gap-4">
            <div class="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-3xl border border-gray-700 flex flex-col items-center justify-center shadow-lg relative overflow-hidden group cursor-pointer hover:border-neonGreen transition-colors" id="btn-stats-record">
                <div class="absolute inset-0 bg-neonGreen/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span class="text-gray-400 text-xs font-mono z-10">승률 (Win Rate)</span>
                <span class="text-3xl font-black text-white mt-1 z-10">${teamStats.winRate}<span class="text-base font-normal text-neonGreen">%</span></span>
            </div>
             <div class="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-3xl border border-gray-700 flex flex-col items-center justify-center shadow-lg relative overflow-hidden group cursor-pointer hover:border-blue-500 transition-colors" id="btn-stats-summary">
                <div class="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span class="text-gray-400 text-xs font-mono z-10">전적 (W-D-L)</span>
                <div class="flex items-baseline space-x-1 mt-1 z-10">
                    <span class="text-xl font-bold text-white">${teamStats.wins}</span><span class="text-xs text-gray-500">승</span>
                    <span class="text-xl font-bold text-white">${teamStats.draws}</span><span class="text-xs text-gray-500">무</span>
                    <span class="text-xl font-bold text-white">${teamStats.losses}</span><span class="text-xs text-gray-500">패</span>
                </div>
            </div>
        </div>

        <!-- Next Match Card -->
        <div class="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-6 border-l-4 border-neonGreen shadow-2xl relative overflow-hidden cursor-pointer hover:bg-gray-800 transition-colors" id="btn-next-match">
             <!-- <div class="absolute -right-4 -top-4 text-9xl text-white/5 font-black rotate-12 pointer-events-none">NEXT</div> -->
             <div class="flex justify-between items-start mb-4 relative z-10">
                <div class="flex items-center space-x-2">
                    <span class="text-neonGreen font-mono text-xl font-bold">${upcomingMatch ? upcomingMatch.round : 'Next'}</span>
                    ${dDayMarkup}
                </div>
                <span class="text-xs text-gray-400 bg-black/30 px-2 py-1 rounded backdrop-blur-sm">
                    ${upcomingMatch ? '예정' : '일정 없음'}
                </span>
            </div>
            
            ${upcomingMatch ? `
            <div class="relative z-10">
                <div class="text-2xl font-bold text-white mb-2">vs ${upcomingMatch.opponent || '미정'}</div>
                <div class="flex items-center text-sm text-gray-300 space-x-2">
                    <span>${upcomingMatch.date}</span>
                     ${upcomingMatch.stadium ? `<span class="text-gray-500">|</span> <button onclick="event.stopPropagation(); window.showMapModal('${upcomingMatch.stadium}')" class="hover:text-neonGreen underline decoration-neonGreen/50 transition-colors">🏟️ ${upcomingMatch.stadium}</button>` : ''}
                </div>
            </div>
             ` : `
            <div class="text-gray-500 text-sm relative z-10">
                등록된 다음 경기 일정이 없습니다.
            </div>
            `}
        </div>

        ${recentResultMarkup}
        
        <!-- Top Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-24">
            <!-- Top Scorers -->
            <div class="bg-gray-800 rounded-3xl p-6 border border-gray-700 cursor-pointer hover:bg-gray-750 transition-colors" onclick="document.querySelector('button[data-target=\'stats\']').click()">
                <div class="flex items-center justify-between mb-4">
                     <h2 class="text-lg font-bold text-white flex items-center">
                        <span class="mr-2">⚽</span> 득점
                    </h2>
                     <span class="text-xs text-neonGreen font-mono">Top 5</span>
                </div>
               
                <div class="space-y-3">
                    ${(function () {
            const sorted = [...stats.topScorers].sort((a, b) => b.goals - a.goals).slice(0, 5);
            if (sorted.length === 0) return '<div class="text-center text-gray-500 py-4 text-xs">기록 없음</div>';
            return sorted.map((p, index) => `
                            <div class="flex items-center justify-between group h-6 hover:bg-gray-700/50 rounded px-1 -mx-1 transition-colors cursor-pointer" onclick="event.stopPropagation(); window.showHistoryModal('${p.name}', 'goals', window.getPlayerEvents('${currentSeason}', '${currentMatchType || 'all'}', '${p.name}', 'goals'))">
                                <div class="flex items-center space-x-3 overflow-hidden">
                                    <span class="text-xs font-mono w-4 shrink-0 ${index < 3 ? 'text-neonGreen' : 'text-gray-500'}">${index + 1}</span>
                                    <span class="text-xs text-gray-300 group-hover:text-white transition-colors truncate">${p.name}</span>
                                </div>
                                <span class="text-xs font-bold text-white font-mono shrink-0">${p.goals}</span>
                            </div>
                        `).join('');
        })()}
                </div>
            </div>

            <!-- Top Assisters -->
            <div class="bg-gray-800 rounded-3xl p-6 border border-gray-700 cursor-pointer hover:bg-gray-750 transition-colors" onclick="document.querySelector('button[data-target=\'stats\']').click()">
                 <div class="flex items-center justify-between mb-4">
                     <h2 class="text-lg font-bold text-white flex items-center">
                        <span class="mr-2">👟</span> 도움
                    </h2>
                     <span class="text-xs text-blue-400 font-mono">Top 5</span>
                </div>

                <div class="space-y-3">
                    ${(function () {
            const sorted = [...stats.topAssists].sort((a, b) => b.assists - a.assists).slice(0, 5);
            if (sorted.length === 0) return '<div class="text-center text-gray-500 py-4 text-xs">기록 없음</div>';
            return sorted.map((p, index) => `
                            <div class="flex items-center justify-between group h-6 hover:bg-gray-700/50 rounded px-1 -mx-1 transition-colors cursor-pointer" onclick="event.stopPropagation(); window.showHistoryModal('${p.name}', 'assists', window.getPlayerEvents('${currentSeason}', '${currentMatchType || 'all'}', '${p.name}', 'assists'))">
                                <div class="flex items-center space-x-3 overflow-hidden">
                                    <span class="text-xs font-mono w-4 shrink-0 ${index < 3 ? 'text-blue-400' : 'text-gray-500'}">${index + 1}</span>
                                    <span class="text-xs text-gray-300 group-hover:text-white transition-colors truncate">${p.name}</span>
                                </div>
                                <span class="text-xs font-bold text-white font-mono shrink-0">${p.assists}</span>
                            </div>
                        `).join('');
        })()}
                </div>
            </div>

            <!-- Most Appearances -->
             <div class="bg-gray-800 rounded-3xl p-6 border border-gray-700 cursor-pointer hover:bg-gray-750 transition-colors" onclick="document.querySelector('button[data-target=\'stats\']').click()">
                 <div class="flex items-center justify-between mb-4">
                     <h2 class="text-lg font-bold text-white flex items-center">
                        <span class="mr-2">🏃</span> 출전
                    </h2>
                     <span class="text-xs text-purple-400 font-mono">Top 5</span>
                </div>

                <div class="space-y-3">
                    ${(function () {
            const sorted = [...stats.topAppearances].sort((a, b) => b.appearances - a.appearances).slice(0, 5);
            if (sorted.length === 0) return '<div class="text-center text-gray-500 py-4 text-xs">기록 없음</div>';
            return sorted.map((p, index) => `
                            <div class="flex items-center justify-between group h-6 hover:bg-gray-700/50 rounded px-1 -mx-1 transition-colors cursor-pointer" onclick="event.stopPropagation(); window.showHistoryModal('${p.name}', 'appearances', window.getPlayerEvents('${currentSeason}', '${currentMatchType || 'all'}', '${p.name}', 'appearances'))">
                                <div class="flex items-center space-x-3 overflow-hidden">
                                    <span class="text-xs font-mono w-4 shrink-0 ${index < 3 ? 'text-purple-400' : 'text-gray-500'}">${index + 1}</span>
                                    <span class="text-xs text-gray-300 group-hover:text-white transition-colors truncate">${p.name}</span>
                                </div>
                                <span class="text-xs font-bold text-white font-mono shrink-0">${p.appearances}</span>
                            </div>
                        `).join('');
        })()}
                </div>
            </div>
        </div>
    `;

    // Add Navigation Event Listeners
    // 1. Next Match -> Schedule
    const nextMatchBtn = container.querySelector('#btn-next-match');
    if (nextMatchBtn) {
        nextMatchBtn.addEventListener('click', () => {
            const navBtn = document.querySelector('button[data-target="matches"]');
            if (navBtn) navBtn.click();
        });
    }

    // 1-1. Recent Match -> Schedule (Added)
    const recentMatchBtn = container.querySelector('#btn-recent-match');
    if (recentMatchBtn) {
        recentMatchBtn.addEventListener('click', () => {
            const navBtn = document.querySelector('button[data-target="matches"]');
            if (navBtn) navBtn.click();
        });
    }

    // 2. Stats Cards -> Stats
    const statsIds = ['#btn-stats-record', '#btn-stats-summary', '#btn-stats-efficiency', '#btn-stats-detail'];
    statsIds.forEach(id => {
        const el = container.querySelector(id);
        if (el) {
            el.addEventListener('click', () => {
                const navBtn = document.querySelector('button[data-target="stats"]');
                if (navBtn) navBtn.click();
            });
        }
    });

    // 4. Opponent Stats (Collapsible)
    const opponentStats = getOpponentStats(currentSeason, currentMatchType);
    const validOpponents = opponentStats.filter(o => o.name);

    if (validOpponents.length > 0) {
        const oppContainer = document.createElement('div');
        oppContainer.className = 'bg-gray-800 rounded-3xl border border-gray-700 hover:bg-gray-750 transition-colors mt-6 overflow-hidden';

        const header = document.createElement('div');
        header.className = 'p-6 flex items-center justify-between cursor-pointer';
        header.onclick = () => {
            const content = oppContainer.querySelector('.opp-list');
            const icon = oppContainer.querySelector('.toggle-icon');
            content.classList.toggle('hidden');
            icon.style.transform = content.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
        };

        header.innerHTML = `
            <div class="flex items-center">
                <span class="mr-2">⚔️</span>
                <h2 class="text-lg font-bold text-white">상대 전적</h2>
                <span class="text-xs text-gray-500 ml-2 font-normal">(승/무/패)</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 transform transition-transform duration-300 toggle-icon rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
        `;

        const content = document.createElement('div');
        content.className = 'opp-list px-6 pb-6 space-y-3 hidden';
        content.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${validOpponents.map((o, i) => `
                <div class="flex items-center justify-between border-b border-gray-700 pb-2 last:border-0 last:pb-0 bg-gray-700/30 p-2 rounded">
                        <div class="flex items-center space-x-2 w-1/3">
                        <span class="text-xs font-mono text-gray-500 w-3 flex-shrink-0">${i + 1}</span>
                        <span class="text-sm text-white font-bold truncate">${o.name}</span>
                    </div>
                    <div class="flex items-center space-x-2 text-xs font-mono user-select-none">
                        <div class="flex items-center space-x-1" title="승">
                            <span class="w-1.5 h-1.5 rounded-full bg-neonGreen"></span>
                            <span class="text-white">${o.wins}</span>
                        </div>
                        <div class="flex items-center space-x-1" title="무">
                            <span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                            <span class="text-gray-300">${o.draws}</span>
                        </div>
                        <div class="flex items-center space-x-1" title="패">
                            <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            <span class="text-gray-400">${o.losses}</span>
                        </div>
                    </div>
                    <div class="text-[10px] text-gray-500 font-mono w-8 text-right">
                            ${Math.round((o.wins / o.total) * 100)}%
                    </div>
                </div>
            `).join('')}
        </div>`;

        oppContainer.appendChild(header);
        oppContainer.appendChild(content);
        container.appendChild(oppContainer);
    }

    // 5. Stadium Stats (Collapsible)
    const stadiumStats = getStadiumStats(currentSeason, currentMatchType);
    if (stadiumStats.length > 0) {
        const stadiumContainer = document.createElement('div');
        stadiumContainer.className = 'bg-gray-800 rounded-3xl border border-gray-700 hover:bg-gray-750 transition-colors mt-6 overflow-hidden';

        const header = document.createElement('div');
        header.className = 'p-6 flex items-center justify-between cursor-pointer';
        header.onclick = () => {
            const content = stadiumContainer.querySelector('.stadium-list');
            const icon = stadiumContainer.querySelector('.toggle-icon');
            content.classList.toggle('hidden');
            icon.style.transform = content.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
        };

        header.innerHTML = `
            <div class="flex items-center">
                <span class="mr-2">🏟️</span>
                <h2 class="text-lg font-bold text-white">구장 별 전적</h2>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 transform transition-transform duration-300 toggle-icon rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
        `;

        const content = document.createElement('div');
        content.className = 'stadium-list px-6 pb-6 space-y-3 hidden';
        content.innerHTML = stadiumStats.map(s => `
            <div class="flex items-center justify-between p-3 rounded-lg bg-gray-700/30">
                <span class="text-sm text-gray-200 font-bold">${s.name}</span>
                <div class="flex items-center space-x-4">
                        <span class="text-xs text-gray-400">
                        <span class="text-neonGreen font-bold">${s.wins}승</span> 
                        <span class="text-gray-300 font-bold">${s.draws}무</span> 
                        <span class="text-red-400 font-bold">${s.losses}패</span>
                        </span>
                        <span class="text-xs font-mono text-gray-500 w-12 text-right">${s.winRate}%</span>
                </div>
            </div>
        `).join('');

        stadiumContainer.appendChild(header);
        stadiumContainer.appendChild(content);
        container.appendChild(stadiumContainer);
    }



    // Add Player Stats Table (Collapsed by default)
    const tableEl = createPlayerStatsTable(stats.players, currentSeason);
    tableEl.classList.add('mt-6');
    container.appendChild(tableEl);
}

function renderMatches(container, currentSeason, currentMatchType) {
    // If a specific match type is selected globally, we might want to respect it
    // But this view has its own tabs. We can filter the INITIAL list or just let the tabs handle it.
    // However, if Global is 'League', having tabs for 'Cup' seems weird if it shows nothing.
    // Let's filter the source schedule first if currentMatchType !='all'
    let schedule = getSchedule(currentSeason);
    if (currentMatchType && currentMatchType !== 'all') {
        schedule = schedule.filter(m => m.matchType === currentMatchType);
    }

    // State
    let currentFilter = 'all'; // 'all', 'league', 'cup'
    let currentPage = 1;
    const itemsPerPage = 5;

    // Dynamic Filter UI
    // Extract unique types from schedule (e.g., '리그', '컵', '플레이오프')
    const uniqueTypes = [...new Set(schedule.map(m => m.matchType).filter(type => type && type.trim() !== ''))];
    const filterOptions = ['전체', ...uniqueTypes];

    const filterContainer = document.createElement('div');
    filterContainer.className = 'flex space-x-2 mb-4 overflow-x-auto pb-2'; // Allow scroll if many types

    filterOptions.forEach(label => {
        const btn = document.createElement('button');
        const isSelected = (label === '전체' && currentFilter === 'all') || (label === currentFilter);

        btn.className = `px - 4 py - 2 rounded - xl text - sm font - bold transition - colors whitespace - nowrap ${isSelected ? 'bg-neonGreen text-black' : 'bg-gray-800 text-gray-400 hover:text-white'} `;
        btn.textContent = label;
        btn.onclick = () => {
            currentFilter = label === '전체' ? 'all' : label;

            currentPage = 1; // Reset page
            updateFilterUI();
            renderPage(currentPage);
        };
        filterContainer.appendChild(btn);
    });

    function updateFilterUI() {
        Array.from(filterContainer.children).forEach(btn => {
            const label = btn.textContent;
            const isSelected = (label === '전체' && currentFilter === 'all') || (label === currentFilter);
            btn.className = `px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${isSelected ? 'bg-neonGreen text-black' : 'bg-gray-800 text-gray-400 hover:text-white'}`;
        });
    }

    const listContainer = document.createElement('div');
    listContainer.className = 'flex flex-col space-y-4 min-h-[400px]';

    function renderPage(page) {
        // Filter Data
        const filteredSchedule = schedule.filter(m => {
            if (currentFilter === 'all') return true;
            return m.matchType === currentFilter;
        });

        const totalPages = Math.ceil(filteredSchedule.length / itemsPerPage);
        listContainer.innerHTML = '';

        // Slice Data
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = filteredSchedule.slice(start, end);

        if (pageItems.length === 0) {
            let emptyMessage = '일정이 없습니다.';
            if (currentFilter === '플레이오프' || currentMatchType === '플레이오프') {
                // Check if League 10R is finished
                const league10R = schedule.find(m => m.matchType === '리그' && (m.matchId === '10R' || m.matchId === '10'));
                if (!league10R || !league10R.result) {
                    emptyMessage = '리그 결과 대기 중';
                }
            }
            listContainer.innerHTML = `<div class="text-center text-gray-500 py-10">${emptyMessage}</div>`;
            return;
        }

        pageItems.forEach(match => {
            let statusColor = 'border-gray-700';
            let resultText = '';

            if (match.result) {
                // Parse Result: "2:2 (4:3 PK)"
                const mainMatch = match.result.match(/^(\d+:\d+)/);
                const pkMatch = match.result.match(/\((\d+:\d+)\s*(PK|승부차기)\)/i);

                let mainResult = mainMatch ? mainMatch[1] : match.result;
                let pkScore = pkMatch ? pkMatch[1] : null;

                const parts = mainResult.split(':');
                const isScore = parts.length === 2 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]));

                let isWin = mainResult.includes('승') || (isScore && parseInt(parts[0]) > parseInt(parts[1]));
                let isDraw = mainResult.includes('무') || (isScore && parseInt(parts[0]) === parseInt(parts[1]));
                let isLoss = !isWin && !isDraw;

                // PK Logic for Visuals
                if (pkScore) {
                    const pkParts = pkScore.split(':').map(Number);
                    const pkWin = pkParts[0] > pkParts[1];
                    // If we won PK, visually treat as Win (Green)
                    // If we lost PK, visually treat as Loss (Red)
                    if (pkWin) {
                        isWin = true; isDraw = false; isLoss = false;
                    } else {
                        isWin = false; isDraw = false; isLoss = true;
                    }
                }

                if (isWin) statusColor = 'border-neonGreen';
                else if (isDraw) statusColor = 'border-yellow-400';
                else statusColor = 'border-red-500';

                const textColor = isWin ? 'text-neonGreen' : (isDraw ? 'text-yellow-400' : 'text-red-400');

                let displayScore = `<span class="font-bold ml-auto ${textColor}">${mainResult}</span>`;
                if (pkScore) {
                    displayScore += `<span class="text-[10px] text-gray-400 ml-1 block text-right font-mono">(${pkScore} PK)</span>`;
                }

                resultText = `<div class="flex flex-col items-end">${displayScore}</div>`;
            } else {
                resultText = `<span class="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded ml-auto">예정</span>`;
            }

            // Link Scorer/Assister Logic
            const linkedEvents = getLinkedMatchStats(match.season, match.matchId);
            // linkedEvents = [{ scorer: 'Name', assister: 'Name', tag: 'G1' }, ...]

            // Also get all scorers/assisters to handle unlinked ones or just to verify?
            // Actually getLinkedMatchStats returns ALL Goal events.
            // If G# tag is missing, it returns {scorer, assister: null}.

            let detailsMarkup = '';

            if (linkedEvents.length > 0) {
                // Format: "Scorer (Assist: Assister)"
                const eventTexts = linkedEvents.map(e => {
                    let text = `<span class="text-gray-300 font-bold">${e.scorer}</span>`;
                    if (e.assister) {
                        text += ` <span class="text-gray-500 font-normal text-[11px]">(도움: ${e.assister})</span>`;
                    }
                    return text;
                });

                detailsMarkup += `<div class="mt-2 text-xs flex flex-wrap items-center leading-relaxed">
                    <span class="text-neonGreen mr-1">⚽</span> 
                    <span>${eventTexts.join(', ')}</span>
                </div>`;
            } else {
                // Fallback if no goals (0-0) or error
                // Maybe check assists only?
                // But getLinkedMatchStats handles goals. If 0 goals, empty.
                // What if only assists recorded but no goal? (Impossible in football logic, but data might be weird)
                // Start with standard fallback if linked is empty but records exist?
                const records = getMatchRecords(match.season, match.matchId);
                if (records.some(r => r.goals > 0)) {
                    // Should have been caught by linkedEvents unless getLinkedMatchStats failed.
                }
            }

            const el = document.createElement('div');
            el.className = `flex items-center bg-gray-800 p-4 rounded-xl border-l-4 ${statusColor} shadow-sm animate-fade-in`;
            el.innerHTML = `
                <div class="flex flex-col mr-4 w-16">
                    <span class="text-xs text-gray-500 font-mono text-center leading-tight">
                        ${window.currentSeason === 'all' && match.season ? `<span class="block text-[10px] text-gray-600 mb-0.5">'${match.season.slice(-2)}</span>` : ''}
                        <span class="font-bold block">${match.matchType}</span>
                        <span class="text-[10px] block">${match.matchId}</span>
                    </span>
                    <span class="text-xs text-gray-400 font-mono text-center mt-1 bg-gray-900 rounded px-1">${match.date ? match.date.substring(5) : '-'}</span>
                </div>
                <div class="flex-1">
                    <div class="text-sm text-gray-300">vs <span class="text-white font-bold">${match.opponent}</span></div>
                    <div class="text-xs text-gray-500 mt-0.5">
                        ${match.time ? `<span>🕒 ${match.time}</span>` : ''}
                        ${match.stadium ? `<span class="ml-2"><button onclick="window.showMapModal('${match.stadium}')" class="hover:text-neonGreen underline decoration-gray-600 transition-colors text-left">🏟️ ${match.stadium}</button></span>` : ''}
                    </div>
                    ${detailsMarkup}
                </div>
                </div>
                ${resultText}
            `;
            listContainer.appendChild(el);
        });

        // Update Pagination ControlsContainer
        const controls = container.querySelector('.pagination-controls');
        if (controls) {
            if (totalPages > 1) {
                controls.style.display = 'flex';
                controls.innerHTML = `
                    <button ${page === 1 ? 'disabled' : ''} class="prev-btn px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}">이전</button>
                    <span class="text-sm text-gray-400 font-mono">${page} / ${totalPages}</span>
                    <button ${page === totalPages ? 'disabled' : ''} class="next-btn px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 ${page === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}">다음</button>
                `;

                controls.querySelector('.prev-btn').onclick = () => {
                    if (currentPage > 1) { currentPage--; renderPage(currentPage); }
                };
                controls.querySelector('.next-btn').onclick = () => {
                    if (currentPage < totalPages) { currentPage++; renderPage(currentPage); }
                };
            } else {
                controls.style.display = 'none';
            }
        }
    }

    // Pagination Controls Container
    const controls = document.createElement('div');
    controls.className = 'pagination-controls flex justify-between items-center mt-6 pt-4 border-t border-gray-800';

    container.innerHTML = `<h2 class="text-lg font-bold text-white mb-4">경기 일정</h2>`;
    container.appendChild(filterContainer);
    container.appendChild(listContainer);
    container.appendChild(controls);

    // Initial Render
    renderPage(currentPage);
}

function renderStats(container, currentSeason, currentMatchType) {
    const stats = getStats(currentSeason, currentMatchType);

    const content = container;
    content.innerHTML = ''; // Ensure we clear it here if not passed cleared

    let sortState = { key: 'goals', order: 'desc' }; // Default sort

    // Top Charts Grid
    const chartsContainer = document.createElement('div');
    chartsContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4';

    // ... (Charts rendering code remains same, omitted for brevity but preserved in real file) ...
    // Since we are replacing the start of the function, we need to be careful.
    // Actually, let's just insert the sort variable or modify the table rendering part.
    // A better approach is to keep renderStats simple and handle sorting in the table section.

    // Let's scroll down to table container creation.
    // ...

    // 6. Stats Table


    // 1. Goals Chart -> List
    const goalsChartContainer = document.createElement('div');
    goalsChartContainer.className = 'bg-gray-800 rounded-3xl p-6 border border-gray-700 hover:bg-gray-750 transition-colors';
    goalsChartContainer.innerHTML = `
        <div class="flex items-center justify-between mb-4">
             <h2 class="text-lg font-bold text-white flex items-center">
                <span class="mr-2">⚽</span> 득점
            </h2>
             <span class="text-xs text-neonGreen font-mono">Top 5</span>
        </div>
        <div class="space-y-3">
            ${stats.topScorers.filter(p => p.goals > 0).slice(0, 5).map((p, index) => `
                <div class="flex items-center justify-between group h-6 cursor-pointer" onclick="window.showHistoryModal('${p.name}', 'goals', window.getPlayerEvents('${currentSeason}', '${currentMatchType || 'all'}', '${p.name}', 'goals'))">
                    <div class="flex items-center space-x-3 overflow-hidden">
                        <span class="text-xs font-mono w-4 shrink-0 ${index < 3 ? 'text-neonGreen' : 'text-gray-500'}">${index + 1}</span>
                        <span class="text-xs text-gray-300 group-hover:text-white transition-colors truncate">${p.name}</span>
                    </div>
                    <span class="text-xs font-bold text-white font-mono shrink-0">${p.goals}</span>
                </div>
            `).join('') || '<div class="text-center text-gray-500 text-xs py-4">기록 없음</div>'}
        </div>
    `;
    chartsContainer.appendChild(goalsChartContainer);

    // 2. Assists Chart -> List
    const assistsChartContainer = document.createElement('div');
    assistsChartContainer.className = 'bg-gray-800 rounded-3xl p-6 border border-gray-700 hover:bg-gray-750 transition-colors';
    assistsChartContainer.innerHTML = `
        <div class="flex items-center justify-between mb-4">
             <h2 class="text-lg font-bold text-white flex items-center">
                <span class="mr-2">👟</span> 도움
            </h2>
             <span class="text-xs text-blue-400 font-mono">Top 5</span>
        </div>
        <div class="space-y-3">
             ${stats.topAssists.filter(p => p.assists > 0).slice(0, 5).map((p, index) => `
                <div class="flex items-center justify-between group h-6 cursor-pointer" onclick="window.showHistoryModal('${p.name}', 'assists', window.getPlayerEvents('${currentSeason}', '${currentMatchType || 'all'}', '${p.name}', 'assists'))">
                    <div class="flex items-center space-x-3 overflow-hidden">
                        <span class="text-xs font-mono w-4 shrink-0 ${index < 3 ? 'text-blue-400' : 'text-gray-500'}">${index + 1}</span>
                        <span class="text-xs text-gray-300 group-hover:text-white transition-colors truncate">${p.name}</span>
                    </div>
                    <span class="text-xs font-bold text-white font-mono shrink-0">${p.assists}</span>
                </div>
            `).join('') || '<div class="text-center text-gray-500 text-xs py-4">기록 없음</div>'}
        </div>
    `;
    chartsContainer.appendChild(assistsChartContainer);

    // 3. Appearances List
    const appearanceContainer = document.createElement('div');
    appearanceContainer.className = 'bg-gray-800 rounded-3xl p-6 border border-gray-700 hover:bg-gray-750 transition-colors';
    appearanceContainer.innerHTML = `
        <div class="flex items-center justify-between mb-4">
             <h2 class="text-lg font-bold text-white flex items-center">
                <span class="mr-2">🏃</span> 출전
            </h2>
             <span class="text-xs text-purple-400 font-mono">Top 5</span>
        </div>
        <div class="space-y-3">
             ${stats.topAppearances.filter(p => p.appearances > 0).slice(0, 5).map((p, index) => `
                <div class="flex items-center justify-between group h-6 cursor-pointer" onclick="window.showHistoryModal('${p.name}', 'appearances', window.getPlayerEvents('${currentSeason}', '${currentMatchType || 'all'}', '${p.name}', 'appearances'))">
                    <div class="flex items-center space-x-3 overflow-hidden">
                        <span class="text-xs font-mono w-4 shrink-0 ${index < 3 ? 'text-purple-400' : 'text-gray-500'}">${index + 1}</span>
                        <span class="text-xs text-gray-300 group-hover:text-white transition-colors truncate">${p.name}</span>
                    </div>
                     <div class="flex items-center space-x-1 text-xs font-mono shrink-0">
                        <span class="text-white font-bold">${p.appearances}</span>
                    </div>
                </div>
            `).join('') || '<div class="text-center text-gray-500 text-xs py-4">기록 없음</div>'}
        </div>
    `;
    chartsContainer.appendChild(appearanceContainer);

    // 4. Yellow Cards List
    const yellowCardContainer = document.createElement('div');
    yellowCardContainer.className = 'bg-gray-800 rounded-3xl p-6 border border-gray-700 hover:bg-gray-750 transition-colors';
    yellowCardContainer.innerHTML = `
        <div class="flex items-center justify-between mb-4">
             <h2 class="text-lg font-bold text-white flex items-center">
                <span class="mr-2">🟨</span> 경고
            </h2>
             <span class="text-xs text-yellow-400 font-mono">Top 5</span>
        </div>
        <div class="space-y-3">
             ${stats.topYellowCards.filter(p => p.yellowCards > 0).slice(0, 5).map((p, index) => `
                 <div class="flex items-center justify-between group h-6 cursor-pointer" onclick="window.showHistoryModal('${p.name}', 'yellowCards', window.getPlayerEvents('${currentSeason}', '${currentMatchType || 'all'}', '${p.name}', 'yellowCards'))">
                    <div class="flex items-center space-x-3 overflow-hidden">
                        <span class="text-xs font-mono w-4 shrink-0 ${index < 3 ? 'text-yellow-400' : 'text-gray-500'}">${index + 1}</span>
                        <span class="text-xs text-gray-300 group-hover:text-white transition-colors truncate">${p.name}</span>
                    </div>
                    <span class="text-xs font-bold text-yellow-500 font-mono shrink-0">${p.yellowCards}</span>
                </div>
            `).join('') || '<div class="text-center text-gray-500 text-xs py-4">기록 없음</div>'}
        </div>
    `;
    chartsContainer.appendChild(yellowCardContainer);

    // 5. Red Cards List
    const redCardContainer = document.createElement('div');
    redCardContainer.className = 'bg-gray-800 rounded-3xl p-6 border border-gray-700 hover:bg-gray-750 transition-colors';
    redCardContainer.innerHTML = `
        <div class="flex items-center justify-between mb-4">
             <h2 class="text-lg font-bold text-white flex items-center">
                <span class="mr-2">🟥</span> 퇴장
            </h2>
             <span class="text-xs text-red-500 font-mono">Top 5</span>
        </div>
        <div class="space-y-3">
             ${stats.topRedCards.filter(p => p.redCards > 0).slice(0, 5).map((p, index) => `
                 <div class="flex items-center justify-between group h-6 cursor-pointer" onclick="window.showHistoryModal('${p.name}', 'redCards', window.getPlayerEvents('${currentSeason}', '${currentMatchType || 'all'}', '${p.name}', 'redCards'))">
                    <div class="flex items-center space-x-3 overflow-hidden">
                        <span class="text-xs font-mono w-4 shrink-0 ${index < 3 ? 'text-red-500' : 'text-gray-500'}">${index + 1}</span>
                        <span class="text-xs text-gray-300 group-hover:text-white transition-colors truncate">${p.name}</span>
                    </div>
                    <span class="text-xs font-bold text-red-500 font-mono shrink-0">${p.redCards}</span>
                </div>
            `).join('') || '<div class="text-center text-gray-500 text-xs py-4">기록 없음</div>'}
        </div>
    `;
    chartsContainer.appendChild(redCardContainer);

    // 6. Own Goals List
    const ogContainer = document.createElement('div');
    ogContainer.className = 'bg-gray-800 rounded-3xl p-6 border border-gray-700 hover:bg-gray-750 transition-colors';
    ogContainer.innerHTML = `
        <div class="flex items-center justify-between mb-4">
             <h2 class="text-lg font-bold text-white flex items-center">
                <span class="mr-2">🥅</span> 자살골
            </h2>
             <span class="text-xs text-gray-400 font-mono">Owngoals</span>
        </div>
        <div class="space-y-3">
            ${(stats.topOwnGoals || []).filter(p => p.ownGoals > 0).slice(0, 5).map((p, index) => `
                 <div class="flex items-center justify-between group h-6 cursor-pointer" onclick="window.showHistoryModal('${p.name}', 'ownGoals', window.getPlayerEvents('${currentSeason}', '${currentMatchType || 'all'}', '${p.name}', 'ownGoals'))">
                    <div class="flex items-center space-x-3 overflow-hidden">
                        <span class="text-xs font-mono w-4 shrink-0 ${index < 3 ? 'text-gray-400' : 'text-gray-500'}">${index + 1}</span>
                        <span class="text-xs text-gray-300 group-hover:text-white transition-colors truncate">${p.name}</span>
                    </div>
                    <span class="text-xs font-bold text-red-400 font-mono shrink-0">${p.ownGoals}</span>
                </div>
            `).join('') || '<div class="text-center text-gray-500 text-xs py-4">기록 없음</div>'}
        </div>
    `;
    chartsContainer.appendChild(ogContainer);

    // 7. Stadium Stats (New Section)
    const stadiumStats = getStadiumStats(currentSeason, currentMatchType);
    if (currentMatchType !== '연습경기') {
        const stadiumContainer = document.createElement('div');
        stadiumContainer.className = 'col-span-1 md:col-span-2 lg:col-span-3 bg-gray-800 rounded-3xl border border-gray-700 hover:bg-gray-750 transition-colors mt-6 overflow-hidden';

        // Header with Toggle
        const header = document.createElement('div');
        header.className = 'p-6 flex items-center justify-between cursor-pointer';
        header.onclick = () => {
            const content = stadiumContainer.querySelector('.stadium-list');
            const icon = stadiumContainer.querySelector('.toggle-icon');
            content.classList.toggle('hidden');
            icon.style.transform = content.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
        };

        header.innerHTML = `
            <div class="flex items-center">
                <span class="mr-2">🏟️</span>
                <h2 class="text-lg font-bold text-white">구장 별 전적</h2>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 transform transition-transform duration-300 toggle-icon rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
        `;

        // Content (Collapsed by default, "hidden")
        const content = document.createElement('div');
        content.className = 'stadium-list px-6 pb-6 space-y-3 hidden'; // Hidden by default
        content.innerHTML = stadiumStats.length > 0 ? stadiumStats.map(s => `
            <div class="flex items-center justify-between p-3 rounded-lg bg-gray-700/30">
                <span class="text-sm text-gray-200 font-bold">${s.name}</span>
                <div class="flex items-center space-x-4">
                     <span class="text-xs text-gray-400">
                        <span class="text-neonGreen font-bold">${s.wins}승</span> 
                        <span class="text-gray-300 font-bold">${s.draws}무</span> 
                        <span class="text-red-400 font-bold">${s.losses}패</span>
                     </span>
                     <span class="text-xs font-mono text-gray-500 w-12 text-right">${s.winRate}%</span>
                </div>
            </div>
        `).join('') : '<div class="text-center text-gray-500 text-xs py-4">기록 없음</div>';

        stadiumContainer.appendChild(header);
        stadiumContainer.appendChild(content);
        chartsContainer.appendChild(stadiumContainer);
    }

    // 8. Opponent Stats
    const opponentStats = getOpponentStats(currentSeason, currentMatchType || 'all');
    let oppContainer = null;
    if (opponentStats.length > 0 && currentMatchType !== '연습경기') {
        oppContainer = document.createElement('div');
        oppContainer.className = 'bg-gray-800 p-4 rounded-2xl border border-gray-700 w-full mb-6';
        oppContainer.innerHTML = `
            <h3 class="text-sm text-gray-400 mb-3">상대 전적 <span class="text-xs text-gray-500 font-normal">(승/무/패)</span></h3>
             <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${opponentStats.map((o, i) => `
                    <div class="flex items-center justify-between border-b border-gray-700 pb-2 last:border-0 last:pb-0 bg-gray-700/30 p-2 rounded">
                         <div class="flex items-center space-x-2 w-1/3">
                            <span class="text-xs font-mono text-gray-500 w-3 flex-shrink-0">${i + 1}</span>
                            <span class="text-sm text-white font-bold truncate">${o.name}</span>
                        </div>
                        <div class="flex items-center space-x-2 text-xs font-mono user-select-none">
                            <div class="flex items-center space-x-1" title="승">
                                <span class="w-1.5 h-1.5 rounded-full bg-neonGreen"></span>
                                <span class="text-white">${o.wins}</span>
                            </div>
                            <div class="flex items-center space-x-1" title="무">
                                <span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                <span class="text-gray-300">${o.draws}</span>
                            </div>
                            <div class="flex items-center space-x-1" title="패">
                                <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                <span class="text-gray-400">${o.losses}</span>
                            </div>
                        </div>
                        <div class="text-[10px] text-gray-500 font-mono w-8 text-right">
                             ${Math.round((o.wins / o.total) * 100)}%
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 9. Table Section (With Title Inside and Collapsible)
    // Append Charts and Opponent Stats
    container.appendChild(chartsContainer);
    if (oppContainer) {
        container.appendChild(oppContainer);
    }

    // Append Table using helper
    const tableEl = createPlayerStatsTable(stats.players, currentSeason);
    tableEl.classList.add('mt-6');
    container.appendChild(tableEl);

    // Expose modal function to window
    window.showPlayerProfileModal = showPlayerProfileModal;

    renderTablePage(currentPage);




    // Initialize Charts
    setTimeout(() => {
        // Goals Chart
        const ctxGoals = document.getElementById('goalsChart');
        if (ctxGoals) {
            const validScorers = stats.topScorers.filter(p => p.goals > 0).slice(0, 5);
            new Chart(ctxGoals, {
                type: 'bar',
                data: {
                    labels: validScorers.map(p => p.name),
                    datasets: [{
                        label: 'G',
                        data: validScorers.map(p => p.goals),
                        backgroundColor: '#39FF14',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    onClick: (e, elements) => {
                        if (elements.length > 0) {
                            const index = elements[0].index;
                            const player = validScorers[index];
                            if (player) {
                                const events = getPlayerEvents(currentSeason, currentMatchType, player.name, 'goals');
                                showHistoryModal(player.name, 'goals', events);
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: '#374151' },
                            ticks: {
                                color: '#9CA3AF',
                                stepSize: 1,
                                precision: 0
                            }
                        },
                        x: { grid: { display: false }, ticks: { color: '#9CA3AF' } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }

        // Assists Chart
        const ctxAssists = document.getElementById('assistsChart');
        if (ctxAssists) {
            const validAssisters = stats.topAssists.filter(p => p.assists > 0).slice(0, 5);
            new Chart(ctxAssists, {
                type: 'bar',
                data: {
                    labels: validAssisters.map(p => p.name),
                    datasets: [{
                        label: 'A',
                        data: validAssisters.map(p => p.assists),
                        backgroundColor: '#39FF14',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    onClick: (e, elements) => {
                        if (elements.length > 0) {
                            const index = elements[0].index;
                            const player = validAssisters[index];
                            if (player) {
                                const events = getPlayerEvents(currentSeason, currentMatchType, player.name, 'assists');
                                showHistoryModal(player.name, 'assists', events);
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: '#374151' },
                            ticks: {
                                color: '#9CA3AF',
                                stepSize: 1,
                                precision: 0
                            }
                        },
                        x: { grid: { display: false }, ticks: { color: '#9CA3AF' } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }
    }, 0);
}

// Map Modal Logic
function showMapModal(shortName) {
    const fullName = getStadium(shortName);
    const existingModal = document.querySelector('#map-modal');
    if (existingModal) existingModal.remove();

    // Search Query Override (e.g., Address -> Place Name)
    let displayName = fullName;
    let naverUrl = `https://map.naver.com/p/search/${encodeURIComponent(fullName)}`;
    let kakaoUrl = `https://map.kakao.com/link/search/${encodeURIComponent(fullName)}`;
    let tmapUrl = `tmap://search?name=${encodeURIComponent(fullName)}`;

    if (shortName === '복지관' || fullName.includes('오리로 784')) {
        displayName = '서울시립근로청소년복지관';

        // Naver: User's provided link was generic (0,0 coords), so we keep the working Address search.
        naverUrl = `https://map.naver.com/p/search/${encodeURIComponent('경기도 광명시 오리로 784')}`;

        // Kakao: User provided specific share link
        kakaoUrl = 'https://kko.to/Ywi5JvLOXa';

        // TMAP: User provided specific share link
        tmapUrl = 'https://tmap.life/046416f0';
    }

    const modal = document.createElement('div');
    modal.id = 'map-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-center';
    modal.innerHTML = `
        <div class="bg-gray-800 rounded-3xl p-6 w-full max-w-sm border border-gray-700 shadow-2xl relative transform transition-all scale-100">
            <button class="absolute top-4 right-4 text-gray-500 hover:text-white" onclick="document.querySelector('#map-modal').remove()">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            
            <h3 class="text-xl font-bold text-white mb-1">🏟️ 경기장 안내</h3>
            <p class="text-sm text-neonGreen mb-6 font-medium">${displayName}</p>
            
            <div class="grid grid-cols-1 gap-3">
                <a href="${naverUrl}" target="_blank" class="flex items-center justify-center p-4 rounded-2xl bg-[#03C75A] text-white font-bold hover:brightness-110 transition-all shadow-lg">
                   <span class="mr-2">N</span> 네이버 지도
                </a>
                <a href="${kakaoUrl}" target="_blank" class="flex items-center justify-center p-4 rounded-2xl bg-[#FEE500] text-black font-bold hover:brightness-110 transition-all shadow-lg">
                   <span class="mr-2">K</span> 카카오맵
                </a>
                <a href="${tmapUrl}" class="flex items-center justify-center p-4 rounded-2xl bg-gradient-to-r from-[#E6002D] to-[#FF004D] text-white font-bold hover:brightness-110 transition-all shadow-lg">
                   <span class="mr-2">T</span> TMAP (앱 실행)
                </a>
                 <div class="text-[10px] text-gray-500 mt-2">* TMAP은 앱이 설치된 모바일 기기에서만 작동합니다.</div>
            </div>
        </div>
        `;

    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
}

// Make globally available for inline onclick handlers if needed, 
// strictly speaking regular event listeners are better, but I used innerHTML string injection before.
// I will instead attach event listeners via delegation or direct attachment after render.
window.showMapModal = showMapModal;
window.getPlayerEvents = getPlayerEvents; // Expose for inline onclick handlers

// Stat Details Modal
function showHistoryModal(playerName, eventType, events) {
    const existingModal = document.querySelector('#history-modal');
    if (existingModal) existingModal.remove();

    const titleMap = {
        'goals': '득점 기록',
        'assists': '도움 기록',
        'yellowCards': '경고 기록',
        'redCards': '퇴장 기록',
        'ownGoals': '자책골 기록',
        'appearances': '출전 기록'
    };

    const title = titleMap[eventType] || '상세 기록';

    const modal = document.createElement('div');
    modal.id = 'history-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in';
    modal.innerHTML = `
        <div class="bg-gray-800 rounded-3xl p-6 w-full max-w-sm border border-gray-700 shadow-2xl relative flex flex-col max-h-[80vh]">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h3 class="text-xl font-bold text-white">${playerName}</h3>
                    <span class="text-sm text-gray-400">${title} (총 ${events.length}회)</span>
                </div>
                <button class="text-gray-500 hover:text-white" onclick="document.querySelector('#history-modal').remove()">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <div class="overflow-y-auto pr-1 custom-scrollbar flex-1">
                <div class="space-y-2">
                    ${events.map(e => {
        // Logic for Goal-Assist Linking
        let linkedInfo = '';
        if (e.note && (e.goals > 0 || e.assists > 0)) {
            // Extract group tags like G1, G2, A1, A2
            const tags = e.note.match(/[GA]\d+/gi);
            if (tags) {
                // Find all records for this match
                const matchRecords = getMatchRecords(e.season, e.matchId);

                tags.forEach(tag => {
                    // Find partner
                    const partners = matchRecords.filter(r =>
                        r.name !== playerName &&
                        r.note &&
                        r.note.toUpperCase().includes(tag.toUpperCase())
                    );

                    partners.forEach(p => {
                        if (e.goals > 0 && p.assists > 0) {
                            linkedInfo += ` <span class="text-[10px] text-gray-400 font-normal ml-1 text-nowrap">(도움: ${p.name})</span>`;
                        } else if (e.assists > 0 && p.goals > 0) {
                            linkedInfo += ` <span class="text-[10px] text-gray-400 font-normal ml-1 text-nowrap">(득점: ${p.name})</span>`;
                        }
                    });
                });
            }
        }

        // Fallback: If no tags linked, show ANY assister/scorer from same match
        if (!linkedInfo && (e.goals > 0 || e.assists > 0)) {
            const matchRecords = getMatchRecords(e.season, e.matchId);
            if (e.goals > 0) {
                const assisters = matchRecords.filter(r => r.assists > 0 && r.name !== playerName).map(r => r.name).join(', ');
                if (assisters) linkedInfo = ` <span class="text-[10px] text-gray-400 font-normal ml-1 text-nowrap">(도움: ${assisters})</span>`;
            } else if (e.assists > 0) {
                const scorers = matchRecords.filter(r => r.goals > 0 && r.name !== playerName).map(r => r.name).join(', ');
                if (scorers) linkedInfo = ` <span class="text-[10px] text-gray-400 font-normal ml-1 text-nowrap">(득점: ${scorers})</span>`;
            }
        }

        return `
                        <div class="flex items-start justify-between p-3 rounded-xl bg-gray-700/50 hover:bg-gray-700 transition-colors">
                            <div class="flex items-center space-x-3 overflow-hidden">
                                <span class="text-[10px] font-mono text-neonGreen px-2 py-0.5 bg-neonGreen/10 rounded whitespace-nowrap flex-shrink-0">'${e.season.slice(-2)} ${e.round}</span>
                                <div class="flex flex-col min-w-0">
                                    <span class="text-sm text-white font-bold truncate">vs ${e.opponent}</span>
                                    <span class="text-[10px] text-gray-400">${e.date}</span>
                                </div>
                            </div>
                            
                            <div class="flex flex-col items-end ml-2 flex-shrink-0">
                                ${eventType === 'appearances'
                ? `<span class="text-xs font-bold ${e.appearance === '교체' ? 'text-gray-400' : 'text-neonGreen'}">${e.appearance || '선발'}</span>`
                : `<div class="flex items-end flex-col">
                                        <span class="text-lg font-bold text-white font-mono leading-none">+${eventType === 'goals' ? e.goals : (eventType === 'assists' ? e.assists : e.count || 1)}</span>
                                   </div>`
            }
                                ${eventType !== 'appearances' && linkedInfo ? `<div class="mt-1 flex justify-end">${linkedInfo}</div>` : ''}
                            </div>
                        </div>
                    `}).join('')}
                    ${events.length === 0 ? '<div class="text-center text-gray-500 py-10">기록이 없습니다.</div>' : ''}
                </div>
            </div>
        </div>
        `;

    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
}
window.showHistoryModal = showHistoryModal;

// Player Profile Modal (All Matches)
function showPlayerProfileModal(playerName, seasonFilter) {
    const events = window.getPlayerMatchHistory(playerName, seasonFilter);

    // Calculate total stats for header from events
    const totals = events.reduce((acc, e) => {
        acc.goals += e.goals;
        acc.assists += e.assists;
        acc.yellowCards += e.yellowCards;
        acc.redCards += e.redCards;
        return acc;
    }, { goals: 0, assists: 0, yellowCards: 0, redCards: 0 });

    const existingModal = document.querySelector('#profile-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'profile-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in';
    modal.innerHTML = `
        <div class="bg-gray-800 rounded-3xl p-6 w-full max-w-lg border border-gray-700 shadow-2xl relative flex flex-col max-h-[85vh]">
            <div class="flex justify-between items-start mb-6">
                <div>
                    <h3 class="text-2xl font-bold text-white mb-1">${playerName}</h3>
                    <div class="flex space-x-3 text-sm text-gray-400">
                        <span>득점 <span class="text-neonGreen font-bold">${totals.goals}</span></span>
                        <span>도움 <span class="text-white font-bold">${totals.assists}</span></span>
                        <span>경고 <span class="text-yellow-400 font-bold">${totals.yellowCards}</span></span>
                    </div>
                </div>
                <button class="text-gray-500 hover:text-white" onclick="document.querySelector('#profile-modal').remove()">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <div class="overflow-y-auto pr-1 custom-scrollbar flex-1">
                <div class="space-y-3">
                    ${events.map(e => `
                        <div class="p-4 rounded-xl bg-gray-700/50 hover:bg-gray-700 transition-colors border border-gray-600/30">
                            <div class="flex justify-between items-center mb-2">
                                <div class="flex items-center space-x-2">
                                    <span class="text-[10px] font-mono text-neonGreen px-2 py-0.5 bg-neonGreen/10 rounded whitespace-nowrap">
                                        '${e.season ? e.season.slice(-2) : ''} ${e.matchType || e.round}
                                    </span>
                                    <span class="text-xs text-gray-400">${e.date}</span>
                                </div>
                                <span class="text-xs font-bold ${e.appearance === '교체' ? 'text-gray-500' : 'text-neonGreen'}">
                                    ${e.appearance}
                                </span>
                            </div>
                            
                            <div class="flex justify-between items-center">
                                <span class="text-sm font-bold text-white">vs ${e.opponent}</span>
                                <div class="flex space-x-2 text-xs font-mono">
                                    ${e.goals > 0 ? `<span class="text-neonGreen">G ${e.goals}</span>` : ''}
                                    ${e.assists > 0 ? `<span class="text-blue-400">A ${e.assists}</span>` : ''}
                                    ${e.yellowCards > 0 ? `<span class="text-yellow-400">Y ${e.yellowCards}</span>` : ''}
                                    ${e.redCards > 0 ? `<span class="text-red-500">R ${e.redCards}</span>` : ''}
                                    ${e.goals === 0 && e.assists === 0 && e.yellowCards === 0 && e.redCards === 0 ? '<span class="text-gray-600">-</span>' : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                    ${events.length === 0 ? '<div class="text-center text-gray-500 py-10">경기 기록이 없습니다.</div>' : ''}
                </div>
            </div>
        </div>
        `;

    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
}
window.showPlayerProfileModal = showPlayerProfileModal;

function createPlayerStatsTable(players, currentSeason) {
    const tableContainer = document.createElement('div');
    tableContainer.className = 'flex flex-col mt-6 bg-gray-800 rounded-3xl border border-gray-700 overflow-hidden text-sm';

    // Header with Toggle
    const tableHeader = document.createElement('div');
    tableHeader.className = 'p-5 flex items-center justify-between cursor-pointer hover:bg-gray-750 transition-colors';
    tableHeader.onclick = () => {
        const content = tableContainer.querySelector('.table-content');
        const icon = tableContainer.querySelector('.toggle-icon');
        content.classList.toggle('hidden');
        icon.style.transform = content.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
    };

    tableHeader.innerHTML = `
        <div class="flex items-center">
            <span class="mr-2">📊</span>
            <h2 class="text-base font-bold text-white">선수 개인 기록</h2>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 transform transition-transform duration-300 toggle-icon rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
    `;
    tableContainer.appendChild(tableHeader);

    const tableContent = document.createElement('div');
    tableContent.className = 'table-content px-0 pb-0 space-y-3 hidden'; // Default hidden

    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'overflow-hidden flex flex-col';

    tableWrapper.innerHTML = `
        <div class="p-4 border-b border-gray-700">
            <input type="text" id="player-search-input" placeholder="검색" class="w-full bg-gray-700 text-white text-xs rounded-lg px-3 py-2 border border-gray-600 outline-none focus:border-neonGreen placeholder-gray-400" />
        </div>
        <div class="overflow-x-auto max-h-[500px] overflow-y-auto relative custom-scrollbar">
            <table class="w-full relative border-collapse">
                <thead class="bg-gray-900 border-b border-gray-700 sticky top-0 z-10 shadow-sm">
                    <tr>
                         <th class="p-3 text-center text-xs text-gray-500 font-medium w-12">순위</th>
                        <th class="cursor-pointer hover:bg-gray-800 p-3 text-center text-xs text-gray-500 font-medium select-none transition-colors group" data-sort="position">포지션</th>
                        <th class="cursor-pointer hover:bg-gray-800 p-3 text-left text-xs text-gray-500 font-medium select-none transition-colors group" data-sort="name">선수명</th>
                        <th class="cursor-pointer hover:bg-gray-800 p-3 text-center text-xs text-gray-500 font-medium select-none transition-colors group whitespace-nowrap" data-sort="starts">출전(선발/교체)</th>
                        <th class="cursor-pointer hover:bg-gray-800 p-3 text-center text-xs text-neonGreen font-bold select-none transition-colors group bg-gray-800/50 whitespace-nowrap" data-sort="attackPoints">공격포인트</th>
                        <th class="cursor-pointer hover:bg-gray-800 p-3 text-center text-xs text-gray-500 font-medium select-none transition-colors group whitespace-nowrap" data-sort="goals">득점</th>
                        <th class="cursor-pointer hover:bg-gray-800 p-3 text-center text-xs text-gray-500 font-medium select-none transition-colors group whitespace-nowrap" data-sort="assists">도움</th>
                        <th class="cursor-pointer hover:bg-gray-800 p-3 text-center text-xs text-yellow-400 font-medium select-none transition-colors group whitespace-nowrap" data-sort="yellowCards">경고</th>
                        <th class="cursor-pointer hover:bg-gray-800 p-3 text-center text-xs text-red-400 font-medium select-none transition-colors group whitespace-nowrap" data-sort="ownGoals">자살골</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700/50"></tbody>
            </table>
        </div>
        <div class="pagination-controls p-3 border-t border-gray-700 flex justify-between items-center bg-gray-800"></div>
    `;

    tableContent.appendChild(tableWrapper);
    tableContainer.appendChild(tableContent);

    // State
    let currentPage = 1;
    const itemsPerPage = 10;
    let searchQuery = '';
    let sortState = { key: 'attackPoints', order: 'desc' };

    const renderTablePage = (page) => {
        let filteredPlayers = players;
        if (searchQuery.trim()) {
            filteredPlayers = players.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        filteredPlayers.sort((a, b) => {
            let valA = a[sortState.key];
            let valB = b[sortState.key];

            if (sortState.key === 'position') {
                const posOrder = { 'FW': 1, 'MF': 2, 'DF': 3, 'GK': 4 };
                valA = posOrder[valA] || 99;
                valB = posOrder[valB] || 99;
            }

            if (valA === valB) return a.name.localeCompare(b.name);
            return sortState.order === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
        });

        const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage) || 1;
        if (page > totalPages) page = totalPages;
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageData = filteredPlayers.slice(start, end);

        const tableBody = tableWrapper.querySelector('tbody');
        if (!tableBody) return;

        const rowsHtml = pageData.map((p, index) => {
            const globalIndex = start + index + 1;
            return `
            <tr class="border-b border-gray-700 last:border-0 hover:bg-gray-750 transition-colors">
                 <td class="p-3 text-center text-xs text-gray-500 font-mono w-12">${globalIndex}</td>
                <td class="p-3 text-sm text-gray-300 w-16 text-center">${p.position}</td>
                <td class="p-3 text-sm font-bold text-white cursor-pointer hover:text-neonGreen hover:underline transition-colors player-name-cell" onclick="window.showPlayerProfileModal('${p.name}', '${currentSeason}')">${p.name}</td>
                <td class="p-3 text-center text-xs text-gray-400 font-mono w-24">
                    <span class="text-neonGreen font-bold">${p.starts}</span> / <span class="text-white">${p.substitutes}</span>
                </td>
                <td class="p-3 text-sm text-center text-neonGreen font-mono w-16 font-bold bg-gray-800/50">${p.attackPoints}</td>
                <td class="p-3 text-sm text-center text-gray-300 font-mono w-16">${p.goals}</td>
                <td class="p-3 text-sm text-center text-gray-400 font-mono w-16">${p.assists}</td>
                <td class="p-3 text-sm text-center text-yellow-400 font-mono w-16">${p.yellowCards || 0}</td>
                <td class="p-3 text-sm text-center text-red-400 font-mono w-16">${p.ownGoals}</td>
            </tr>
        `}).join('');

        tableBody.innerHTML = rowsHtml || '<tr><td colspan="9" class="text-center py-10 text-gray-500">기록 없음</td></tr>';

        const paginationEl = tableWrapper.querySelector('.pagination-controls');
        if (paginationEl) {
            paginationEl.innerHTML = `
                <button ${page === 1 ? 'disabled' : ''} class="prev-btn px-3 py-1 bg-gray-700 rounded text-xs ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600 border border-gray-600'} text-gray-300">이전</button>
                <span class="text-xs text-gray-400 font-mono">${page} / ${totalPages}</span>
                <button ${page === totalPages ? 'disabled' : ''} class="next-btn px-3 py-1 bg-gray-700 rounded text-xs ${page === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600 border border-gray-600'} text-gray-300">다음</button>
            `;
            paginationEl.querySelector('.prev-btn').onclick = () => {
                if (currentPage > 1) { currentPage--; renderTablePage(currentPage); }
            };
            paginationEl.querySelector('.next-btn').onclick = () => {
                if (currentPage < totalPages) { currentPage++; renderTablePage(currentPage); }
            };
        }

        const thead = tableWrapper.querySelector('thead');
        if (thead) {
            thead.querySelectorAll('th[data-sort]').forEach(th => {
                const key = th.dataset.sort;
                if (!th.querySelector('span')) th.innerHTML += ' <span></span>';
                const indicatorSpan = th.querySelector('span');
                if (indicatorSpan) {
                    if (sortState.key !== key) {
                        indicatorSpan.className = "text-gray-600 ml-1 text-[10px]";
                        indicatorSpan.innerHTML = "⇅";
                    } else {
                        indicatorSpan.className = "text-neonGreen ml-1 text-[10px]";
                        indicatorSpan.innerHTML = sortState.order === 'asc' ? "▲" : "▼";
                    }
                }
            });
        }
    };

    const handleHeaderClick = (e) => {
        const th = e.currentTarget;
        const key = th.getAttribute('data-sort');
        if (sortState.key === key) {
            sortState.order = sortState.order === 'desc' ? 'asc' : 'desc';
        } else {
            sortState.key = key;
            sortState.order = 'desc';
        }
        renderTablePage(currentPage);
    };

    tableWrapper.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', handleHeaderClick);
    });

    const searchInput = tableWrapper.querySelector('#player-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            currentPage = 1;
            renderTablePage(currentPage);
        });
    }

    renderTablePage(currentPage);
    return tableContainer;
}
