"""Read source workbooks without modifying them; export schema/aggregates only."""
from pathlib import Path
import json, hashlib
import pandas as pd
import openpyxl

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT.parent / 'dataset'
OUT = ROOT / 'docs/phase1'
OUT.mkdir(parents=True, exist_ok=True)

def dump(name, obj):
    (OUT/name).write_text(json.dumps(obj, ensure_ascii=False, indent=2, default=str), encoding='utf-8')

def csv_read(path, **kwargs):
    for enc in ['utf-8-sig', 'cp932', 'shift_jis']:
        try:
            path.read_bytes().decode(enc, errors='strict')
            return pd.read_csv(path, encoding=enc, **kwargs), enc
        except UnicodeDecodeError:
            continue
    raise ValueError(f'Unsupported encoding: {path}')

def main():
    src = BASE/'出力データ/opendata_dataset_merge_202608.xlsx'
    d = pd.read_excel(src)
    dates = pd.to_datetime(d[['年','月','日']].rename(columns={'年':'year','月':'month','日':'day'}), errors='coerce')
    profiles = []
    for col in d:
        s=d[col]
        item={'column':col, 'missing':int(s.isna().sum()), 'unique':int(s.nunique())}
        if col.startswith(('訪問先_', '訪問目的_')) or col in ['年代','同行者','居住地','NPS','再来訪意向','満足度（旅行全体）','来県回数']:
            item['values']={str(k):int(v) for k,v in s.value_counts(dropna=False).items()}
        profiles.append(item)
    dump('schema_audit.json', {'source':str(src),'sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'rows':len(d),'columns':len(d.columns),'dates':[str(dates.min().date()),str(dates.max().date())],'invalid_dates':int(dates.isna().sum()),'duplicate_rows':int(d.duplicated().sum()),'monthly_counts':dates.dt.strftime('%Y-%m').value_counts().sort_index().to_dict(),'profiles':profiles})
    w=openpyxl.load_workbook(BASE/'コーディングルール_データセット定義書.xlsx',read_only=True,data_only=True)
    dump('codebook_extract.json',{s.title:list(s.values) for s in w}); w.close()
    old,enc=csv_read(next((BASE/'入力データ').glob('*設問・選択肢一覧*.csv')),skiprows=1,keep_default_na=False)
    w=openpyxl.load_workbook(next((BASE/'入力データ').glob('*.xlsx')),read_only=True,data_only=True)
    new=list(w.active.values); w.close()
    dump('questionnaire_extract.json',{'old_encoding':enc,'old':old.values.tolist(),'new':new})
    print(json.dumps({'rows':len(d),'columns':len(d.columns),'dates':[str(dates.min()),str(dates.max())]}, ensure_ascii=False))

if __name__=='__main__': main()
