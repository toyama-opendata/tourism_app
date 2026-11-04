// 回答: 5=とてもそう思う … 1=まったくそう思わない。
// direction=-1 は逆転項目。軸内の順番を変える場合はGAS検証も同期してください。
export const axes = [
  { left: 'N', right: 'C', leftLabel: '自然派', rightLabel: '街・文化派' },
  { left: 'A', right: 'R', leftLabel: 'アクティブ', rightLabel: 'のんびり' },
  { left: 'G', right: 'E', leftLabel: 'グルメ・買い物', rightLabel: '体験・交流' },
  { left: 'M', right: 'H', leftLabel: '定番', rightLabel: '穴場' },
] as const;
export const questions = [
  { id: 'q1', axis: 0, direction: 1, text: '旅先では、山や海などの広い景色を眺めたい。' },
  { id: 'q2', axis: 0, direction: 1, text: '街の中心部より、自然に囲まれた場所に心がひかれる。' },
  { id: 'q3', axis: 0, direction: 1, text: '季節の花や木々の変化を楽しむ時間をつくりたい。' },
  { id: 'q4', axis: 0, direction: -1, text: '建築や美術、その土地の歴史を知ることが旅の楽しみだ。' },
  { id: 'q5', axis: 0, direction: -1, text: 'その土地の暮らしが感じられる街並みや建物を、じっくり見て回りたい。' },
  { id: 'q6', axis: 1, direction: 1, text: '旅先では、歩いたり体を動かしたりして過ごしたい。' },
  { id: 'q7', axis: 1, direction: 1, text: '少し移動に手間がかかっても、見たい場所には出かけたい。' },
  { id: 'q8', axis: 1, direction: 1, text: '旅の一日には、いくつかの楽しみを組み込みたい。' },
  { id: 'q9', axis: 1, direction: -1, text: '予定を詰めず、一つの場所でゆっくり過ごす旅が好きだ。' },
  { id: 'q10', axis: 1, direction: -1, text: '旅先では、何もしないでくつろぐ時間も大切にしたい。' },
  { id: 'q11', axis: 2, direction: 1, text: 'その土地ならではの料理を食べることは、旅の大きな目的だ。' },
  { id: 'q12', axis: 2, direction: 1, text: '市場やお店を巡って、気に入った品を探すのが好きだ。' },
  { id: 'q13', axis: 2, direction: 1, text: '旅を振り返ると、おいしかったものや買ったものをよく思い出す。' },
  { id: 'q14', axis: 2, direction: -1, text: '食事や買い物よりも、ものづくりや地元の人との交流に時間を使いたい。' },
  { id: 'q15', axis: 2, direction: -1, text: '旅のおみやげを選ぶより、その土地ならではの体験に参加したい。' },
  { id: 'q16', axis: 3, direction: 1, text: '初めて行く地域では、まず代表的な名所を訪ねたい。' },
  { id: 'q17', axis: 3, direction: 1, text: '多くの人がすすめる場所は、自分でも体験してみたい。' },
  { id: 'q18', axis: 3, direction: 1, text: '旅の行き先を決めるとき、よく知られた場所を候補にする。' },
  { id: 'q19', axis: 3, direction: -1, text: '知名度が低くても、自分だけのお気に入りになりそうな場所を探したい。' },
  { id: 'q20', axis: 3, direction: -1, text: '定番コースから少し外れて、あまり紹介されていない場所にも立ち寄りたい。' },
] as const;
// 表示順は否定→肯定。各回答の得点は変更しない。
export const choices = [
  { value: 1, label: 'まったくそう思わない' },
  { value: 2, label: 'あまりそう思わない' },
  { value: 3, label: 'どちらともいえない' },
  { value: 4, label: 'ややそう思う' },
  { value: 5, label: 'とてもそう思う' },
];

export const questionsPerPage = 5;
