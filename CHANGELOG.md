# Changelog

## [v1.0_260110] - 2026-01-10
### Released
- **Initial Major Release**: Established stable version v1.0.
### Fixed
- **Stadium Map**: Updated "Welfare Center" (복지관) map integration.
    - **Display**: Shows "Seoul Municipal Workers' Youth Welfare Center" (서울시립근로청소년복지관) in the modal for clarity.
    - **Search**: Map buttons explicitly search for the address "784, Ori-ro, Gwangmyeong-si" (경기도 광명시 오리로 784) to ensure correct location results.
- **Next Schedule**: Fixed filtering logic to respect the active match type tab.
- **Repository**: Removed error log files and updated `.gitignore`.

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
