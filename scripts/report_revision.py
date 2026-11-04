"""Generate the phase-1 revision memo from aggregate results only."""
from pathlib import Path
import json
import pandas as pd
import yaml
from scoring import mainstream_hidden
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/phase1'

def main():
    audit=json.loads((OUT/'aggregation_audit.json').read_text('utf-8'))
    assert audit['revision']=='2026-10-31-conjunctive-axis4-nonresident'
    cfg=yaml.safe_load((ROOT/'config/axis_mapping.yaml').read_text('utf-8'))
    d=pd.read_csv(OUT/'spot_scores_provisional.csv')
    old=pd.read_csv(OUT/'history_20261030/spot_scores_provisional.csv').set_index('spot_id')
    assert len(d)==47 and d.spot_id.is_unique
    assert audit['analysis_rows']==audit['source_rows']-audit['excluded_business_only']-audit['excluded_residents_after_business']-audit['excluded_unknown_residence_after_business_and_residents']
    hidden=d[d.final_axis4<0]
    assert hidden.visit_rate.lt(cfg['axis4']['max_hidden_visit_rate']).all()
    assert hidden.trip_nps_difference.gt(0).all()
    assert hidden.n.ge(cfg['axis4']['min_hidden_n']).all()
    assert hidden.prior_axis4.lt(cfg['axis4']['mainstream_prior_threshold']).all()
    assert d.loc[d.name=='立山黒部アルペンルート','final_axis4'].iloc[0]>0
    assert d.loc[d.name=='あさひ舟川「春の四重奏」','final_axis4'].iloc[0]>0
    assert d.loc[d.name=='称名滝','final_axis4'].iloc[0]>0
    lines=['# フェーズ1 修正版レポート（2026年10月31日）','',
      'ユーザー回答①〜③を反映しました。フェーズ2は未着手です。初回の調査内容は [初回レポート](history_20261030/report.md)、現在の計算式は [計算仕様](methodology.md) を参照してください。','',
      '## 反映内容','',
      '- 結合された「まちあるき・各種体験」の目的列は、両軸から除外を維持（ユーザー確認済み）。回答者自体は除外しません。',
      '- 母集団を県外在住者に変更。県内在住者と居住地が確認できない回答を除外します。今回は居住地不明の追加除外は0件です。',
      '- 穴場判定を加算型から条件付きに変更。高いNPSだけでは訪問率の高さを打ち消せません。',
      '- 追加確認：称名滝はユーザーの現場の知見・観光サイト閲覧状況等に基づき定番側へ補正。事前値を定番保護境界の+1.0に設定しました。閲覧数の実測データを読み込んだものではありません。他地点の判定は維持しています。','',
      '## 穴場判定の修正案','',
      'H側になるには、①対象期間内訪問率5%未満、②旅行全体NPSが同期間の県外母集団より高い、③nが30以上、④M/Hの事前値が+1未満、の全条件を必要とします。事前値+1以上の明確な定番候補は、季節性などで訪問率が低くてもM側に維持します。',
      '', '5%・30件・事前値+1は今回提示する設定値で、ユーザー指定や学習で得られた閾値ではありません。マスター事前値も未承認案です。特定の観光地名に対する例外処理は入れていません。',
      '', '条件外の低訪問率スポットは中立となる場合があり、「穴場ではない＝有名な定番」とは断定しません。表示用の仮4文字では従来どおり0をMに割り当てています。','',
      '## 再集計の対象','',
      '| 項目 | 件数 |','|---|---:|',
      f"| 元回答 | {audit['source_rows']:,} |",
      f"| 仕事目的のみ除外（県内外合計） | {audit['excluded_business_only']:,} |",
      f"| その後の県内在住除外 | {audit['excluded_residents_after_business']:,} |",
      f"| 最終対象 | {audit['analysis_rows']:,} |",
      f"| 旧21か所の分母 | {max(audit['denominators']):,} |",
      f"| 追加26か所の分母（2026-04-01以降） | {min(audit['denominators']):,} |",
      f"| 観光地別nの範囲 | {audit['minimum_spot_n']:,}〜{audit['maximum_spot_n']:,} |",
      f"| H側になった場所 | {audit['hidden_count']} |",
      f"| M/H中立の場所 | {audit['neutral_axis4_count']} |",'',
      '対象期間は2025-04-28〜2026-08-31。観光地の選択肢提供期間による分母制限を維持しています。nは訪問・訪問予定の回答件数であり、実来訪人数ではありません。NPSは場所単体ではなく旅行全体の評価です。','',
      '## 主な観光地のM/H比較','',
      '正がM、負がH。中央列は計算式を旧式のまま県外のみへ変更した値で、母集団変更と式変更の効果を分けて確認できます。','',
      '| 観光地 | 県外n | 訪問率 | 初回（県内含む・旧式） | 県外のみ・旧式 | 県外のみ・修正式 |','|---|---:|---:|---:|---:|---:|']
    names=['立山黒部アルペンルート','雨晴海岸','宇奈月温泉','黒部ダム','五箇山','あさひ舟川「春の四重奏」','称名滝']
    for name in names:
        r=d.loc[d.name==name].iloc[0]
        lines.append(f'| {name} | {r.n:,} | {r.visit_rate:.1%} | {old.loc[r.spot_id,"final_axis4"]:+.2f} | {r.legacy_final_axis4:+.2f} | {r.final_axis4:+.2f} |')
    alpen=d.loc[d.name==names[0]].iloc[0]
    lines += ['',f'アルペンルートはM/Hが{alpen.final_axis4:+.2f}で定番側です。一方、A/Rは{alpen.final_axis2:+.2f}で「のんびり」側が残っています。今回の是正対象は穴場軸であり、旅行全体の目的から場所の活動性を推定する軸2の問題を同時に解決したとはしていません。','',
      '## H側の場所一覧','',
      '| 観光地 | n | 訪問率 | 同期間全体とのNPS差 | M/H |','|---|---:|---:|---:|---:|']
    for r in hidden.sort_values('final_axis4').itertuples():
        lines.append(f'| {r.name} | {r.n} | {r.visit_rate:.1%} | {r.trip_nps_difference:+.2f} | {r.final_axis4:+.2f} |')
    lines += ['', '## 訪問率の境界を変えた場合','',
      '同じ県外データ・事前値で訪問率の境界だけを変更した比較です。推薦精度の評価ではありません。','',
      '| 訪問率の境界 | H側の場所数 |','|---|---:|']
    for threshold in [.03,.05,.08]:
        settings={**cfg['axis4'],'max_hidden_visit_rate':threshold}
        count=sum(mainstream_hidden(r.visit_rate,r.trip_nps_difference,r.n,r.prior_axis4,k=cfg['shrinkage_k'],**settings)[1]<0 for r in d.itertuples())
        lines.append(f'| {threshold:.0%}未満 | {count} |')
    lines += ['', '## 残る確認事項','',
      '1. ユーザー確認では穴場判定への違和感は称名滝のみ。称名滝を補正し、他の場所は維持しました。各事前値の数値そのものを全件承認済みと解釈するものではありません。',
      '2. アルペンルート等の「のんびり」判定も是正するか。是正する場合は、穴場軸とは別に軸1〜3の事前値との混合方法を検討します。',
      '3. 初回レポートで未回答だった月次入力形式（統合済みXLSX／同列CSV）、曖昧回答の扱い、マスター案は未承認です。',
      '',f"県外に限定後の目的全0は{audit['purpose_all_zero']}件、結合目的選択は{audit['ambiguous_purpose_selected']}件、訪問なしとの矛盾は{audit['no_visit_contradictions']}件です。目的全0は保持し、矛盾は観光地フラグ優先という前回の暫定処理を維持しています。",'',
      '## 検証・成果物','',
      '- pytest 20件通過。高NPSでも高訪問率ならHにしないこと、閾値境界、NPS差0、少数回答、欠損、事前値による条件の迂回防止、季節限定の定番保護を検証しました。',
      '- 実データ47か所でもH条件の全件適合と、アルペンルート・春の四重奏のM側判定を検証しました。',
      '- [全47か所の暫定スコア一覧](spot_scores_summary.md)',
      '- [中間計算付きCSV](spot_scores_provisional.csv)',
      '- [観光地マスター案](../../data/master/spots_master.csv)',
      '- 初回出力はhistory_20261030に保存しています。元回答データは変更していません。',
      '', 'フェーズ1の修正で停止します。フロント、GAS、GitHub Actions、公開処理には着手していません。']
    (OUT/'report.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    print(f'Validated {len(d)} spots; {len(hidden)} H-side spots. Revision report written.')

if __name__=='__main__': main()
