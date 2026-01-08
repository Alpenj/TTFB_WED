import Chart from 'chart.js/auto';
import { getSchedule, getStats, getTeamStats, getStadium, getAvailableSeasons, getAvailableMatchTypes, getMatchRecords, getPlayerEvents, getOpponentStats, getPlayerMatchHistory } from './data.js';

window.getPlayerMatchHistory = getPlayerMatchHistory; // Expose for inline onclick handlers

export function SetupDashboard() {
    const app = document.querySelector('#app');

    // State
    const seasons = getAvailableSeasons();
    const matchTypes = getAvailableMatchTypes();
    let currentSeason = seasons[0] || 'all'; // Default to latest season, fall back to 'all' if empty
    let currentMatchType = 'all';

    // Initial Layout: Header, Main Content, Bottom Nav
    app.innerHTML = `
        <header class="p-4 flex items-center justify-between bg-black/50 backdrop-blur-md sticky top-0 z-10 border-b border-gray-800">
            <h1 id="app-title" class="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity">TTFB_WED</h1>
            <div class="flex items-center space-x-2">
                 <select id="season-selector" class="bg-gray-800 text-white text-xs rounded-lg px-2 py-1 border border-gray-700 outline-none focus:border-neonGreen">
                    ${seasons.map(s => `<option value="${s}">${s} 시즌</option>`).join('')}
                    <option value="all">통산 기록</option>
                 </select>
            </div>
        </header>
        
        <!-- Match Type Tabs -->
        <div class="sticky top-[60px] z-[5] bg-black/50 backdrop-blur-md border-b border-gray-800 overflow-x-auto custom-scrollbar">
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

        <main id="content" class="flex-1 overflow-y-auto p-4 pb-20 space-y-6">
            <!-- Dynamic Content -->
        </main>

        <nav class="absolute bottom-0 w-full bg-black/80 backdrop-blur-lg border-t border-gray-800 p-2">
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
    const upcomingMatch = schedule.find(m => {
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

    const lastMatch = [...schedule].reverse().find(m => m.result && m.result.trim() !== '');

    let recentResultMarkup = '';
    if (lastMatch) {
        const parts = lastMatch.result.split(':');
        const isScore = parts.length === 2 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]));

        const isWin = lastMatch.result.includes('승') || (isScore && parseInt(parts[0]) > parseInt(parts[1]));
        const isDraw = lastMatch.result.includes('무') || (isScore && parseInt(parts[0]) === parseInt(parts[1]));
        const resultColor = isWin ? 'text-neonGreen' : (isDraw ? 'text-yellow-400' : 'text-red-400');

        recentResultMarkup = `
            <div class="bg-gray-800 rounded-3xl p-6 border border-gray-700 cursor-pointer hover:bg-gray-750 transition-colors" id="btn-recent-match">
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
        
        <!-- Top Scorers Preview -->
         <div class="bg-gray-800 rounded-3xl p-6 border border-gray-700 cursor-pointer hover:bg-gray-750 transition-colors" id="btn-stats-detail">
            <h2 class="text-lg font-bold text-white mb-4 flex items-center">
                <span class="mr-2">⚽</span> 득점 랭킹 Top 3
            </h2>
            <ul class="space-y-3">
                ${stats.topScorers.slice(0, 3).map((player, index) => `
                <li class="flex items-center justify-between p-2 rounded-xl bg-gray-700/50">
                    <div class="flex items-center">
                        <span class="text-neonGreen font-bold w-6 text-center">${index + 1}</span>
                         <span class="text-gray-200 text-sm">${player.name}</span>
                    </div>
                    <span class="text-white font-bold text-sm bg-gray-600 px-2 py-0.5 rounded-full">${player.goals}골</span>
                </li>
                `).join('')}
                 ${stats.topScorers.length === 0 ? '<li class="text-gray-500 text-xs text-center p-2">기록 없음</li>' : ''}
            </ul>
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

    // 4. Opponent Stats (Added per user request)
    const opponentStats = getOpponentStats(currentSeason, currentMatchType);
    // Explicitly filter blank names and practice matches if needed (though data.js handles practice match filtering for 'all')
    const validOpponents = opponentStats.filter(o => o.name);

    if (validOpponents.length > 0) {
        const oppSection = document.createElement('div');
        oppSection.className = 'bg-gray-800 p-4 rounded-2xl border border-gray-700 w-full mb-6 mt-6';
        oppSection.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <h3 class="text-sm font-bold text-white">상대 전적 <span class="text-xs text-gray-500 font-normal">(승/무/패)</span></h3>
                ${currentMatchType === 'all' && currentSeason === 'all' ? '<span class="text-[10px] text-gray-500">* 연습경기 제외</span>' : ''}
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            </div>
        `;
        container.appendChild(oppSection);
    }
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
            listContainer.innerHTML = `<div class="text-center text-gray-500 py-10">일정이 없습니다.</div>`;
            return;
        }

        pageItems.forEach(match => {
            let statusColor = 'border-gray-700';
            let resultText = '';

            if (match.result) {
                const parts = match.result.split(':');
                const isScore = parts.length === 2 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]));

                const isWin = match.result.includes('승') || (isScore && parseInt(parts[0]) > parseInt(parts[1]));
                const isDraw = match.result.includes('무') || (isScore && parseInt(parts[0]) === parseInt(parts[1]));
                // Loss is else

                if (isWin) statusColor = 'border-neonGreen';
                else if (isDraw) statusColor = 'border-yellow-400';
                else statusColor = 'border-red-500';

                const textColor = isWin ? 'text-neonGreen' : (isDraw ? 'text-yellow-400' : 'text-red-400');

                resultText = `<span class="font-bold ml-auto ${textColor}">${match.result}</span>`;
            } else {
                resultText = `<span class="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded ml-auto">예정</span>`;
            }

            // Get Scorer Details
            const records = getMatchRecords(match.season, match.matchId);
            const scorers = records.filter(r => r.goals > 0);
            const assisters = records.filter(r => r.assists > 0);

            let detailsMarkup = '';
            if (scorers.length > 0) {
                const scorerText = scorers.map(p => `<span class="text-gray-300">${p.name}</span>${p.goals > 1 ? `<span class="text-neonGreen text-[10px] ml-0.5">(${p.goals})</span>` : ''}`).join(', ');
                detailsMarkup += `<div class="mt-2 text-xs flex items-center space-x-1"><span class="text-neonGreen">⚽</span> <span>${scorerText}</span></div>`;
            }
            if (assisters.length > 0) {
                // Optional: Show assists? User only mentioned "goals/assists". 
                // Let's combine or show separate line. Separate line is cleaner.
                const assistText = assisters.map(p => `<span class="text-gray-300">${p.name}</span>${p.assists > 1 ? `<span class="text-gray-500 text-[10px] ml-0.5">(${p.assists})</span>` : ''}`).join(', ');
                detailsMarkup += `<div class="mt-1 text-xs flex items-center space-x-1"><span class="text-blue-400">👟</span> <span>${assistText}</span></div>`;
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

    // Sort State
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


    // 1. Goals Chart
    const goalsChartContainer = document.createElement('div');
    goalsChartContainer.className = 'bg-gray-800 p-4 rounded-2xl border border-gray-700';

    const validScorers = stats.topScorers.filter(p => p.goals > 0).slice(0, 5);
    if (validScorers.length > 0) {
        goalsChartContainer.innerHTML = `<h3 class="text-sm text-gray-400 mb-4">득점 순위</h3><canvas id="goalsChart"></canvas>`;
    } else {
        goalsChartContainer.innerHTML = `<h3 class="text-sm text-gray-400 mb-4">득점 순위</h3><div class="text-center text-gray-500 text-xs py-10">기록 없음</div>`;
    }
    chartsContainer.appendChild(goalsChartContainer);

    // 2. Assists Chart
    const assistsChartContainer = document.createElement('div');
    assistsChartContainer.className = 'bg-gray-800 p-4 rounded-2xl border border-gray-700';

    const validAssisters = stats.topAssists.filter(p => p.assists > 0).slice(0, 5);
    if (validAssisters.length > 0) {
        assistsChartContainer.innerHTML = `<h3 class="text-sm text-gray-400 mb-4">도움 순위</h3><canvas id="assistsChart"></canvas>`;
    } else {
        assistsChartContainer.innerHTML = `<h3 class="text-sm text-gray-400 mb-4">도움 순위</h3><div class="text-center text-gray-500 text-xs py-10">기록 없음</div>`;
    }
    chartsContainer.appendChild(assistsChartContainer);

    // 3. Appearances List (Start/Sub)
    const appearanceContainer = document.createElement('div');
    appearanceContainer.className = 'bg-gray-800 p-4 rounded-2xl border border-gray-700';
    appearanceContainer.innerHTML = `
        <h3 class="text-sm text-gray-400 mb-3 leading-snug">출전 횟수<br><span class="text-xs text-gray-500 font-normal">(선발/교체)</span></h3>
        <div class="space-y-2">
            ${stats.topAppearances.filter(p => p.appearances > 0).slice(0, 5).map((p, i) => `
                <div class="flex items-center justify-between border-b border-gray-700 pb-2 last:border-0 last:pb-0 hover:bg-gray-700/50 cursor-pointer p-1 rounded transition-colors" onclick="window.showHistoryModal('${p.name}', 'appearances', getPlayerEvents('${currentSeason}', '${currentMatchType || 'all'}', '${p.name}', 'appearances'))">
                    <div class="flex items-center space-x-2 overflow-hidden">
                        <span class="text-xs font-mono text-gray-500 w-3 flex-shrink-0">${i + 1}</span>
                        <span class="text-sm text-white font-bold truncate">${p.name}</span>
                        <span class="text-[10px] text-gray-500 flex-shrink-0">(${p.position})</span>
                    </div>
                    <div class="flex items-center space-x-1 text-xs font-mono">
                        <span class="text-neonGreen font-bold">${p.starts}</span>
                        <span class="text-gray-500">/</span>
                        <span class="text-white">${p.substitutes}</span>
                    </div>
                </div>
            `).join('') || '<div class="text-center text-gray-500 text-xs py-4">기록 없음</div>'}
        </div>
`;
    chartsContainer.appendChild(appearanceContainer);

    // 4. Yellow Cards List
    const yellowCardContainer = document.createElement('div');
    yellowCardContainer.className = 'bg-gray-800 p-4 rounded-2xl border border-gray-700';
    yellowCardContainer.innerHTML = `
            <h3 class="text-sm text-gray-400 mb-3">경고</h3>
        <div class="space-y-2">
            ${stats.topYellowCards.filter(p => p.yellowCards > 0).slice(0, 5).map((p, i) => `
                <div class="flex items-center justify-between border-b border-gray-700 pb-2 last:border-0 last:pb-0 hover:bg-gray-700/50 cursor-pointer p-1 rounded transition-colors" onclick="window.showHistoryModal('${p.name}', 'yellowCards', window.getPlayerEvents('${currentSeason}', '${currentMatchType || 'all'}', '${p.name}', 'yellowCards'))">
                    <div class="flex items-center space-x-2 overflow-hidden">
                        <span class="text-xs font-mono text-gray-500 w-3 flex-shrink-0">${i + 1}</span>
                        <span class="text-sm text-white font-bold truncate">${p.name}</span>
                    </div>
                    <span class="text-sm text-yellow-400 font-mono font-bold flex-shrink-0">${p.yellowCards}</span>
                </div>
            `).join('') || '<div class="text-center text-gray-500 text-xs py-4">기록 없음</div>'}
        </div>
`;
    chartsContainer.appendChild(yellowCardContainer);

    // 5. Red Cards List (Moved up)
    const redCardContainer = document.createElement('div');
    redCardContainer.className = 'bg-gray-800 p-4 rounded-2xl border border-gray-700';
    redCardContainer.innerHTML = `
            <h3 class="text-sm text-gray-400 mb-3">퇴장</h3>
        <div class="space-y-2">
            ${stats.topRedCards.filter(p => p.redCards > 0).slice(0, 5).map((p, i) => `
                <div class="flex items-center justify-between border-b border-gray-700 pb-2 last:border-0 last:pb-0 hover:bg-gray-700/50 cursor-pointer p-1 rounded transition-colors" onclick="window.showHistoryModal('${p.name}', 'redCards', window.getPlayerEvents('${currentSeason}', '${currentMatchType || 'all'}', '${p.name}', 'redCards'))">
                    <div class="flex items-center space-x-2 overflow-hidden">
                        <span class="text-xs font-mono text-gray-500 w-3 flex-shrink-0">${i + 1}</span>
                        <span class="text-sm text-white font-bold truncate">${p.name}</span>
                    </div>
                    <span class="text-sm text-red-500 font-mono font-bold flex-shrink-0">${p.redCards}</span>
                </div>
            `).join('') || '<div class="text-center text-gray-500 text-xs py-4">기록 없음</div>'}
        </div>
`;
    chartsContainer.appendChild(redCardContainer);

    // 6. Own Goals List (Moved to bottom right slot, Always visible)
    const ogContainer = document.createElement('div');
    ogContainer.className = 'bg-gray-800 p-4 rounded-2xl border border-gray-700';
    ogContainer.innerHTML = `
        <h3 class="text-sm text-gray-400 mb-3 leading-snug">자살골<br><span class="text-xs text-gray-500 font-normal">(Own Goals)</span></h3>
        <div class="space-y-2">
            ${(stats.topOwnGoals || []).filter(p => p.ownGoals > 0).slice(0, 5).map((p, i) => `
                <div class="flex items-center justify-between border-b border-gray-700 pb-2 last:border-0 last:pb-0 hover:bg-gray-700/50 cursor-pointer p-1 rounded transition-colors" onclick="window.showHistoryModal('${p.name}', 'ownGoals', window.getPlayerEvents('${currentSeason}', '${currentMatchType || 'all'}', '${p.name}', 'ownGoals'))">
                    <div class="flex items-center space-x-2 overflow-hidden">
                        <span class="text-xs font-mono text-gray-500 w-3 flex-shrink-0">${i + 1}</span>
                        <span class="text-sm text-white font-bold truncate">${p.name}</span>
                        <span class="text-[10px] text-gray-500 flex-shrink-0">(${p.position})</span>
                    </div>
                    <span class="text-sm text-red-400 font-mono font-bold flex-shrink-0">${p.ownGoals}</span>
                </div>
            `).join('') || '<div class="text-center text-gray-500 text-xs py-4">기록 없음</div>'}
        </div>
    `;
    chartsContainer.appendChild(ogContainer);


    // 7. Opponent Stats (Moved below grid, Full Width)
    const opponentStats = getOpponentStats(currentSeason, currentMatchType || 'all');
    let oppContainer = null;
    // Hide Opponent Stats if "Practice Match" is selected
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

    const tableContainer = document.createElement('div');
    tableContainer.className = 'bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden flex flex-col';

    // Pagination & Sort State
    let currentPage = 1;
    const itemsPerPage = 10;

    // Sort Helper
    const getSortIndicator = (key) => {
        if (sortState.key !== key) return '<span class="text-gray-600 ml-1 text-[10px]">⇅</span>';
        return sortState.order === 'asc' ? '<span class="text-neonGreen ml-1 text-[10px]">▲</span>' : '<span class="text-neonGreen ml-1 text-[10px]">▼</span>';
    };

    const renderTablePage = (page) => {
        // Sort Data
        stats.players.sort((a, b) => {
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

        const totalPages = Math.ceil(stats.players.length / itemsPerPage) || 1;
        if (page > totalPages) page = totalPages;

        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageData = stats.players.slice(start, end);

        const tableBody = tableContainer.querySelector('tbody');
        if (!tableBody) return; // Safety check

        const rowsHtml = pageData.map((p, index) => {
            // Rank Calculation (Global index based on sort)
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
                <td class="p-3 text-sm text-center text-red-400 font-mono w-16">${p.ownGoals}</td>
            </tr>
        `}).join('');

        tableBody.innerHTML = rowsHtml || '<tr><td colspan="8" class="text-center py-10 text-gray-500">기록 없음</td></tr>';

        // Update Pagination Controls
        const paginationEl = tableContainer.querySelector('.pagination-controls');
        if (paginationEl) {
            paginationEl.innerHTML = `
                <button ${page === 1 ? 'disabled' : ''} class="prev-btn px-3 py-1 bg-gray-700 rounded text-xs ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600 border border-gray-600'} text-gray-300">이전</button>
                <span class="text-xs text-gray-400 font-mono">${page} / ${totalPages}</span>
                <button ${page === totalPages ? 'disabled' : ''} class="next-btn px-3 py-1 bg-gray-700 rounded text-xs ${page === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600 border border-gray-600'} text-gray-300">다음</button>
            `;

            // Re-attach listeners using closure to avoid querySelector lookup issues if re-rendered
            paginationEl.querySelector('.prev-btn').onclick = () => {
                if (currentPage > 1) { currentPage--; renderTablePage(currentPage); }
            };
            paginationEl.querySelector('.next-btn').onclick = () => {
                if (currentPage < totalPages) { currentPage++; renderTablePage(currentPage); }
            };
        }

        // Update Header Sort Indicators
        const thead = tableContainer.querySelector('thead');
        if (thead) {
            thead.querySelectorAll('th[data-sort]').forEach(th => {
                const key = th.dataset.sort;
                th.innerHTML = `${th.innerText.split(' ')[0]} ${getSortIndicator(key)}`;

                // Re-attach click listener? No, it's better to attach once.
                // But replacing innerHTML breaks listeners if attached to TH.
                // Solution: Attach listener to TR or THEAD once, or re-attach here.
                // Let's attach to THEAD once in the initial HTML setup, using event delegation.
            });
        }
    };

    // Initial HTML Structure
    tableContainer.innerHTML = `
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
                        <th class="cursor-pointer hover:bg-gray-800 p-3 text-center text-xs text-red-400 font-medium select-none transition-colors group whitespace-nowrap" data-sort="ownGoals">자살골</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700/50"></tbody>
            </table>
        </div>
        <div class="pagination-controls p-3 border-t border-gray-700 flex justify-between items-center bg-gray-800"></div>
    `;

    // Attach Header Click Listeners (Event Delegation)
    const headerRow = tableContainer.querySelector('thead tr');
    if (headerRow) {
        headerRow.addEventListener('click', (e) => {
            const th = e.target.closest('th[data-sort]');
            if (!th) return;
            const key = th.dataset.sort;

            if (sortState.key === key) {
                sortState.order = sortState.order === 'desc' ? 'asc' : 'desc';
            } else {
                sortState.key = key;
                sortState.order = 'desc'; // Default new sort to desc for stats
                if (key === 'name' || key === 'position') sortState.order = 'asc';
            }
            renderTablePage(currentPage);
        });
    }

    container.appendChild(chartsContainer);
    if (oppContainer) container.appendChild(oppContainer); // Append Opponent Stats below grid
    container.appendChild(tableContainer);

    // Initial Render
    renderTablePage(currentPage);

    // Expose modal function to window
    window.showPlayerProfileModal = showPlayerProfileModal;

    // Add Click Listeners to Headers
    const attachHeaderListeners = () => {
        tableContainer.querySelectorAll('th').forEach(th => {
            th.removeEventListener('click', handleHeaderClick); // Avoid duplicates if any
            th.addEventListener('click', handleHeaderClick);
        });
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

        // Update Indicators Manually
        tableContainer.querySelectorAll('th').forEach(header => {
            const k = header.getAttribute('data-sort');
            const indicatorSpan = header.querySelector('span');
            if (indicatorSpan) {
                if (sortState.key !== k) {
                    indicatorSpan.className = "text-gray-600 ml-1";
                    indicatorSpan.innerHTML = "⇅";
                } else {
                    indicatorSpan.className = "text-neonGreen ml-1";
                    indicatorSpan.innerHTML = sortState.order === 'asc' ? "▲" : "▼";
                }
            }
        });

        renderTablePage(currentPage);
    };

    // Attach initially
    attachHeaderListeners();

    container.appendChild(chartsContainer);
    container.appendChild(tableContainer);

    // Initial Render
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
            <p class="text-sm text-neonGreen mb-6 font-medium">${fullName}</p>
            
            <div class="grid grid-cols-1 gap-3">
                <a href="https://map.naver.com/p/search/${encodeURIComponent(fullName)}" target="_blank" class="flex items-center justify-center p-4 rounded-2xl bg-[#03C75A] text-white font-bold hover:brightness-110 transition-all shadow-lg">
                   <span class="mr-2">N</span> 네이버 지도
                </a>
                <a href="https://map.kakao.com/link/search/${encodeURIComponent(fullName)}" target="_blank" class="flex items-center justify-center p-4 rounded-2xl bg-[#FEE500] text-black font-bold hover:brightness-110 transition-all shadow-lg">
                   <span class="mr-2">K</span> 카카오맵
                </a>
                <a href="tmap://search?name=${encodeURIComponent(fullName)}" class="flex items-center justify-center p-4 rounded-2xl bg-gradient-to-r from-[#E6002D] to-[#FF004D] text-white font-bold hover:brightness-110 transition-all shadow-lg">
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
                    ${events.map(e => `
                        <div class="flex items-center justify-between p-3 rounded-xl bg-gray-700/50 hover:bg-gray-700 transition-colors">
                            <div class="flex items-center space-x-3">
                                <span class="text-xs font-mono text-neonGreen px-2 text-center bg-neonGreen/10 rounded py-1 whitespace-nowrap flex-shrink-0">${e.round}</span>
                                <div class="flex flex-col">
                                    <span class="text-sm text-white font-bold">vs ${e.opponent}</span>
                                    <span class="text-[10px] text-gray-400">${e.date}</span>
                                </div>
                            </div>
                            <div class="flex items-center">
                                ${eventType === 'appearances'
            ? `<span class="text-xs font-bold ${e.submissionType === '교체' ? 'text-gray-400' : 'text-neonGreen'}">${e.submissionType || '선발'}</span>`
            : `<span class="text-lg font-bold text-white font-mono">+${e.count}</span>`
        }
                            </div>
                        </div>
                    `).join('')}
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
