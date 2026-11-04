"""One-time draft creation; never overwrite the user's reviewed master."""
from pathlib import Path
import csv,json,re,unicodedata
ROOT=Path(__file__).resolve().parents[1]
def norm(s): return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s)).strip()

# Positive: nature, active, gourmet/shopping, mainstream. Editorial draft, not facts.
PRIORS={
'あさひ舟川「春の四重奏」':(2,.2,-.5,1.2,'花景色を歩いて楽しむ季節の名所'),
'雨晴海岸':(2,-.8,-.3,1.7,'海越しの山並みを眺める代表的景勝地'),
'井波エリア（井波別院瑞泉寺・八日町通りなど）':(-1.8,.4,-1.5,-.7,'木彫り文化と寺町散策・ものづくり'),
'岩瀬エリア':(-1.5,-.2,.8,.5,'港町の歴史散策と食の楽しみ'),
'魚津水族館':(.6,-.5,-1,.3,'水生生物の観察と学び'),
'魚津埋没林博物館':(.2,-.7,-1.5,-.9,'自然現象を室内で学ぶ博物館'),
'内川エリア（川の駅新湊など）':(-.8,-.8,.1,-.3,'川沿いの暮らしと町並みをゆっくり散策'),
'宇奈月温泉':(.8,-1.8,.6,1.4,'峡谷の玄関口の温泉街でくつろぐ'),
'海の駅蜃気楼':(.2,-.7,1.8,-.4,'魚津の魚介を買い物と食事で楽しむ'),
'大岩山日石寺':(-.7,.4,-.8,-.7,'山あいの寺院で文化にふれる'),
'海王丸パーク':(.3,-.8,-.7,1,'帆船と港の景色を楽しむ公園'),
'春日温泉郷':(1,-2,.4,-1.3,'自然に囲まれた温泉で滞在を楽しむ'),
'金屋町 千本格子の家並み':(-2,.2,-1.1,-.8,'鋳物文化が残る町並みを歩く'),
'黒部峡谷鉄道':(2,.6,-1,1.5,'鉄道に乗って峡谷の自然を体感'),
'黒部ダム':(1.6,1,-.7,1.8,'山岳のダムと展望台を巡る名所'),
'五箇山':(-.5,.3,-1.4,1.5,'山里の合掌造りと生活文化を訪ねる'),
'国宝 雲竜山勝興寺':(-2,0,-1.1,-.4,'寺院建築をじっくり鑑賞'),
'国宝 高岡山瑞龍寺':(-2,0,-1,1.3,'高岡を代表する禅宗建築を鑑賞'),
'魚の駅生地':(.2,-.6,2,-.8,'漁港の鮮魚と土地の味を楽しむ'),
'三郎丸蒸留所（若鶴酒造）':(-1.4,.3,-1.3,-.8,'ウイスキーの製造文化と見学体験'),
'庄川峡遊覧船':(1.8,-1,-.9,.4,'船上から峡谷の風景をゆっくり楽しむ'),
'称名滝':(2,1.5,-1,.8,'歩いて滝の景観を体感する'),
'新湊大橋':(.6,.2,-.6,.9,'港の橋と広がる眺望を楽しむ'),
'新湊きっときと市場':(0,-.5,2,.8,'魚介の食事と買い物が中心'),
'高岡大仏':(-2,-.2,-.7,1.3,'鋳物文化にふれる街中の名所'),
'立山黒部アルペンルート':(2,1.5,-1,2,'乗り物と徒歩で巡る代表的山岳観光'),
'砺波チューリップ公園':(1.7,-.3,-.5,1.4,'花を楽しむ公園と春の名所'),
'富山県[立山博物館]':(-1.2,-.3,-1.7,-1.1,'立山信仰と歴史を学ぶ'),
'富山県中央植物園':(1.8,-.7,-1,-.9,'植物を観察しながら穏やかに散策'),
'富山県美術館':(-1.8,-.8,-1.4,.9,'美術とデザインを鑑賞'),
'富山市ガラス美術館':(-2,-.8,-1.4,1.4,'ガラス美術を鑑賞する市街地の文化施設'),
'富山市ファミリーパーク':(1.4,.7,-1.2,.4,'里山で動物を観察して歩く'),
'富山城':(-1.8,.1,-.8,1,'城と郷土の歴史を知る'),
'入善海洋深層水パーク・入善牡蠣ノ星':(.3,-.3,1,-1.2,'海洋深層水の見学と牡蠣の食を楽しむ'),
'能作':(-1.7,.6,-1.6,-.2,'鋳物の工場見学・製作体験'),
'ヒスイ海岸（宮崎・境海岸）':(2,.8,-1.3,-.7,'小石の海岸で自然とヒスイ文化を楽しむ'),
'氷見温泉郷':(1,-2,1.3,.8,'海辺の温泉滞在と氷見の食'),
'氷見漁港場外市場 ひみ番屋街':(0,-.5,2,1.3,'氷見の食事と土産を楽しむ市場'),
'富岩運河環水公園':(.5,-1.5,0,1.5,'都市の水辺でゆっくり過ごす'),
'ほたるいかミュージアム':(.3,-.5,-1.5,.8,'富山湾の生き物を学ぶ体験型施設'),
'ますのすし本舗 源 ますのすしミュージアム':(-.8,-.5,1.1,-.5,'ますのすしの食文化と製造を知る'),
'松川遊覧船':(.5,-1.2,-.7,.4,'船から街と川辺の景色を楽しむ'),
'道の駅KOKOくろべ':(0,-.5,1.6,-.3,'地域の味と買い物の立ち寄り先'),
'道の駅メルヘンおやべ':(-.1,-.5,1.5,-1,'地域の食と土産を探す立ち寄り先'),
'三井アウトレットパーク北陸小矢部':(-1.7,.2,2,.6,'都市型のショッピングを楽しむ'),
'八尾エリア（八尾おわら資料館、八尾曳山会館など）':(-2,.4,-1.5,-.3,'坂の町並みとおわら・曳山の文化'),
'山町筋 土蔵造りの町並み':(-2,.2,-.9,-.7,'商人の町の土蔵造りを散策'),
}

def main():
    path=ROOT/'data/master/spots_master.csv'
    if path.exists(): raise FileExistsError('Master already exists; edit explicitly, do not regenerate')
    q=json.loads((ROOT/'docs/phase1/questionnaire_extract.json').read_text('utf-8'))
    old=[x.strip() for x in next(r[3] for r in q['old'] if r[1]=='訪問場所').split('、') if not x.strip().startswith('その他')]
    new=[x.strip() for x in next(r[3] for r in q['new'] if r[1]=='訪問場所').split(',') if '訪問していない' not in x]
    assert len(old)==21 and len(new)==47
    municipality=dict(re.findall(r'^  "([^"]+)": ([^\s#]+)',(ROOT.parent/'aiargent/config/municipalities.yaml').read_text('utf-8'),re.M))
    meta={}
    for p in (ROOT.parent/'toyama-trip-prototype').glob('spot_info*.json'): meta.update(json.loads(p.read_text('utf-8')))
    rows=[]
    for i,name in enumerate(new,1):
        old_name=next((s for s in old if norm(s)==norm(name)),'')
        a,b,c,d,note=PRIORS[name]
        rows.append(dict(spot_id=f'tym{i:03}',name=name,municipality=municipality[name],existed_before_revision=bool(old_name),available_from='2025-04-28' if old_name else '2026-04-01',available_to='',old_option=old_name,new_option=name,source_column='訪問先_'+name,prior_axis1=a,prior_axis2=b,prior_axis3=c,prior_axis4=d,notes=note+'。軸4は知名度の編集上の仮説で要確認。',prior_status='draft_pending_review',source_url=meta[name]['url']))
    path.parent.mkdir(parents=True,exist_ok=True)
    with path.open('w',encoding='utf-8-sig',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=rows[0]); writer.writeheader(); writer.writerows(rows)
    print('Created 47 draft spots; 21 existing, 26 added.')

if __name__=='__main__': main()
