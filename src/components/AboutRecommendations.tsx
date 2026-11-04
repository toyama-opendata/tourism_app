import type { Ref } from 'react';


const steps = [
  {code:'NAGM',color:'#38665c',title:'20問で、あなたの「好き」を知る',text:'自然を眺めたい？ 街を歩きたい？ いつもの旅の好みを4つの切り口で整理し、あなたの旅タイプを見つけます。'},
  {code:'NREM',color:'#467b90',title:'観光アンケートから、旅の傾向を発見',text:'「どこへ行った？」「何を楽しみに来た？」という声を場所ごとに集計。自然を楽しむ人が多い場所など、それぞれの傾向を探します。'},
  {code:'CREH',color:'#7c6486',title:'あなたに似合う行き先をご提案',text:'あなたの好みと、データから見えた傾向、観光地の特徴を照らし合わせて3か所をご紹介。気になる場所から、次の旅を想像してみてください。'},
];

export function AboutRecommendations({heading,onStart}:{heading:Ref<HTMLHeadingElement>;onStart:()=>void}){
  return <article className="about-page about-short">
    <header className="about-heading"><p className="eyebrow">おすすめが見つかるまで</p><h1 ref={heading} tabIndex={-1}>あなたの「好き」と、<br/>旅した人の声をつなぐ。</h1><p className="lead">おすすめのヒントはアンケートから。<br/>実際に富山に来た人の声からあなたに似合う旅を提案します。</p></header>
    <div className="about-story">{steps.map((step,i)=><section className="about-story-step" key={step.code}><div className="about-portrait"><img src={import.meta.env.BASE_URL+'images/about/step-'+(i+1)+'.png'} alt={['スマホを片手に旅の好みを考えるキャラクター','アンケートを集計して発見するキャラクター','地図を広げて行き先を提案するキャラクター'][i]} width={1254} height={1254}/></div><div><p className="eyebrow">STEP {String(i+1).padStart(2,'0')}</p><h2>{step.title}</h2><p>{step.text}</p></div></section>)}</div>
    <div className="about-actions"><button className="button primary" onClick={onStart}>自分に似合う旅を見つける →</button><a className="text-button" href={import.meta.env.BASE_URL}>トップへ戻る</a></div>
    <p className="about-source-compact">出典：「富山県観光ウェブアンケートデータ」（CC BY 4.0）を加工して使用。<a href={import.meta.env.BASE_URL+'#privacy'}>データの取り扱い →</a></p>
  </article>;
}

