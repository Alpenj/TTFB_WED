
// CSV URLs provided by the user
const PLAYERS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGGWFn467-3HymL_GgM6kifS1veoPDSgCG47Za6sO94ZJr8n9PzmL-h_aVCo7e59gbPhVbkfHJtEA9/pub?gid=0&single=true&output=csv';
const SCHEDULE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGGWFn467-3HymL_GgM6kifS1veoPDSgCG47Za6sO94ZJr8n9PzmL-h_aVCo7e59gbPhVbkfHJtEA9/pub?gid=2105782746&single=true&output=csv';
const RECORDS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGGWFn467-3HymL_GgM6kifS1veoPDSgCG47Za6sO94ZJr8n9PzmL-h_aVCo7e59gbPhVbkfHJtEA9/pub?gid=426357573&single=true&output=csv';
const STADIUM_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGGWFn467-3HymL_GgM6kifS1veoPDSgCG47Za6sO94ZJr8n9PzmL-h_aVCo7e59gbPhVbkfHJtEA9/pub?gid=1733505023&single=true&output=csv';

let playersData = [];
let scheduleData = [];
let recordsData = [];
let stadiumData = [];

export async function fetchData() {
    try {
        const timestamp = new Date().getTime();
        const responses = await Promise.all([
            fetch(`${PLAYERS_CSV_URL}&t=${timestamp}`),
            fetch(`${SCHEDULE_CSV_URL}&t=${timestamp}`),
            fetch(`${RECORDS_CSV_URL}&t=${timestamp}`),
            fetch(`${STADIUM_CSV_URL}&t=${timestamp}`)
        ]);

        // Check for HTTP errors
        responses.forEach(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        });

        const [playersText, scheduleText, recordsText, stadiumText] = await Promise.all(responses.map(r => r.text()));

        playersData = parsePlayersCSV(playersText);
        scheduleData = parseScheduleCSV(scheduleText);
        recordsData = parseRecordsCSV(recordsText);
        stadiumData = parseStadiumCSV(stadiumText);

        console.log("Data loaded successfully:", { players: playersData.length, schedule: scheduleData.length, records: recordsData.length, stadiums: stadiumData.length });
    } catch (e) {
        console.error("Error fetching data:", e);
        throw e;
    }
}

function parseCSV(text) {
    if (!text) return [];
    return text.trim().split('\n').map(line => line.split(','));
}

// Header: 2024시즌, 2025시즌, ..., 포지션, 이름
// We need to dynamically identify season columns.
// Header: 2024시즌, 2025시즌, ..., 포지션, 이름
// We need to dynamically identify season columns.
export function getPlayerEvents(currentSeason, currentMatchType, playerName, eventType) {
    const filter = String(currentSeason);
    const typeFilter = currentMatchType === 'all' ? null : currentMatchType;

    // Create a map for quick schedule lookup
    const scheduleMap = new Map();
    scheduleData.forEach(m => {
        scheduleMap.set(`${m.season}-${m.matchId}`, m);
    });

    const events = [];

    recordsData.forEach(r => {
        // 1. Filter by Player
        if (r.name !== playerName) return;

        // 2. Filter by Season
        if (filter !== 'all' && String(r.season) !== filter) return;

        // 3. Lookup Match Info
        const matchKey = `${r.season}-${r.matchId}`;
        const match = scheduleMap.get(matchKey);
        if (!match) return; // Should not happen ideally

        // 4. Filter by Match Type
        if (typeFilter && match.matchType !== typeFilter) return;

        // 5. Check Event Type
        let count = 0;
        if (eventType === 'goals') count = r.goals > 0 ? r.goals : 0;
        else if (eventType === 'assists') count = r.assists;
        else if (eventType === 'yellowCards') count = r.yellowCards;
        else if (eventType === 'redCards') count = r.redCards;
        else if (eventType === 'ownGoals') count = r.goals < 0 ? Math.abs(r.goals) : 0;
        else if (eventType === 'appearances') count = 1; // Used for "Apps" list

        if (count > 0) {
            events.push({
                season: r.season,
                matchId: r.matchId,
                round: match.round,
                date: match.date,
                opponent: match.opponent,
                count: count,
                type: eventType,
                submissionType: r.appearanceType // For appearances (Start/Sub)
            });
        }
    });

    // Sort by date desc
    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    return events;
}

export function getOpponentStats(currentSeason, currentMatchType) {
    const filter = String(currentSeason);
    const typeFilter = currentMatchType === 'all' ? null : currentMatchType;

    const stats = {};

    scheduleData.forEach(match => {
        // 1. Filter by Season
        if (filter !== 'all' && String(match.season) !== filter) return;

        // 2. Filter by Match Type
        if (typeFilter && match.matchType !== typeFilter) return;

        // 3. Exclude Practice Matches from Opponent Stats (Global Rule per user request)
        if (match.matchType === '연습경기') return;

        const opponent = match.opponent ? match.opponent.trim() : '';
        if (!opponent) return; // Skip if no opponent name
        if (!stats[opponent]) {
            stats[opponent] = { name: opponent, wins: 0, draws: 0, losses: 0, total: 0, gf: 0, ga: 0 };
        }

        const s = stats[opponent];
        s.total++;

        // Calculate Result
        // Logic: Check records for this match. 
        // We need to calculate team score for this match.
        // But scheduleData usually has "result" column? Let's check parseScheduleCSV.
        // It has 'result' column (index 7).

        const result = match.result ? match.result.trim() : '';

        // Robust Check: 1. Text Search 2. Score Parse
        const res = result.toUpperCase();

        let isWin = ['승', 'WIN', 'W', 'O'].some(k => res.includes(k));
        let isDraw = ['무', 'DRAW', 'D', '△', '-'].some(k => res.includes(k));
        let isLoss = ['패', 'LOSS', 'L', 'LOSE', 'X'].some(k => res.includes(k));

        // If no explicit text, try to find a score pattern "N:M"
        if (!isWin && !isDraw && !isLoss) {
            const scoreMatch = result.match(/(\d+)\s*[:]\s*(\d+)/);
            if (scoreMatch) {
                const ourScore = parseInt(scoreMatch[1]);
                const oppScore = parseInt(scoreMatch[2]);
                if (ourScore > oppScore) isWin = true;
                else if (ourScore === oppScore) isDraw = true;
                else isLoss = true;
            }
        }

        if (isWin) s.wins++;
        else if (isDraw) s.draws++;
        else if (isLoss) s.losses++;

        // Goals For / Against calculation could be complex without explicit score in schedule.
        // We can aggregate from records if needed, but for now W/D/L is primary request.
    });

    return Object.values(stats).sort((a, b) => b.wins - a.wins || b.total - a.total);
}

export function getPlayerMatchHistory(playerName, seasonFilter) {
    const filter = seasonFilter && seasonFilter !== 'all' ? String(seasonFilter) : null;

    // Filter records by name AND season (if provided)
    const records = recordsData.filter(r => {
        if (r.name !== playerName) return false;
        if (filter && String(r.season) !== filter) return false;
        return true;
    });

    // Create map for fast lookup
    const scheduleMap = new Map();
    scheduleData.forEach(m => scheduleMap.set(`${m.season}-${m.matchId}`, m));

    const history = records.map(r => {
        const match = scheduleMap.get(`${r.season}-${r.matchId}`);
        if (!match) return null;

        return {
            season: r.season,
            round: match.round,
            date: match.date,
            opponent: match.opponent,
            matchType: match.matchType,
            appearance: r.appearanceType,
            goals: r.goals,
            assists: r.assists,
            yellowCards: r.yellowCards,
            redCards: r.redCards,
            attackPoints: r.goals + r.assists
        };
    }).filter(h => h !== null);

    history.sort((a, b) => new Date(b.date) - new Date(a.date));
    return history;
}


function parsePlayersCSV(csvText) {
    const rows = parseCSV(csvText);
    if (rows.length < 2) return [];

    const headers = rows[0].map(h => h.trim());
    const positionIdx = headers.indexOf('포지션');
    const nameIdx = headers.indexOf('이름');

    // Identify season columns
    // Strategy: Look for columns that end with '시즌' OR differ from '포지션'/'이름' and look like a year
    const seasonColumns = headers.map((h, i) => {
        // 1. Explicit '시즌' suffix
        if (h.endsWith('시즌')) {
            return { index: i, year: h.replace('시즌', '').trim() };
        }
        // 2. Just a year (e.g. '2024') - Simple regex check for 4 digits
        if (/^\d{4}$/.test(h)) {
            return { index: i, year: h };
        }
        return null;
    }).filter(c => c !== null);

    return rows.slice(1).map(row => {
        if (row.length <= Math.max(positionIdx, nameIdx)) return null;

        const name = row[nameIdx]?.trim();
        const position = row[positionIdx]?.trim();

        if (!name) return null;

        // Determine active seasons for this player
        const activeSeasons = seasonColumns.filter(col => {
            const val = row[col.index];
            // Check if cell has a valid participation marker
            const cleanVal = val ? val.trim().toUpperCase() : '';
            return ['O', '1', 'TRUE', 'Y', 'YES'].includes(cleanVal);
        }).map(col => col.year);

        return {
            name,
            position,
            seasons: activeSeasons
        };
    }).filter(p => p && p.name);
}

function parseScheduleCSV(csvText) {
    const rows = parseCSV(csvText);
    // Header: 시즌(0), ID(1), 구분(2), 날짜(3), 시간(4), 구장(5), 상대(6), 결과(7)
    return rows.slice(1).map(row => {
        if (row.length < 3) return null;
        return {
            season: row[0].trim().replace('시즌', ''),
            matchId: row[1].trim(),
            matchType: row[2].trim(), // Explicitly capture Type
            round: row[2].trim(), // Keep round as is for backward compat in UI for now, or change to row[1] if desired? The user asked for "League/Cup" split. existing UI uses round. Row[2] is 'League'. Row[1] is '1R'.
            // Actually, let's fix the confusion. If existing UI displays 'League' for round, that's fine.
            date: row[3].trim(),
            time: row[4].trim(),
            stadium: row[5].trim(),
            opponent: row[6].trim(),
            // Combine col 7 and 8 to catch result if there's a score column inserted
            result: (row[7] || '') + ' ' + (row[8] || '')
        };
    }).filter(m => m && m.matchId); // Filter by matchId as it is critical
}

function parseRecordsCSV(csvText) {
    const rows = parseCSV(csvText);
    // Header: 시즌(0), ID(1), 매치타입(2), 선수명(3), 출전/선발(4), 득점(5), 도움(6), 경고(7), 퇴장(8)
    return rows.slice(1).map(row => {
        if (row.length < 4) return null;
        return {
            season: row[0].trim().replace('시즌', ''),
            matchId: row[1].trim(), // e.g. '1R'
            matchType: row[2].trim(), // e.g. '리그', '컵'
            name: row[3].trim(),
            appearanceType: row[4] ? row[4].trim() : '', // '선발', '교체', 'Start', 'Sub'
            goals: parseInt(row[5] ? row[5].trim() : 0) || 0,
            assists: parseInt(row[6] ? row[6].trim() : 0) || 0,
            yellowCards: parseInt(row[7] ? row[7].trim() : 0) || 0,
            redCards: parseInt(row[8] ? row[8].trim() : 0) || 0
        };
    }).filter(r => r && r.matchId && r.name);
}

function parseStadiumCSV(csvText) {
    const rows = parseCSV(csvText);
    // Header: ID,이름
    return rows.slice(1).map(row => {
        if (row.length < 2) return null;
        return {
            id: row[0].trim(),
            name: row[1].trim()
        };
    }).filter(s => s && s.id);
}

export function getAvailableSeasons() {
    // Extract unique seasons from records, schedule AND players registry
    const seasons = new Set();
    scheduleData.forEach(m => {
        if (m.season) seasons.add(m.season);
    });
    recordsData.forEach(r => {
        if (r.season) seasons.add(r.season);
    });
    // Add seasons found in player registry (e.g. a future season with only roster but no matches)
    playersData.forEach(p => {
        if (p.seasons) {
            p.seasons.forEach(s => seasons.add(s));
        }
    });

    return Array.from(seasons).sort().reverse();
}

export function getAvailableMatchTypes() {
    const types = new Set();
    scheduleData.forEach(m => {
        if (m.matchType) types.add(m.matchType);
    });
    // Sort? League first, then Cup, then others?
    return Array.from(types).sort();
}

export function getStadium(shortName) {
    if (!shortName) return '';
    const found = stadiumData.find(s => s.id === shortName);
    return found ? found.name : shortName;
}

export function getSchedule(seasonFilter) {
    if (!seasonFilter || seasonFilter === 'all') {
        return scheduleData;
    }
    return scheduleData.filter(m => m.season === seasonFilter);
}

export function getStats(seasonFilter, matchTypeFilter) {
    // Initialize Player Stats Map


    const filter = String(seasonFilter);
    const typeFilter = matchTypeFilter === 'all' ? null : matchTypeFilter;

    // 1. Build Match Type Map for filtering records
    // key: {season}-{matchId} -> val: matchType
    const matchTypeMap = new Map();
    scheduleData.forEach(m => {
        // Normalize keys
        const key = `${m.season}-${m.matchId}`;
        matchTypeMap.set(key, m.matchType);
    });

    const targetSchedule = scheduleData.filter(m => {
        const seasonMatch = (!seasonFilter || seasonFilter === 'all') ? true : String(m.season) === filter;
        const typeMatch = (!typeFilter) ? true : m.matchType === typeFilter;
        return seasonMatch && typeMatch;
    });

    const targetRecords = recordsData.filter(r => {
        const seasonMatch = (!seasonFilter || seasonFilter === 'all') ? true : String(r.season) === filter;

        // Check Type
        const key = `${r.season}-${r.matchId}`;
        const mType = matchTypeMap.get(key);
        // If match not found in schedule, include it? Or exclude? Safe to include or exclude. 
        // If filtering by type, and type is unknown, exclude.
        const typeMatch = (!typeFilter) ? true : mType === typeFilter;

        return seasonMatch && typeMatch;
    });

    const statsMap = {};

    // 1. Initialize with players valid for the filters
    playersData.forEach(player => {
        // If seasonFilter is specific (e.g. '2024'), check if player has that season in their list
        // If 'all', include everyone (or maybe everyone who has at least one season?)
        // Let's include everyone for 'all'.
        // Strict Type Check: Ensure both are strings for comparison
        const pSeasons = player.seasons.map(s => String(s));
        const filter = String(seasonFilter);

        const shouldInclude = filter === 'all' || pSeasons.includes(filter);

        if (shouldInclude) {
            statsMap[player.name] = {
                name: player.name,
                position: player.position,
                appearances: 0,
                starts: 0,
                substitutes: 0,
                goals: 0,
                assists: 0,
                ownGoals: 0,
                attackPoints: 0,
                yellowCards: 0,
                redCards: 0,
                cleanSheets: 0
            };
        }
    });

    // 2. Update with records
    targetRecords.forEach(record => {
        if (!statsMap[record.name]) {
            // Handle case where player is in records but not in player list (e.g. guest, new player)
            // Or if strict roster check filtered them out but they have a record (shouldn't happen ideally)
            statsMap[record.name] = {
                name: record.name,
                position: record.position,
                appearances: 0,
                starts: 0,
                substitutes: 0,
                goals: 0,
                assists: 0,
                ownGoals: 0,
                attackPoints: 0,
                yellowCards: 0,
                redCards: 0,
                cleanSheets: 0
            };
        }

        const player = statsMap[record.name];
        player.appearances += 1;

        // Count Starts vs Subs
        const type = record.appearanceType;
        if (['선발', 'Start', 'start'].includes(type) || !type) {
            // Default to start if empty? Or strict?
            // "Play Time" column repurposed. If empty, assume played? 
            // Let's assume '선발' if specific text matches, otherwise just appearance?
            // User requested: "check for starter vs sub replacement".
            // Let's count them if explicitly marked.
        }

        if (['선발', 'Start', 'start', 'O', 'o'].includes(type)) {
            player.starts++;
        } else if (['교체', 'Sub', 'sub'].includes(type)) {
            player.substitutes++;
        }

        if (record.goals < 0) {
            player.ownGoals += Math.abs(record.goals);
        } else {
            player.goals += record.goals;
        }
        player.assists += record.assists;
        player.attackPoints = player.goals + player.assists;
        player.yellowCards += record.yellowCards;
        player.redCards += record.redCards;
    });

    // Calculate Clean Sheets
    // Conditions: 
    // 1. Match Result Against is 0
    // 2. Player is GK or DF
    // 3. Player played in that match (exists in records for that matchId)

    const cleanSheetMatches = new Set();
    targetSchedule.forEach(match => {
        if (!match.result) return;
        // Assume result format "F:A" (e.g., "3:0") or just text.
        // If it contains ':', split.
        if (match.result.includes(':')) {
            const parts = match.result.split(':');
            const against = parseInt(parts[1]);
            if (!isNaN(against) && against === 0) {
                // We need to store Round+Season combination to be unique if seasonFilter is 'all'
                // But simplified: since we iterate filtered records, we just need matchId uniqueness within context?
                // Wait, if seasonFilter is 'all', '1R' exists in 2024 and 2025. 
                // We need a unique key. 
                const uniqueId = `${match.season}-${match.round}`;
                cleanSheetMatches.add(uniqueId);
            }
        }
        // If result is just text like "승", "무", we can't determine score, so ignore.
    });

    targetRecords.forEach(record => {
        const uniqueId = `${record.season}-${record.matchId}`;
        if (cleanSheetMatches.has(uniqueId)) {
            const player = statsMap[record.name];
            if (player) {
                const pos = player.position ? player.position.toUpperCase() : '';
                if (pos === 'GK' || pos === 'DF') {
                    player.cleanSheets += 1;
                }
            }
        }
    });

    // Calculate Efficiency
    const playersArray = Object.values(statsMap);

    // Sort: AttackPoints (Desc) > Goals (Desc) > Assists (Desc) > Appearances (Desc) > Name (Asc)
    playersArray.sort((a, b) => {
        if (b.attackPoints !== a.attackPoints) return b.attackPoints - a.attackPoints;
        if (b.goals !== a.goals) return b.goals - a.goals;
        if (b.assists !== a.assists) return b.assists - a.assists;
        if (b.appearances !== a.appearances) return b.appearances - a.appearances;
        return a.name.localeCompare(b.name, 'ko');
    });

    const efficiency = playersArray
        .filter(p => p.appearances > 0)
        .map(p => ({
            ...p,
            goalsPerGame: (p.goals / p.appearances).toFixed(2),
            assistsPerGame: (p.assists / p.appearances).toFixed(2),
            pointsPerGame: ((p.goals + p.assists) / p.appearances).toFixed(2)
        }));

    return {
        players: playersArray,
        topScorers: [...playersArray].sort((a, b) => b.goals - a.goals || b.appearances - a.appearances).slice(0, 5),
        topAssists: [...playersArray].sort((a, b) => b.assists - a.assists || b.appearances - a.appearances).slice(0, 5),
        topEfficiency: efficiency.sort((a, b) => b.pointsPerGame - a.pointsPerGame).slice(0, 5),
        topAppearances: [...playersArray]
            .sort((a, b) => b.appearances - a.appearances || b.starts - a.starts)
            .slice(0, 5),
        topCleanSheets: [...playersArray]
            .filter(p => p.position === 'GK' || p.position === 'DF')
            .sort((a, b) => b.cleanSheets - a.cleanSheets || b.appearances - a.appearances)
            .slice(0, 5),
        topOwnGoals: [...playersArray]
            .filter(p => p.ownGoals > 0)
            .sort((a, b) => b.ownGoals - a.ownGoals)
            .slice(0, 5),
        topYellowCards: [...playersArray].sort((a, b) => b.yellowCards - a.yellowCards).slice(0, 5),
        topRedCards: [...playersArray].sort((a, b) => b.redCards - a.redCards).slice(0, 5),
        topAttackPoints: [...playersArray].sort((a, b) => b.attackPoints - a.attackPoints || b.appearances - a.appearances).slice(0, 5)
    };
}

export function getTeamStats(seasonFilter, matchTypeFilter) {
    let wins = 0;
    let draws = 0;
    let losses = 0;

    const targetSchedule = scheduleData.filter(m => {
        const seasonMatch = (!seasonFilter || seasonFilter === 'all') ? true : m.season === seasonFilter;
        const typeMatch = (!matchTypeFilter || matchTypeFilter === 'all') ? true : m.matchType === matchTypeFilter;
        return seasonMatch && typeMatch;
    });

    targetSchedule.forEach(match => {
        if (!match.result) return;
        const res = match.result;

        if (res.includes('승')) wins++;
        else if (res.includes('무')) draws++;
        else if (res.includes('패')) losses++;
        else if (res.includes(':')) {
            const [home, away] = res.split(':').map(Number);
            if (!isNaN(home) && !isNaN(away)) {
                if (home > away) wins++;
                else if (home < away) losses++;
                else draws++;
            }
        }
    });

    const total = wins + draws + losses;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

    return { wins, draws, losses, winRate };
}

export function getMatchRecords(season, matchId) {
    return recordsData.filter(r => r.season === season && r.matchId === matchId);
}
