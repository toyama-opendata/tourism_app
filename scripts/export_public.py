"""Allowlisted aggregates only. No respondent rows or free text are exported."""
from pathlib import Path
import json
import pandas as pd
ROOT=Path(__file__).resolve().parents[1]
def export_public(result, audit):
    details=json.loads((ROOT/'data/master/spot_details.json').read_text('utf-8'))
    spots=[]
    for r in result.to_dict('records'):
        spots.append({'id':r['spot_id'],'name':r['name'],'municipality':r['municipality'],
                      'scores':[round(float(r[f'final_axis{i}']),6) for i in range(1,5)],
                      'n':int(r['n']),'reason':r['reason'] if r['n']>=10 else None,
                      'description':details[r['name']]['description'],'url':r['source_url']})
    payload={'schemaVersion':1,'period':audit['period'],'responses':audit['analysis_rows'],
             'audience':'県外在住者・仕事目的のみを除く','spots':spots}
    out=ROOT/'public/data'; out.mkdir(parents=True,exist_ok=True)
    (out/'spots.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2,allow_nan=False),encoding='utf-8')
if __name__=='__main__':
    export_public(pd.read_csv(ROOT/'docs/phase1/spot_scores_provisional.csv').fillna(''),json.loads((ROOT/'docs/phase1/aggregation_audit.json').read_text('utf-8')))
