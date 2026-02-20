
// CSV URLs provided by the user

const PLAYERS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGGWFn467-3HymL_GgM6kifS1veoPDSgCG47Za6sO94ZJr8n9PzmL-h_aVCo7e59gbPhVbkfHJtEA9/pub?gid=0&single=true&output=csv';
const SCHEDULE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGGWFn467-3HymL_GgM6kifS1veoPDSgCG47Za6sO94ZJr8n9PzmL-h_aVCo7e59gbPhVbkfHJtEA9/pub?gid=2105782746&single=true&output=csv';
const RECORDS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGGWFn467-3HymL_GgM6kifS1veoPDSgCG47Za6sO94ZJr8n9PzmL-h_aVCo7e59gbPhVbkfHJtEA9/pub?gid=426357573&single=true&output=csv';
const STADIUM_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGGWFn467-3HymL_GgM6kifS1veoPDSgCG47Za6sO94ZJr8n9PzmL-h_aVCo7e59gbPhVbkfHJtEA9/pub?gid=1733505023&single=true&output=csv';
// [NEW] CSV Link for League/Cup Matches (Matches from ALL teams)
const LEAGUE_MATCHES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGGWFn467-3HymL_GgM6kifS1veoPDSgCG47Za6sO94ZJr8n9PzmL-h_aVCo7e59gbPhVbkfHJtEA9/pub?gid=1902200783&single=true&output=csv';

let playersData = [];
let scheduleData = [];
let recordsData = [];
let stadiumData = [];
let leagueMatchesData = [];

export async function fetchData() {
    try {
        // Use stable URLs so browser cache can be reused.
        const promises = [
            fetch(PLAYERS_CSV_URL),
            fetch(SCHEDULE_CSV_URL),
            fetch(RECORDS_CSV_URL),
            fetch(STADIUM_CSV_URL)
        ];


        if (LEAGUE_MATCHES_CSV_URL && LEAGUE_MATCHES_CSV_URL.startsWith('http')) {
            promises.push(fetch(LEAGUE_MATCHES_CSV_URL));
        } else {
            // Mock promise if no URL yet
            promises.push(Promise.resolve(new Response("")));
        }

        const responses = await Promise.all(promises);

        // Check for HTTP errors
        for (let i = 0; i < responses.length; i++) {
            if (!responses[i].ok) throw new Error(`HTTP error! status: ${responses[i].status}`);
        }

        const texts = await Promise.all(responses.map(r => r.text()));

        playersData = parsePlayersCSV(texts[0]);
        scheduleData = parseScheduleCSV(texts[1]);
        recordsData = parseRecordsCSV(texts[2]);
        stadiumData = parseStadiumCSV(texts[3]);
        leagueMatchesData = parseLeagueMatchesCSV(texts[4]);

        console.log("Data loaded successfully:", {
            players: playersData.length,
            schedule: scheduleData.length,
            records: recordsData.length,
            stadiums: stadiumData.length,
            leagueMatches: leagueMatchesData.length
        });
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
            const appearance = r.appearance ? r.appearance.trim() : '';
            events.push({
                season: r.season,
                matchId: r.matchId,
                round: match.round,
                date: match.date,
                opponent: match.opponent,
                count: count,
                type: eventType,
                appearance, // Used by history modal (선발/교체)
                submissionType: appearance, // Backward compatibility
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

const TEAM_CODE_MAP = {
    'T.TUE': '화요일',
    'T.MWE': '수 오전',
    'T.WED': '수 야간',
    'T.THU': '목요일',
    'T.MFR': '금 오전',
    'T.FRI': '금 야간',
    'T.SAT': '토요일',
    'T.SUN': '일요일',
    '수요일': '수 야간',
    '금요일': '금 야간',
    '금 이긴': '금 야간', // Potential typo/legacy seen in screenshot? "금 이긴" -> Rank 4 in screenshot looks like "금 이긴" (Gold Won? typo?). Screenshot says "금 아간" or "금 야간". Wait.
    // Screenshot Row 4 says "금 아간" or "금 이긴"? It's blurry but looks like "금 이긴" or "금 00". 
    // Ah, screenshot says "4. 금 이긴". "금 이긴"? Maybe "금 야간" with typo?
    // Wait, the user said "금 야간 금요일 왜 다로 나오는지?".
    // So "금 야간" and "금요일" are separate.
    // I will map '금요일' -> '금 야간'.
};

function normalizeTeamName(rawName) {
    if (!rawName) return '';
    const trimmed = rawName.trim();
    let name = TEAM_CODE_MAP[trimmed] || trimmed.replace(/([월화수목금토일])(오전|야간)/, '$1 $2');

    // [FIX] Normalize potential data typos
    if (name === '일요일일') name = '일요일';

    return name;
}

function parseLeagueMatchesCSV(csvText) {
    const rows = parseCSV(csvText);
    // Header found: 시즌,ID,구분,날짜,시간,구장,홈,어웨이,결과
    // Indices: 0:Season, 2:Type, 6:Home, 7:Away, 8:Result
    return rows.slice(1).map(row => {
        if (row.length < 9) return null;

        const result = row[8].trim();
        const fullResult = row[8].trim(); // Original was 'result', changed to 'fullResult'
        let homeScore = 0;
        let awayScore = 0;
        let validResult = false;

        // Parse "2:0" or "2 : 0"
        if (fullResult.includes(':')) { // Original was 'result', changed to 'fullResult'
            // Check for PK score: "2:2 (5:4)" or "2:2(5:4)"
            let mainParts = fullResult.split('(')[0].split(':');
            let h = parseInt(mainParts[0].trim());
            let a = parseInt(mainParts[1].trim());

            if (!isNaN(h) && !isNaN(a)) {
                homeScore = h;
                awayScore = a;
                validResult = true;

                // PK Logic
                if (fullResult.includes('(')) {
                    const pkContent = fullResult.split('(')[1].replace(')', '');
                    if (pkContent.includes(':')) {
                        const pkParts = pkContent.split(':');
                        const pkH = parseInt(pkParts[0].trim());
                        const pkA = parseInt(pkParts[1].trim());

                        // If regular time draw, adjust W/L based on PK using a flag
                        // We will store pkWinner for the standings calculator
                        if (!isNaN(pkH) && !isNaN(pkA)) {
                            if (pkH > pkA) row.pkWinner = 'home';
                            else if (pkA > pkH) row.pkWinner = 'away';
                        }
                    }
                }
            }
        }

        if (!validResult) return null;

        const homeTeam = normalizeTeamName(row[6]);
        const awayTeam = normalizeTeamName(row[7]);

        return {
            id: row[1].trim(), // Added ID
            season: row[0].trim().replace('시즌', ''),
            type: row[2].trim(),
            homeTeam: homeTeam,
            awayTeam: awayTeam,
            homeScore: homeScore,
            awayScore: awayScore,
            date: row[3].trim(),
            pkWinner: row.pkWinner
        };
    }).filter(m => m && m.homeTeam);
}

export function getStandings(seasonFilter, matchType) {
    const stats = {};
    const filter = String(seasonFilter);

    // Filter matches
    let matches = leagueMatchesData.filter(m => {
        const seasonMatch = (!seasonFilter || seasonFilter === 'all') ? true : String(m.season) === filter;
        const typeMatch = m.type === matchType;
        return seasonMatch && typeMatch;
    });

    // [NEW] Merge User's Schedule (TTFB_WED) into Standings
    // Strategy:
    // 1. Primary Source: League Matches (TFL/TFC Sheet)
    // 2. Secondary Source: User's Schedule (Schedule Sheet) - ONLY for '수 야간'
    // 3. Deduplication: If a match exists in (1), ignore (2).

    const wedMatches = scheduleData.filter(m => {
        const seasonMatch = (!seasonFilter || seasonFilter === 'all') ? true : String(m.season) === filter;
        const typeMatch = m.matchType === matchType;
        // Must have a valid score result to count for standings
        const hasResult = m.result && /\d+:\d+/.test(m.result);
        return seasonMatch && typeMatch && hasResult;
    }).map(m => {
        // Parse Score (Assume "MyScore : OppScore")
        const scoreMatch = m.result.match(/(\d+)\s*:\s*(\d+)/);
        if (!scoreMatch) return null;

        const myScore = parseInt(scoreMatch[1]);
        const oppScore = parseInt(scoreMatch[2]);

        const opponentName = normalizeTeamName(m.opponent);

        // Detect PK Winner for Wed Matches
        let pkWinner = undefined;
        if (m.result.includes('(')) {
            const pkContent = m.result.split('(')[1].replace(')', '');
            if (pkContent.includes(':')) {
                const pkParts = pkContent.split(':');
                const pkH = parseInt(pkParts[0].trim());
                const pkA = parseInt(pkParts[1].trim());
                if (!isNaN(pkH) && !isNaN(pkA)) {
                    // Wed Match 'Home' is always '수 야간' (User)
                    if (pkH > pkA) pkWinner = 'home';
                    else if (pkA > pkH) pkWinner = 'away';
                }
            }
        }

        return {
            id: m.matchId, // From Schedule
            season: m.season,
            type: m.matchType,
            homeTeam: '수 야간', // Always User's Team
            awayTeam: opponentName,
            homeScore: myScore,
            awayScore: oppScore,
            date: m.date,
            pkWinner: pkWinner
        };
    }).filter(m => m !== null);

    // [DEDUPLICATION] Filter out Wed Matches that are already in League Matches
    const uniqueWedMatches = wedMatches.filter(wm => {
        // Check if this match already exists in 'matches'
        const isDuplicate = matches.some(existing => {
            // 1. Check ID Match (Strongest Check, but requires Team verification too)
            // Just matching ID is dangerous if IDs are '1R' (Round Numbers) which are not unique globally.
            // So we must confirm the existing match involves '수 야간' (or matches the specific opponent).
            if (existing.id && wm.id && existing.id === wm.id) {
                const involvesWed = existing.homeTeam === '수 야간' || existing.awayTeam === '수 야간';
                if (involvesWed) return true;
            }

            // 2. Fallback: Check Date & Teams
            // Normalize dates to handle potentially different formats (YYYY.MM.DD vs YYYY-MM-DD or whitespace)
            const d1 = existing.date.replace(/[\.\-\/]/g, '').trim();
            const d2 = wm.date.replace(/[\.\-\/]/g, '').trim();
            const sameDate = d1 === d2;

            // Check if existing match involves '수 야간' and the same opponent
            // Note: existing.homeTeam/awayTeam are already normalized
            const hasWed = existing.homeTeam === '수 야간' || existing.awayTeam === '수 야간';
            const hasOpponent = existing.homeTeam === wm.awayTeam || existing.awayTeam === wm.awayTeam;

            return sameDate && hasWed && hasOpponent;
        });
        return !isDuplicate;
    });

    matches = [...matches, ...uniqueWedMatches];

    matches.forEach(m => {
        // Init Teams
        if (!stats[m.homeTeam]) stats[m.homeTeam] = { name: m.homeTeam, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
        if (!stats[m.awayTeam]) stats[m.awayTeam] = { name: m.awayTeam, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };

        const home = stats[m.homeTeam];
        const away = stats[m.awayTeam];

        home.p++;
        away.p++;

        home.gf += m.homeScore;
        home.ga += m.awayScore;
        home.gd = home.gf - home.ga;

        away.gf += m.awayScore;
        away.ga += m.homeScore;
        away.gd = away.gf - away.ga;

        // Update Round Weight
        let weight = 0;
        if (m.id) {
            // Must check Semi-Final ('준결승') BEFORE Final ('결승') because '준결승' contains '결승'
            if (m.id.includes('준결승') || m.id.includes('4강')) weight = 50;
            else if (!m.id.includes('준') && m.id.includes('결승')) weight = 100;
            else if (m.id.includes('8강')) weight = 25;
            else if (m.id.includes('16강')) weight = 10;
        }
        // Initialize maxRoundWeight if not present
        if (home.maxRoundWeight === undefined) home.maxRoundWeight = 0;
        if (away.maxRoundWeight === undefined) away.maxRoundWeight = 0;

        if (weight > home.maxRoundWeight) home.maxRoundWeight = weight;
        if (weight > away.maxRoundWeight) away.maxRoundWeight = weight;

        if (m.homeScore > m.awayScore) {
            home.w++; home.pts += 3;
            away.l++;
        } else if (m.homeScore < m.awayScore) {
            away.w++; away.pts += 3;
            home.l++;
        } else {
            // DRAW in regular time
            // Check PK Winner
            if (m.pkWinner === 'home') {
                home.w++; home.pts += 3;
                away.l++;
            } else if (m.pkWinner === 'away') {
                away.w++; away.pts += 3;
                home.l++;
            } else {
                home.d++; home.pts += 1;
                away.d++; away.pts += 1;
            }
        }
    });

    return Object.values(stats).sort((a, b) => {
        // Tournament Sorting: Higher Round first (Only for Cup/Playoff)
        const isTournament = matchType.includes('컵') || matchType.includes('플레이오프') || matchType.includes('플옵');

        if (isTournament) {
            if (b.maxRoundWeight !== a.maxRoundWeight) return b.maxRoundWeight - a.maxRoundWeight;
        }

        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
    });
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

    const order = ['리그', '컵', '플레이오프', '플옵', '연습경기'];
    return Array.from(types).sort((a, b) => {
        const indexA = order.indexOf(a);
        const indexB = order.indexOf(b);

        // If both are in the known order list, compare indices
        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        }

        // If only A is in the list, A comes first
        if (indexA !== -1) return -1;

        // If only B is in the list, B comes first
        if (indexB !== -1) return 1;

        // If neither are in the list, sort alphabetically
        return a.localeCompare(b);
    });
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
                // Check Match Position (not default position)
                const recordPos = record.position ? record.position.toUpperCase() : '';
                const isDefender = ['DF', 'CB', 'WB', 'LB', 'RB', 'LWB', 'RWB'].includes(recordPos) || recordPos.includes('DF');
                const isGoalkeeper = recordPos === 'GK';

                // Check if played (Start or Sub)
                const played = ['선발', '교체', 'Start', 'Sub', 'start', 'sub', 'O', 'o'].includes(record.appearance);

                if ((isDefender || isGoalkeeper) && played) {
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
            .filter(p => p.cleanSheets > 0) // Show anyone with clean sheets
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

