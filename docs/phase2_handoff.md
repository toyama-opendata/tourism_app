# フェーズ2 実装と確認

## 起動

Node.js 22.12以降を使用します。プロジェクト直下で `npm ci`、`npm run dev`。表示されたローカルURLを開いてください。静的な確認は `npm run build` → `npm run preview`。ファイルをダブルクリックして開く方式ではありません。

## 実装範囲

- 16問、各軸4問・逆転項目あり。1問ずつ、戻る、回答保持、進捗、5段階。
- 任意属性、同意、診断結果、4軸のバランス表示、16タイプ一覧・紹介。
- 重み付き内積＋市町村ペナルティの上位3件。タイプ代表ベクトルで重複しない追加3件。
- 16タイプ名・説明・旅の傾向・ヒントと、独自の図形キャラクター。
- 観光地画像がない場合はプレースホルダー。
- Xシェア、コピー、再診断。共有URLに回答・属性を含めない。
- ビルド時に16個の `types/{code}/index.html` と1200×630のタイプ別OGP PNGを生成。JavaScript実行前から個別メタタグと紹介本文を持つ。
- GASの検証、排他ロック、イベントID重複防止。詳細は `gas_setup.md`。
- mainへのpushでGitHub Pagesへビルド・デプロイするActions。

## 公開先は未設定

ユーザー回答に従い、リポジトリは作成・変更していません。新しいリポジトリが決まったら、このプロジェクトだけを配置し、PagesのSourceをGitHub Actionsに設定してください。Actionsの `configure-pages` 出力からBASE_PATHとSITE_URLを自動設定します。元回答や `business` 全体はアップロードしません。

ローカルビルドは相対OGP URL。本番ビルドは絶対URLを使います。ローカルURLは他の人から参照できないため、XでのOGP取得確認は公開後に必要です。

GAS未設定時は同意の有無によらず送信しません。GASを設定した後も、保存成功はシート側で確認します。Googleアカウント・スプレッドシートの作成や外部Webアプリの公開は実施していません。

## データ更新

`python scripts/build_data.py` で確認用CSVと `public/data/spots.json` が同時に更新されます。コード化済みCSVを `data/raw/kanko_data.csv` に置いた場合はこれを優先し、ない場合は従来の統合済みXLSXを読みます。別の入力は `--input` で指定できます。CSVは元アンケートの文字列形式ではなく、同じコード化済み列を持つものです。

前処理の依存は `requirements.txt`。更新後、JSONをコミットしてpushすると静的アプリに反映されます。Actionsでは個票を読まず、コミットされた公開集計だけを使用します。前処理コードは個票・自由記述を公開JSONに出しません。

軸1〜3とk=30は現行式を維持しています。アルペンルートの「のんびり」等、施設の一般的特徴とのずれは残っています。穴場判定は改訂版で、称名滝はユーザー確認により定番側。質問・逆転項目は `src/content/questions.ts`、タイプ文は `src/content/types.ts`、重み・多様性ペナルティは `src/lib/diagnosis.ts` にあります。

## 画像

- キャラクター：`public/images/types/nagm.png` のように小文字コードでPNGを配置。未配置は独自SVG。
- 観光地：`public/images/spots/tym022.jpg` のようにマスターIDでJPEGを配置。未配置は「写真は準備中」のイラスト。
- PNG/JPEGの拡張子を変更するだけの変換は不可。変更後は再ビルドしてください。
- 2026-11-01のユーザー指示により、既存アプリから40か所の写真を転用しました。WebPを無加工・再圧縮なしでコピーし、名称一致で今回のIDに対応付けています。詳細は `photo-reuse.json`。
- `{spot_id}.jpg` があれば優先し、ない場合は転用した `{spot_id}.webp` を表示します。どちらもない7か所はプレースホルダー。元のクレジット情報は保持しています（元アプリでは空欄・確認中）。

## 検証コマンド

```text
npm test
npm run test:ui
npm run build
npm run verify:dist
python -m pytest -q
```

実ブラウザでのスマホ表示、GASの実保存、GitHub Actionsの実デプロイ、XのOGP取得は別途確認が必要です。フェーズ3でREADME整備・実環境での最終確認を行います。

## 2026-10-31の確認結果

- TypeScript型検査とVite本番ビルド：成功。
- Python集計テスト：20件成功。
- `python scripts/build_data.py` の一括実行で公開JSONまで再生成できることを確認。既存の公開JSONとSHA-256が一致しました。
- 診断・公開データ・送信制御・GASのテスト：10件成功。
- DOM環境の画面操作テスト：2件成功。全16問、戻る時の回答保持、属性スキップ、結果、個人情報説明からの復帰、再診断、同意、年代0・同行者0、クリック送信と停止を確認。
- 16タイプ全てへの到達と、おすすめ6件の重複なしを確認。
- 16個の静的ページと1200×630 PNG、個別OGPメタ情報、個票を含まない配信物を検査。
- リポジトリ名付きのテスト用BASE_PATHと絶対SITE_URLによるビルド検証：成功。その後ローカル用のルートパスでビルドし直しています。テスト用URLへの公開はしていません。
- NAGMのOGP画像を目視確認。日本語・文字の収まり・キャラクター描画を確認。
- ローカルHTTPの200応答を確認。一方、アプリ内ブラウザ操作ツールは「failed to write kernel assets / 指定されたパスが見つかりません」で起動できず、実ブラウザのスクリーンショット・スマホ実機確認は未実施です。DOMテストは見た目やタッチ操作の保証にはなりません。
- GitHub Pagesの公開先およびGASの実URLは未設定。外部への公開・回答送信は実施していません。

参照：[Vite公式 GitHub Pages手順](https://vite.dev/guide/static-deploy)、[GitHub Pages公開元の設定](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。
