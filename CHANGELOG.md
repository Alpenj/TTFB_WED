# Changelog

## [ver.260110.2] - 2026-01-10 (Current)
### Fixed
- **Next Schedule**: Fixed filtering logic to respect the active match type tab (e.g., Practice Match tab now shows "No Schedule" instead of leaking League matches).
- **Repository**: Removed error log files (`build.log`, `error.log`) and updated `.gitignore`.

## [ver.260110] - 2026-01-10
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
