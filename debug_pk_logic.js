
const TEAM_CODE_MAP = {
    'T.TUE': '화요일', 'T.MWE': '수 오전', 'T.WED': '수 야간', 'T.THU': '목요일',
    'T.MFR': '금 오전', 'T.FRI': '금 야간', 'T.SAT': '토요일', 'T.SUN': '일요일',
    '수요일': '수 야간', '금요일': '금 야간', '금 이긴': '금 야간'
};

function normalizeTeamName(rawName) {
    if (!rawName) return '';
    const trimmed = rawName.trim();
    let name = TEAM_CODE_MAP[trimmed] || trimmed.replace(/([월화수목금토일])(오전|야간)/, '$1 $2');
    if (name === '일요일일') name = '일요일';
    return name;
}

function parseLeagueMatchesCSV(rows) {
    return rows.slice(1).map(row => {
        if (row.length < 9) return null;

        const result = row[8].trim();
        const fullResult = row[8].trim();
        let homeScore = 0;
        let awayScore = 0;
        let validResult = false;
        let pkWinner = undefined;

        if (fullResult.includes(':')) {
            let mainParts = fullResult.split('(')[0].split(':');
            let h = parseInt(mainParts[0].trim());
            let a = parseInt(mainParts[1].trim());

            if (!isNaN(h) && !isNaN(a)) {
                homeScore = h;
                awayScore = a;
                validResult = true;

                if (fullResult.includes('(')) {
                    const pkContent = fullResult.split('(')[1].replace(')', ''); // Potential Issue Here
                    if (pkContent.includes(':')) {
                        const pkParts = pkContent.split(':');
                        const pkH = parseInt(pkParts[0].trim());
                        const pkA = parseInt(pkParts[1].trim());

                        if (!isNaN(pkH) && !isNaN(pkA)) {
                            if (pkH > pkA) pkWinner = 'home';
                            else if (pkA > pkH) pkWinner = 'away';
                        }
                    }
                }
            }
        }

        if (!validResult) return null;

        const homeTeam = normalizeTeamName(row[6]);
        const awayTeam = normalizeTeamName(row[7]);

        return {
            id: row[1].trim(),
            season: row[0].trim().replace('시즌', ''),
            type: row[2].trim(),
            homeTeam: homeTeam,
            awayTeam: awayTeam,
            homeScore: homeScore,
            awayScore: awayScore,
            date: row[3].trim(),
            pkWinner: pkWinner,
            originalResult: fullResult
        };
    }).filter(m => m && m.homeTeam);
}

// Test Data with variations
const testRows = [
    ['Header', 'Header', 'Header', 'Header', 'Header', 'Header', 'Header', 'Header', 'Header'],
    ['2026', 'Cup1', '컵', '2026.05.21', '20:00', 'Stadium', 'Team A', 'Team B', '2:2 (5:4)'], // Standard
    ['2026', 'Cup2', '컵', '2026.05.22', '20:00', 'Stadium', 'Team C', 'Team D', '1 : 1 ( 3 : 4 )'], // Spaces
    ['2026', 'Cup3', '컵', '2026.05.23', '20:00', 'Stadium', 'Team E', 'Team F', '0:0(4:2)'], // No spaces
    ['2026', 'Cup4', '컵', '2026.05.24', '20:00', 'Stadium', 'Team G', 'Team H', '3:3 ( 2: 1 )'] // Mixed
];

const parsed = parseLeagueMatchesCSV(testRows);
console.log(JSON.stringify(parsed, null, 2));

// Calculate Points Logic Simulation
const stats = {};
parsed.forEach(m => {
    if (!stats[m.homeTeam]) stats[m.homeTeam] = { pts: 0 };
    if (!stats[m.awayTeam]) stats[m.awayTeam] = { pts: 0 };

    if (m.homeScore === m.awayScore) {
        if (m.pkWinner === 'home') {
            stats[m.homeTeam].pts += 3;
            console.log(`${m.homeTeam} Wins PK (3pts)`);
        } else if (m.pkWinner === 'away') {
            stats[m.awayTeam].pts += 3;
            console.log(`${m.awayTeam} Wins PK (3pts)`);
        } else {
            console.log(`Draw match with no PK winner detected? (${m.originalResult})`);
        }
    }
});
