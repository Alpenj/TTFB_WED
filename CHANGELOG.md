# Changelog

> **Versioning Policy**: `v<Major>.<Minor>_<YYMMDD>`
> - **Major**: Significant updates, design overhauls, or breaking changes.
> - **Minor**: Feature additions, improvements, or bug fixes.
> - **Date**: Release date suffix (YYMMDD).

## [v1.0_260110] - 2026-01-10
### Released
- **Initial Major Release**: Established stable version v1.0.
### Fixed
- **Stadium Map**: Updated "Welfare Center" (복지관) map integration.
    - **Links**: Naver (Address: '하안동 740'), Kakao (Direct Link), TMAP (Direct Link).
    - **Modal Display**: Shows "Seoul Municipal Workers' Youth Welfare Center" (서울시립근로청소년복지관).
- **UI Experience**:
    - **Schedule**: Displays Season Year (e.g., "2024") in **Neon Green** above Match Type in "All Time" view.
    - **Intro**: Refined dashboard introduction with professional tone.
- **Next Schedule**: Fixed filtering logic to respect the active match type tab.
- **Repository**: Removed error log files and updated `.gitignore`.
- **UI Refinement**:
    - **Global Layout**: Consolidated Match Type filters into the tab bar and standardized page headers.
    - **Bug Fixes**: Resolved critical HTML tag rendering issues (raw HTML strings in UI).
    - **Records**: Split "Appearances" into sortable "Starts" (선발) and "Subs" (교체) columns.
    - **Terminology**: Renamed '자살골' to '자책골' (Own Goal).
    - **Styling**: Unified 'Draw' (무) indicator color to Yellow in Opponent/Stadium stats and **Home Page Summary**.
    - **Consistency**: Unified layout and collapse behavior for Opponent/Stadium Stats across Home and Records pages.
    - **Schedule**: Filtered out future placeholder matches (invalid dates) and sorted by Date Descending (Recent -> Past).
    - **Dashboard**: Added "Total Matches" (경기 수) card to Home summary for clearer team activity overview.

## [v0.9_260110] - 2026-01-10 (Pre-release)
### Added
- **Linked Stats**: Implemented Scorer/Assister linking in Schedule view.
- **Home Page**: Restored and enhanced "Opponent Stats" and "Stadium Stats" sections (Collapsible).
- **Filtering**: Added "All Time" (통산) season filter as the default view.
- **Player History**: 
    - Sorted by Date Ascending (Past -> Recent).
    - Fixed "+1" alignment.
    - Suppressed linked info in "Appearances" modal.
### Fixed
- **Critical Bug**: Removed duplicate `getOpponentStats` function in `data.js` that caused blank page errors.
