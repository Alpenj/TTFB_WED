import Chart from 'chart.js/auto';
import { getSchedule, getStats, getTeamStats, getStadium, getAvailableSeasons } from './data.js';

export function SetupDashboard() {
    const app = document.querySelector('#app');

    // State
    const seasons = getAvailableSeasons();
    let currentSeason = seasons[0] || 'all'; // Default to latest season, fall back to 'all' if empty

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
        renderView(view, currentSeason);
    });

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
    renderView('home', currentSeason);
}

function renderView(view, currentSeason) {
    const content = document.querySelector('#content');
    content.innerHTML = ''; // Clear content
    content.className = 'flex-1 overflow-y-auto p-4 pb-20 space-y-6 opacity-0 transition-opacity duration-300';

    setTimeout(() => {
        content.classList.remove('opacity-0');
    }, 50);

    if (view === 'home') renderHome(content, currentSeason);
    else if (view === 'matches') renderMatches(content, currentSeason);
    else if (view === 'stats') renderStats(content, currentSeason);
}

function renderHome(container, currentSeason) {
    const schedule = getSchedule(currentSeason);
    const stats = getStats(currentSeason);
    const teamStats = getTeamStats(currentSeason);

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
        const isWin = lastMatch.result.includes('승') || (lastMatch.result.includes(':') && parseInt(lastMatch.result.split(':')[0]) > parseInt(lastMatch.result.split(':')[1]));
        const isDraw = lastMatch.result.includes('무') || (lastMatch.result.includes(':') && parseInt(lastMatch.result.split(':')[0]) === parseInt(lastMatch.result.split(':')[1]));
        const resultColor = isWin ? 'text-green-400' : (isDraw ? 'text-gray-400' : 'text-red-400');

        recentResultMarkup = `
            <div class="bg-gray-800 rounded-3xl p-6 border border-gray-700">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-lg font-bold text-white">최근 경기 결과</h2>
                    <span class="text-xs text-gray-400 flex items-center">
                        <span class="w-2 h-2 rounded-full ${isWin ? 'bg-green-500' : (isDraw ? 'bg-gray-500' : 'bg-red-500')} mr-2"></span>
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
}

function renderMatches(container, currentSeason) {
    const schedule = getSchedule(currentSeason);

    // State
    let currentFilter = 'all'; // 'all', 'league', 'cup'
    let currentPage = 1;
    const itemsPerPage = 5;

    // Dynamic Filter UI
    // Extract unique types from schedule (e.g., '리그', '컵', '플레이오프')
    const uniqueTypes = [...new Set(schedule.map(m => m.type).filter(type => type && type.trim() !== ''))];
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
            return m.type === currentFilter;
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
                if (match.result.includes('승')) statusColor = 'border-neonGreen';
                else if (match.result.includes('패')) statusColor = 'border-red-500';
                resultText = `<span class="font-bold ml-auto ${match.result.includes('승') ? 'text-neonGreen' : 'text-red-500'}">${match.result}</span>`;
            } else {
                resultText = `<span class="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded ml-auto">예정</span>`;
            }

            const el = document.createElement('div');
            el.className = `flex items-center bg-gray-800 p-4 rounded-xl border-l-4 ${statusColor} shadow-sm animate-fade-in`;
            el.innerHTML = `
                <div class="flex flex-col mr-4 w-16">
                    <span class="text-xs text-gray-500 font-mono">${match.round}</span>
                    <span class="text-xs text-gray-400 font-mono text-center mt-1 bg-gray-900 rounded px-1">${match.date ? match.date.substring(5) : '-'}</span>
                </div>
                <div class="flex-1">
                    <div class="text-sm text-gray-300">vs <span class="text-white font-bold">${match.opponent}</span></div>
                    <div class="text-xs text-gray-500 mt-0.5">
                        ${match.time ? `<span>🕒 ${match.time}</span>` : ''}
                        ${match.stadium ? `<span class="ml-2"><button onclick="window.showMapModal('${match.stadium}')" class="hover:text-neonGreen underline decoration-gray-600 transition-colors text-left">🏟️ ${match.stadium}</button></span>` : ''}
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

function renderStats(container, currentSeason) {
    const stats = getStats(currentSeason);

    // Top Charts Grid
    const chartsContainer = document.createElement('div');
    chartsContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4';

    // 1. Goals Chart
    const goalsChartContainer = document.createElement('div');
    goalsChartContainer.className = 'bg-gray-800 p-4 rounded-2xl border border-gray-700';

    const validScorers = stats.topScorers.filter(p => p.goals > 0).slice(0, 5);
    if (validScorers.length > 0) {
        goalsChartContainer.innerHTML = `<h3 class="text-sm text-gray-400 mb-4">득점 랭킹</h3><canvas id="goalsChart"></canvas>`;
    } else {
        goalsChartContainer.innerHTML = `<h3 class="text-sm text-gray-400 mb-4">득점 랭킹</h3><div class="text-center text-gray-500 text-xs py-10">기록 없음</div>`;
    }
    chartsContainer.appendChild(goalsChartContainer);

    // 2. Assists Chart
    const assistsChartContainer = document.createElement('div');
    assistsChartContainer.className = 'bg-gray-800 p-4 rounded-2xl border border-gray-700';

    const validAssisters = stats.topAssists.filter(p => p.assists > 0).slice(0, 5);
    if (validAssisters.length > 0) {
        assistsChartContainer.innerHTML = `<h3 class="text-sm text-gray-400 mb-4">도움 랭킹</h3><canvas id="assistsChart"></canvas>`;
    } else {
        assistsChartContainer.innerHTML = `<h3 class="text-sm text-gray-400 mb-4">도움 랭킹</h3><div class="text-center text-gray-500 text-xs py-10">기록 없음</div>`;
    }
    chartsContainer.appendChild(assistsChartContainer);

    // 3. Clean Sheets List
    const cleanSheetContainer = document.createElement('div');
    cleanSheetContainer.className = 'bg-gray-800 p-4 rounded-2xl border border-gray-700';
    cleanSheetContainer.innerHTML = `
    <h3 class="text-sm text-gray-400 mb-3 leading-snug">클린시트<br><span class="text-xs text-gray-500 font-normal">(GK/DF)</span></h3>
        <div class="space-y-2">
            ${stats.topCleanSheets.filter(p => p.cleanSheets > 0).slice(0, 5).map((p, i) => `
                <div class="flex items-center justify-between border-b border-gray-700 pb-2 last:border-0 last:pb-0">
                    <div class="flex items-center space-x-2 overflow-hidden">
                        <span class="text-xs font-mono text-gray-500 w-3 flex-shrink-0">${i + 1}</span>
                        <span class="text-sm text-white font-bold truncate">${p.name}</span>
                        <span class="text-[10px] text-gray-500 flex-shrink-0">(${p.position})</span>
                    </div>
                    <span class="text-sm text-neonGreen font-mono font-bold flex-shrink-0">${p.cleanSheets}</span>
                </div>
            `).join('') || '<div class="text-center text-gray-500 text-xs py-4">기록 없음</div>'}
        </div>
`;
    chartsContainer.appendChild(cleanSheetContainer);

    // 4. Yellow Cards List
    const yellowCardContainer = document.createElement('div');
    yellowCardContainer.className = 'bg-gray-800 p-4 rounded-2xl border border-gray-700';
    yellowCardContainer.innerHTML = `
    <h3 class="text-sm text-gray-400 mb-3">경고</h3>
        <div class="space-y-2">
            ${stats.topYellowCards.filter(p => p.yellowCards > 0).slice(0, 5).map((p, i) => `
                <div class="flex items-center justify-between border-b border-gray-700 pb-2 last:border-0 last:pb-0">
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

    // 5. Red Cards List
    const redCardContainer = document.createElement('div');
    redCardContainer.className = 'bg-gray-800 p-4 rounded-2xl border border-gray-700';
    redCardContainer.innerHTML = `
    <h3 class="text-sm text-gray-400 mb-3">퇴장</h3>
        <div class="space-y-2">
            ${stats.topRedCards.filter(p => p.redCards > 0).slice(0, 5).map((p, i) => `
                <div class="flex items-center justify-between border-b border-gray-700 pb-2 last:border-0 last:pb-0">
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


    // Player Table with Sticky Header & Pagination
    const tableContainer = document.createElement('div');
    tableContainer.className = 'bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden flex flex-col';

    // Pagination State
    let currentPage = 1;
    const rowsPerPage = 10;
    const totalPages = Math.ceil(stats.players.length / rowsPerPage);

    function renderTablePage(page) {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const pageData = stats.players.slice(start, end);

        const rowsHtml = pageData.map(p => `
    <tr class="border-b border-gray-700 last:border-0 hover:bg-gray-750">
                <td class="p-3 text-sm text-gray-300 w-16">${p.position}</td>
                <td class="p-3 text-sm font-bold text-white">${p.name}</td>
                <td class="p-3 text-center text-xs text-gray-400 font-mono w-24">
                    <span class="text-neonGreen">${p.starts}</span> / <span class="text-white">${p.substitutes}</span>
                </td>
                <td class="p-3 text-sm text-center text-neonGreen font-mono w-12">${p.goals}</td>
                <td class="p-3 text-sm text-center text-gray-400 font-mono w-12">${p.assists}</td>
            </tr>
    `).join('');

        const tableBody = tableContainer.querySelector('tbody');
        if (tableBody) tableBody.innerHTML = rowsHtml;

        // Update Pagination Controls
        const paginationEl = tableContainer.querySelector('.pagination-controls');
        if (paginationEl) {
            paginationEl.innerHTML = `
    <button ${page === 1 ? 'disabled' : ''} class="prev-btn px-3 py-1 bg-gray-700 rounded text-xs ${page === 1 ? 'opacity-50' : 'hover:bg-gray-600'}">이전</button>
                <span class="text-xs text-gray-400">${page} / ${totalPages}</span>
                <button ${page === totalPages ? 'disabled' : ''} class="next-btn px-3 py-1 bg-gray-700 rounded text-xs ${page === totalPages ? 'opacity-50' : 'hover:bg-gray-600'}">다음</button>
`;

            // Re-attach listeners
            paginationEl.querySelector('.prev-btn').onclick = () => {
                if (currentPage > 1) { currentPage--; renderTablePage(currentPage); }
            };
            paginationEl.querySelector('.next-btn').onclick = () => {
                if (currentPage < totalPages) { currentPage++; renderTablePage(currentPage); }
            };
        }
    }

    tableContainer.innerHTML = `
    <div class="overflow-x-auto max-h-[400px] overflow-y-auto relative">
        <table class="w-full">
            <thead class="bg-gray-900 border-b border-gray-700 sticky top-0 z-10">
                <tr>
                    <th class="p-3 text-left text-xs text-gray-500 font-medium">POS</th>
                    <th class="p-3 text-left text-xs text-gray-500 font-medium">Player</th>
                    <th class="p-3 text-center text-xs text-gray-500 font-medium">Apps (Start/Sub)</th>
                    <th class="p-3 text-center text-xs text-gray-500 font-medium">G</th>
                    <th class="p-3 text-center text-xs text-gray-500 font-medium">A</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
        </div>
    <div class="pagination-controls p-3 border-t border-gray-700 flex justify-between items-center bg-gray-800"></div>
`;

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
                    scales: {
                        y: { beginAtZero: true, grid: { color: '#374151' }, ticks: { color: '#9CA3AF' } },
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
                    scales: {
                        y: { beginAtZero: true, grid: { color: '#374151' }, ticks: { color: '#9CA3AF' } },
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
