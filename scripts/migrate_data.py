import csv
import sys

# Input/Output paths
input_file = 'temp_source.csv'

def parse_csv():
    records = []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = list(csv.reader(f))
        
    # Find the header row starting with "닉네임"
    header_row_idx = -1
    for i, row in enumerate(reader):
        if row and row[0].strip() == '닉네임':
            header_row_idx = i
            break
            
    if header_row_idx == -1:
        print("Error: Could not find header row starting with '닉네임'")
        return

    headers = reader[header_row_idx]
    
    # Identify Match Columns
    # Look for "1R", "2R", "컵", "플옵" etc.
    # The first one "25. 1R" indicates Season 2025?
    match_cols = []
    season_map = {}
    
    current_season = "2025" # Default inferred
    
    for i, h in enumerate(headers):
        h = h.strip()
        if not h: continue
        
        # Check for season indicator (e.g., "25. 1R")
        if "25." in h:
            current_season = "2025"
            match_id = h.replace("25.", "").strip()
        else:
            match_id = h
            
        # Heuristic: Valid match columns usually end in 'R' or contain '컵', '플옵'
        # And are NOT '선발', '교체', '총합', '골', '도움'
        if h in ['닉네임', '포지션', '선발', '교체', '총합', '골', '도움', '공격포인트', '클린시트']:
            continue
            
        # Also exclude potential day columns if they appear here (unlikely in this row)
        # But wait, looking at data: 1R, 2R... are valid. 
        # "일요일"? in header?
        if h == "일요일": continue 
        
        # It seems valid match columns are between '포지션' and '선발'
        # Let's find index of '선발'
        try:
            start_idx = headers.index('선발')
            if i >= start_idx: continue
        except ValueError:
            pass

        if i > 1: # Skip Nickname, Position
             match_cols.append({
                 'index': i,
                 'id': match_id,
                 'season': current_season
             })

    # Generate Records
    # Header: 시즌, ID, 포지션, 선수명, 출전/선발, 득점, 도움, 경고, 퇴장
    print("시즌,ID,포지션,선수명,출전/선발,득점,도움,경고,퇴장")
    
    for row in reader[header_row_idx+1:]:
        if not row or len(row) < 2: continue
        
        name = row[0].strip()
        position = row[1].strip()
        
        if not name: continue
        
        for match in match_cols:
            if match['index'] >= len(row): continue
            
            val = row[match['index']].strip()
            
            # Map values
            appearance = ''
            if val in ['O', 'o', '0']: # Sometimes 0 is used? No, 'O'
                 appearance = '선발'
            elif val == '교체':
                 appearance = '교체'
            
            if appearance:
                # We found a record
                # Note: Goals/Assists are 0 because per-match data is missing
                print(f"{match['season']},{match['id']},{position},{name},{appearance},0,0,0,0")

if __name__ == '__main__':
    parse_csv()
