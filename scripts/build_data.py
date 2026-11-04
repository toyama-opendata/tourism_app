"""Read coded XLSX/CSV; write review aggregates and allowlisted public JSON.

Usage: python scripts/build_data.py [--input path/to/coded.xlsx|csv]
CSV must use the same coded columns as the approved dataset, not raw survey text.
"""
from pathlib import Path
import argparse, hashlib, json
import numpy as np
import pandas as pd
import yaml
from scoring import nps, valid_nps, zscore, shrink, business_only, eligible_visits, log_lift_difference, reason_text, mainstream_hidden
from inspect_sources import csv_read
from export_public import export_public

ROOT=Path(__file__).resolve().parents[1]

def main():
    parser=argparse.ArgumentParser()
    local_input=ROOT/'data/raw/kanko_data.csv'
    parser.add_argument('--input',type=Path,default=local_input if local_input.exists() else ROOT.parent/'dataset/出力データ/opendata_dataset_merge_202608.xlsx')
    args=parser.parse_args()
    cfg=yaml.safe_load((ROOT/'config/axis_mapping.yaml').read_text('utf-8'))
    if args.input.suffix.lower()=='.csv': d,encoding=csv_read(args.input)
    else: d=pd.read_excel(args.input); encoding='XLSX (Unicode XML)'
    source_count=len(d)
    master=pd.read_csv(ROOT/'data/master/spots_master.csv',encoding='utf-8-sig',keep_default_na=False)
    assert master.spot_id.is_unique and master.source_column.is_unique
    pcols=[c for c in d if c.startswith('訪問目的_')]
    scols=[c for c in d if c.startswith('訪問先_')]
    assert set(master.source_column).issubset(d.columns)
    for c in pcols+scols:
        if not d[c].isin([0,1]).all(): raise ValueError(f'Unexpected flag or missing value: {c}')
    dates=pd.to_datetime(d[['年','月','日']].rename(columns={'年':'year','月':'month','日':'day'}),errors='coerce')
    if dates.isna().any(): raise ValueError('Invalid response date')
    exclude=business_only(d,pcols,'訪問目的_'+cfg['business_only'])
    source_pre_mentions={row.spot_id:int((dates.lt(row.available_from)&d[row.source_column].eq(1)).sum()) for row in master.itertuples()}
    audit={'source_path':str(args.input.resolve()),'source_sha256':hashlib.sha256(args.input.read_bytes()).hexdigest(),'source_encoding':encoding,'source_rows':source_count,'excluded_business_only':int(exclude.sum()),'include_toyama_residents':cfg['include_toyama_residents'],'pre_availability_mentions':source_pre_mentions}
    if not cfg['include_toyama_residents']:
        prefectures=json.loads((ROOT/'src/content/attributes.json').read_text('utf-8'))['prefectures']
        resident=d['居住地'].eq('富山県') | d['居住エリア'].eq(99)
        unknown=~d['居住地'].isin(prefectures)
        audit['excluded_residents_after_business']=int((resident&~exclude).sum())
        audit['excluded_unknown_residence_after_business_and_residents']=int((unknown&~resident&~exclude).sum())
        exclude |= resident | unknown
    d=d.loc[~exclude].copy(); dates=dates.loc[d.index]
    groups={}
    for letter,names in cfg['groups'].items():
        cols=['訪問目的_'+x for x in names]
        missing=set(cols)-set(d.columns)
        if missing: raise ValueError(f'Missing mapped purposes: {missing}')
        groups[letter]=d[cols].eq(1).any(axis=1)
    audit.update(analysis_rows=len(d),period=[str(dates.min().date()),str(dates.max().date())],purpose_all_zero=int(d[pcols].sum(axis=1).eq(0).sum()),ambiguous_purpose_selected=int(d[['訪問目的_'+x for x in cfg['ambiguous_excluded']]].eq(1).any(axis=1).sum()),residents=int(d['居住地'].eq('富山県').sum()),invalid_nps=len(d)-len(valid_nps(d.NPS)),no_visit_contradictions=int((d['訪問先_観光地・観光施設には訪問していない'].eq(1)&d[list(master.source_column)].eq(1).any(axis=1)).sum()))
    rows=[]
    for spot in master.to_dict('records'):
        eligible,visited=eligible_visits(dates,d[spot['source_column']],spot['available_from'],spot['available_to'] or None)
        total=int(eligible.sum()); n=int(visited.sum())
        row={**spot,'eligible_n':total,'n':n,'source_pre_availability_n':source_pre_mentions[spot['spot_id']],'visit_rate':n/total if total else None,'nps_valid_n':len(valid_nps(d.loc[visited,'NPS'])),'trip_nps':nps(d.loc[visited,'NPS']),'period_trip_nps':nps(d.loc[eligible,'NPS'])}
        row['trip_nps_difference']=row['trip_nps']-row['period_trip_nps'] if row['trip_nps'] is not None and row['period_trip_nps'] is not None else None
        for axis,(left,right) in enumerate([('N','C'),('A','R'),('G','E')],1):
            lc=int((visited&groups[left]).sum()); rc=int((visited&groups[right]).sum())
            bl=int((eligible&groups[left]).sum()); br=int((eligible&groups[right]).sum())
            row[f'axis{axis}_log_lift_diff']=log_lift_difference(lc,rc,n,bl,br,total,cfg['smoothing_alpha'])
            for name,count,base in [(left,lc,bl),(right,rc,br)]:
                row[name+'_selected_n']=count; row[name+'_base_n']=base
        sat=d.loc[visited,'満足度（旅行全体）']; sat=sat[sat.isin([1,2,3,4,5])]
        revisit=d.loc[visited,'再来訪意向']; revisit=revisit[revisit.isin([1,2,3,4,5])]
        row.update(trip_satisfaction_valid_n=len(sat),trip_satisfaction_top2=float(sat.ge(4).mean()) if len(sat) else None,revisit_valid_n=len(revisit),revisit_top2=float(revisit.ge(4).mean()) if len(revisit) else None)
        # Explain an exact original purpose, not a combined synthetic group.
        candidates=[('訪問目的_'+name,name) for names in cfg['groups'].values() for name in names]
        counts=[(int(d.loc[visited,c].eq(1).sum()),name) for c,name in candidates]
        count,name=max(counts,key=lambda x:x[0])
        text=reason_text(name,count,n,cfg['minimum_reason_n'])
        row['reason']=text.replace('訪れた回答','訪問・訪問予定とした回答') if text else ''
        rows.append(row)
    result=pd.DataFrame(rows)
    for axis in range(1,4): result[f'data_axis{axis}']=zscore(result[f'axis{axis}_log_lift_diff']).clip(-2,2)
    result['log_visit_rate']=np.log((result.n+cfg['smoothing_alpha'])/(result.eligible_n+2*cfg['smoothing_alpha']))
    result['visit_rate_z']=zscore(result.log_visit_rate)
    result['nps_difference_z']=zscore(result.trip_nps_difference)
    # Keep the former additive formula as an audit comparison on the SAME cohort.
    result['legacy_data_axis4']=(.5*result.visit_rate_z-.5*result.nps_difference_z).clip(-2,2)
    result['legacy_final_axis4']=[shrink(s,p,n,cfg['shrinkage_k']) for s,p,n in zip(result.legacy_data_axis4,result.prior_axis4,result.n)]
    for axis in range(1,4): result[f'final_axis{axis}']=[shrink(score,prior,n,cfg['shrinkage_k']) for score,prior,n in zip(result[f'data_axis{axis}'],result[f'prior_axis{axis}'],result.n)]
    axis4=[mainstream_hidden(r.visit_rate,r.trip_nps_difference,r.n,r.prior_axis4,k=cfg['shrinkage_k'],**cfg['axis4']) for r in result.itertuples()]
    result[['data_axis4','final_axis4','hidden_eligible','axis4_rule']]=pd.DataFrame(axis4,index=result.index)
    assert not ((result.final_axis4<0)&~result.hidden_eligible).any()
    result['provisional_type']=[''.join(pair[0] if value>=0 else pair[1] for pair,value in zip(['NC','AR','GE','MH'],values)) for values in result[[f'final_axis{i}' for i in range(1,5)]].values]
    assert result.n.le(result.eligible_n).all()
    assert result[[f'final_axis{i}' for i in range(1,5)]].abs().le(2).all().all()
    audit['minimum_spot_n']=int(result.n.min())
    audit['maximum_spot_n']=int(result.n.max())
    audit['denominators']=sorted(result.eligible_n.unique().tolist())
    audit['purpose_groups']=cfg['groups']
    audit['revision']='2026-10-31-conjunctive-axis4-nonresident'
    audit['axis4_settings']=cfg['axis4']
    audit['hidden_count']=int(result.final_axis4.lt(0).sum())
    audit['neutral_axis4_count']=int(result.final_axis4.eq(0).sum())
    out=ROOT/'docs/phase1'; out.mkdir(parents=True,exist_ok=True)
    result.to_csv(out/'spot_scores_provisional.csv',index=False,encoding='utf-8-sig',float_format='%.8f')
    (out/'aggregation_audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
    cols=['spot_id','name','municipality','eligible_n','n','visit_rate','trip_nps','final_axis1','final_axis2','final_axis3','final_axis4','provisional_type']
    headers=['ID','観光地','市町村','対象回答数','訪問・予定n','訪問率','旅行全体NPS','N/C','A/R','G/E','M/H','仮タイプ']
    lines=['# 観光地別の暫定集計','', '正値はN・A・G・M、負値はC・R・E・H。nは人数ではなく回答件数。タイプは観光地の暫定プロフィールで、利用者の診断結果ではありません。','', '| '+' | '.join(headers)+' |','|'+'|'.join(['---']*len(headers))+'|']
    for _,r in result.sort_values('n',ascending=False)[cols].iterrows():
        values=[str(r[c]) if c not in ['visit_rate','trip_nps','final_axis1','final_axis2','final_axis3','final_axis4'] else (f'{r[c]:.1%}' if c=='visit_rate' else f'{r[c]:.2f}') for c in cols]
        lines.append('| '+' | '.join(values)+' |')
    (out/'spot_scores_summary.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    export_public(result,audit)
    print(json.dumps({k:v for k,v in audit.items() if k not in ['purpose_groups','pre_availability_mentions']},ensure_ascii=False,indent=2))

if __name__=='__main__': main()
