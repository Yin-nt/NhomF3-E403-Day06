import pandas as pd
import json
import os
import math

def clean_value(val):
    if pd.isna(val) or val is None:
        return ""
    if isinstance(val, str):
        return val.strip()
    return str(val)

def main():
    # Paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    # Parent directory holds the CSVs
    root_dir = os.path.dirname(base_dir)
    csv_path = os.path.join(root_dir, 'chi_tiet_dia_diem_viet_nam_gody.csv')
    
    out_dir = os.path.join(base_dir, 'mock_data')
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, 'vietnam_spots.json')
    
    print(f"Reading CSV from {csv_path}...")
    df = pd.read_csv(csv_path)
    print(f"Loaded {len(df)} rows.")
    
    # Structure: { province_slug: [ { title, address, price, open_time, description, link }, ... ] }
    spots_by_province = {}
    
    for _, row in df.iterrows():
        province = clean_value(row.get('province'))
        if not province:
            continue
            
        spot = {
            "name": clean_value(row.get('title')),
            "address": clean_value(row.get('address')),
            "price": clean_value(row.get('price')),
            "open_time": clean_value(row.get('open_time')),
            "description": clean_value(row.get('description')),
            "link": clean_value(row.get('link'))
        }
        
        if province not in spots_by_province:
            spots_by_province[province] = []
            
        spots_by_province[province].append(spot)
        
    print(f"Found data for {len(spots_by_province)} provinces.")
    
    # Save to JSON
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(spots_by_province, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully saved JSON to {out_path} (size: {os.path.getsize(out_path)/1024/1024:.2f} MB)")

if __name__ == "__main__":
    main()
