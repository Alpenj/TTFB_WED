
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
        else if (eventType === 'cleanSheets') {
            // Check if match result exists and indicates 0 goals conceded
            if (match.result && match.result.includes(':')) {
                const parts = match.result.split(':');
                const against = parseInt(parts[1]);
                if (!isNaN(against) && against === 0) {
                    count = 1;
                }
            }
        }

        if (count > 0) {
            events.push({
                season: r.season,
                matchId: r.matchId,
                round: match.round,
                date: match.date,
                opponent: match.opponent,
                count: count,
                type: eventType,
                submissionType: r.appearance, // For appearances (Start/Sub)
                goals: r.goals,
                assists: r.assists,
                note: r.note
            });
        }
    });

    // Sort by date ASC (Past to Recent) per user request
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    return events;
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
            appearance: r.appearance,
            goals: r.goals,
            assists: r.assists,
            yellowCards: r.yellowCards,
            redCards: r.redCards,
            attackPoints: r.goals + r.assists,
            note: r.note,
            matchId: r.matchId
        };
    }).filter(h => h !== null);

    history.sort((a, b) => new Date(a.date) - new Date(b.date)); // ASC
    return history;
}


function parsePlayersCSV(csvText) {
    const rows = parseCSV(csvText);
    if (rows.length < 2) return [];

    const headers = rows[0].map(h => h.trim());
    const positionIdx = headers.indexOf('포지션');
    const nameIdx = headers.indexOf('이름');

    // Identify season columns
    const seasonColumns = headers.map((h, i) => {
        if (h.endsWith('시즌')) {
            return { index: i, year: h.replace('시즌', '').trim() };
        }
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

        const activeSeasons = seasonColumns.filter(col => {
            const val = row[col.index];
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
    return rows.slice(1).map(row => {
        if (row.length < 2) return null; // Increased safety check, though we handle undefineds below

        // Helper for safe access
        const get = (idx) => (row[idx] || '').trim();

        return {
            season: get(0).replace('시즌', ''),
            matchId: get(1),
            matchType: get(2),
            round: get(2),
            date: get(3),
            time: get(4),
            stadium: get(5),
            opponent: get(6),
            result: get(7),
            videoUrl: get(8)
        };
    }).filter(m => m && m.matchId);
}

function parseRecordsCSV(csvText) {
    const rows = parseCSV(csvText);
    return rows.slice(1).map(row => {
        if (row.length < 4) return null;
        return {
            season: row[0].trim().replace('시즌', ''),
            matchId: row[1].trim(),
            position: row[2].trim(),
            name: row[3].trim(),
            appearance: row[4] ? row[4].trim() : '',
            goals: parseInt(row[5] ? row[5].trim() : 0) || 0,
            assists: parseInt(row[6] ? row[6].trim() : 0) || 0,
            note: row[7] ? row[7].trim() : '',
            yellowCards: parseInt(row[8] ? row[8].trim() : 0) || 0,
            redCards: parseInt(row[9] ? row[9].trim() : 0) || 0
        };
    }).filter(r => r && r.matchId && r.name);
}

function parseStadiumCSV(csvText) {
    const rows = parseCSV(csvText);
    return rows.slice(1).map(row => {
        if (row.length < 2) return null;
        return {
            id: row[0].trim(),
            name: row[1].trim()
        };
    }).filter(s => s && s.id);
}

// Helper: Parse 'YYYY.MM.DD' to Date
function parseDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.trim().split('.');
    if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return null;
}


export function getAvailableSeasons() {
    const seasons = new Set();
    scheduleData.forEach(m => {
        if (m.season) seasons.add(m.season);
    });
    recordsData.forEach(r => {
        if (r.season) seasons.add(r.season);
    });
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
    const filter = String(seasonFilter);
    const typeFilter = matchTypeFilter === 'all' ? null : matchTypeFilter;
    const now = new Date(); // Current time for comparison

    const targetSchedule = scheduleData.filter(m => {
        const seasonMatch = (!seasonFilter || seasonFilter === 'all') ? true : String(m.season) === filter;
        const typeMatch = (!typeFilter) ? true : m.matchType === typeFilter;

        // Exclude Practice Matches from ALL view
        if (!typeFilter && m.matchType === '연습경기') return false;

        // Valid Result Check
        if (!m.result || !m.result.trim()) return false;

        // Robust Date Check
        const matchDate = parseDate(m.date);
        if (!matchDate) return false; // Skip if date is invalid

        // Future Match Check (Standardize on start of day to avoid time issues)
        const matchEndOfDay = new Date(matchDate);
        matchEndOfDay.setHours(23, 59, 59, 999);
        if (parseDate(m.date) > now) return false;
        // Note: Using strict > now might exclude today's completed matches if time is not handled.
        // But since CSV dates are YYYY.MM.DD without time (usually), new Date(y,m,d) is 00:00.
        // If now is 20:00, 00:00 < 20:00. Past. Correct.
        // If match is Tmrw, 00:00 (Tmrw) > 20:00 (Today). Future. Correct.

        return seasonMatch && typeMatch;
    });

    const validMatchKeys = new Set(targetSchedule.map(m => `${m.season}-${m.matchId}`));

    const targetRecords = recordsData.filter(r => {
        const key = `${r.season}-${r.matchId}`;
        return validMatchKeys.has(key);
    });

    const statsMap = {};

    playersData.forEach(player => {
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

    targetRecords.forEach(record => {
        if (!statsMap[record.name]) {
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

        const type = record.appearance;
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

    const cleanSheetMatches = new Set();
    targetSchedule.forEach(match => {
        if (!match.result) return;
        if (match.result.includes(':')) {
            const parts = match.result.split(':');
            const against = parseInt(parts[1]);
            if (!isNaN(against) && against === 0) {
                const uniqueId = `${match.season}-${match.matchId}`; // Corrected from .round to .matchId
                cleanSheetMatches.add(uniqueId);
            }
        }
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

    const playersArray = Object.values(statsMap);

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
    const now = new Date();

    const targetSchedule = scheduleData.filter(m => {
        const seasonMatch = (!seasonFilter || seasonFilter === 'all') ? true : m.season === seasonFilter;
        const typeMatch = (!matchTypeFilter || matchTypeFilter === 'all') ? true : m.matchType === matchTypeFilter;
        if ((!matchTypeFilter || matchTypeFilter === 'all') && m.matchType === '연습경기') return false;
        return seasonMatch && typeMatch;
    });

    targetSchedule.forEach(match => {
        if (!match.result) return;
        const res = match.result.trim();
        if (!res) return;

        // Date Check
        const matchDate = parseDate(match.date);
        if (!matchDate || matchDate > now) return;

        let isWin = ['승', 'WIN', 'W', 'O'].some(k => res.includes(k));
        let isDraw = ['무', 'DRAW', 'D', '△', '-'].some(k => res.includes(k));
        let isLoss = ['패', 'LOSS', 'L', 'LOSE', 'X'].some(k => res.includes(k));

        if (!isWin && !isDraw && !isLoss) {
            const scoreMatch = res.match(/(\d+)\s*[:]\s*(\d+)(?:\s*\(PK\s*(\d+)\s*[:]\s*(\d+)\))?/i);
            const pkSuffixMatch = res.match(/(\d+)\s*[:]\s*(\d+)\s*\(\s*(\d+)\s*[:]\s*(\d+)\s*PK\s*\)/i);

            if (scoreMatch || pkSuffixMatch) {
                const matchData = scoreMatch || pkSuffixMatch;
                const mainScore = {
                    our: parseInt(matchData[1]),
                    opp: parseInt(matchData[2]),
                    pk: matchData[3] && matchData[4] ? { our: parseInt(matchData[3]), opp: parseInt(matchData[4]) } : null
                };

                const mainWin = mainScore.our > mainScore.opp;
                const mainDraw = mainScore.our === mainScore.opp;
                const mainLoss = mainScore.our < mainScore.opp;

                if (mainDraw && mainScore.pk) {
                    if (mainScore.pk.our > mainScore.pk.opp) isWin = true;
                    else if (mainScore.pk.our < mainScore.pk.opp) isLoss = true;
                    else isDraw = true;
                } else {
                    isWin = mainWin;
                    isDraw = mainDraw;
                    isLoss = mainLoss;
                }
            }
        }

        if (isWin) wins++;
        else if (isDraw) draws++;
        else if (isLoss) losses++;
    });

    const total = wins + draws + losses;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

    return { wins, draws, losses, winRate };
}

export function getStadiumStats(seasonFilter, matchTypeFilter) {
    const stats = {};
    const now = new Date();

    const targetSchedule = scheduleData.filter(m => {
        const seasonMatch = (!seasonFilter || seasonFilter === 'all') ? true : m.season === seasonFilter;
        const typeMatch = (!matchTypeFilter || matchTypeFilter === 'all') ? true : m.matchType === matchTypeFilter;
        if ((!matchTypeFilter || matchTypeFilter === 'all') && m.matchType === '연습경기') return false;
        return seasonMatch && typeMatch;
    });

    targetSchedule.forEach(match => {
        if (!match.result) return;
        const res = match.result.trim();
        if (!res) return;

        // Date Check
        const matchDate = parseDate(match.date);
        if (!matchDate || matchDate > now) return;

        const stadiumName = getStadium(match.stadium);
        if (!stadiumName || stadiumName === 'Unknown' || stadiumName.trim() === '' || stadiumName.toLowerCase().includes('unknown')) return;

        if (!stats[stadiumName]) {
            stats[stadiumName] = { name: stadiumName, wins: 0, draws: 0, losses: 0, total: 0 };
        }

        const s = stats[stadiumName];
        updateWinLossStats(s, res); // Reuse logic if possible, or duplicate for now
    });

    return Object.values(stats).map(s => ({
        ...s,
        winRate: s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0
    })).sort((a, b) => b.total - a.total || b.wins - a.wins);
}

export function getOpponentStats(seasonFilter, matchTypeFilter) {
    const stats = {};
    const now = new Date();

    const targetSchedule = scheduleData.filter(m => {
        const seasonMatch = (!seasonFilter || seasonFilter === 'all') ? true : m.season === seasonFilter;
        const typeMatch = (!matchTypeFilter || matchTypeFilter === 'all') ? true : m.matchType === matchTypeFilter;
        if ((!matchTypeFilter || matchTypeFilter === 'all') && m.matchType === '연습경기') return false;
        return seasonMatch && typeMatch;
    });

    targetSchedule.forEach(match => {
        if (!match.result) return;
        const res = match.result.trim();
        if (!res) return;

        // Date Check
        const matchDate = parseDate(match.date);
        if (!matchDate || matchDate > now) return;

        const oppName = (match.opponent || '').trim();
        if (!oppName) return;

        if (!stats[oppName]) {
            stats[oppName] = { name: oppName, wins: 0, draws: 0, losses: 0, total: 0 };
        }

        const s = stats[oppName];
        updateWinLossStats(s, res);
    });

    return Object.values(stats).map(s => ({
        ...s,
        winRate: s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0
    })).sort((a, b) => b.total - a.total || b.wins - a.wins);
}

function updateWinLossStats(s, res) {
    let isWin = ['승', 'WIN', 'W', 'O'].some(k => res.includes(k));
    let isDraw = ['무', 'DRAW', 'D', '△', '-'].some(k => res.includes(k));
    let isLoss = ['패', 'LOSS', 'L', 'LOSE', 'X'].some(k => res.includes(k));

    if (!isWin && !isDraw && !isLoss) {
        const scoreMatch = res.match(/(\d+)\s*[:]\s*(\d+)(?:\s*\(PK\s*(\d+)\s*[:]\s*(\d+)\))?/i);
        const pkSuffixMatch = res.match(/(\d+)\s*[:]\s*(\d+)\s*\(\s*(\d+)\s*[:]\s*(\d+)\s*PK\s*\)/i);

        if (scoreMatch || pkSuffixMatch) {
            const matchData = scoreMatch || pkSuffixMatch;
            const mainScore = {
                our: parseInt(matchData[1]),
                opp: parseInt(matchData[2]),
                pk: matchData[3] && matchData[4] ? { our: parseInt(matchData[3]), opp: parseInt(matchData[4]) } : null
            };

            const mainWin = mainScore.our > mainScore.opp;
            const mainDraw = mainScore.our === mainScore.opp;
            const mainLoss = mainScore.our < mainScore.opp;

            if (mainDraw && mainScore.pk) {
                if (mainScore.pk.our > mainScore.pk.opp) isWin = true;
                else if (mainScore.pk.our < mainScore.pk.opp) isLoss = true;
                else isDraw = true;
            } else {
                isWin = mainWin;
                isDraw = mainDraw;
                isLoss = mainLoss;
            }
        }
    }

    s.total++;
    if (isWin) s.wins++;
    else if (isDraw) s.draws++;
    else if (isLoss) s.losses++;
}

// [NEW] Helper for linking goals/assists based on G#/A# tags
export function getLinkedMatchStats(season, matchId) {
    const events = [];
    const matchRecords = recordsData.filter(r => r.season === season && r.matchId === matchId);
    const goalRecords = matchRecords.filter(r => r.goals > 0);

    goalRecords.forEach(r => {
        for (let i = 0; i < r.goals; i++) {
            const gTags = (r.note || '').match(/G\d+/gi) || [];
            let currentTag = gTags[i];
            let assisterName = null;

            if (currentTag) {
                const partner = matchRecords.find(p =>
                    p.name !== r.name &&
                    p.note &&
                    p.note.toUpperCase().includes(currentTag.toUpperCase())
                );
                if (partner) assisterName = partner.name;
            }

            events.push({
                scorer: r.name,
                assister: assisterName,
                tag: currentTag
            });
        }
    });

    return events;
}


export function getMatchRecords(season, matchId) {
    return recordsData.filter(r => r.season === season && r.matchId === matchId);
}

