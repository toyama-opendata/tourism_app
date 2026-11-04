# とやま旅タイプ
20問から旅の好みを診断し、富山の観光アンケートに基づくおすすめを表示する静的Webアプリです。

## ローカル実行
Node.js 22.12以降を使用します。
```sh
npm ci
npm run dev
```
本番ビルドと確認：
```sh
npm test
npm run test:ui
npm run build
npm run verify:dist
npm run preview
```

## GitHub Pagesへ公開
1. このプロジェクト専用のGitHubリポジトリを作成し、プロジェクトをmainブランチへpushします。
2. リポジトリの Settings → Pages → Build and deployment → Source を「GitHub Actions」に設定します。
3. Actionsの「Build and deploy GitHub Pages」を手動実行するか、mainへpushします。
4. 成功するとgithub-pages環境に公開URLが表示されます。

ワークフローがPagesの公開URL・リポジトリ名を読み取り、BASE_PATHとSITE_URLを指定します。通常は手動で書き換える必要はありません。
生の回答データ、.env、node_modules、ローカル監査資料は公開リポジトリに含めません。サイトへ配信するのはdistのみです。

## 回答収集
[Google Apps Scriptの設定](docs/gas_setup.md)に従います。
GitHubの Settings → Secrets and variables → Actions → Variables に VITE_GAS_ENDPOINT を登録し、再デプロイします。
未設定の場合は診断のみ動作し、回答は送信しません。設定後、同意ありの診断でスプレッドシートへの保存を確認してください。

## 月次データ更新
```sh
python -m pip install -r requirements.txt
python scripts/build_data.py
python -m pytest -q
```
data/raw/kanko_data.csv を差し替えて実行します。CSVは採用済みデータセットと同じコード化済み列が必要です。別の入力は --input path/to/file.csv または --input path/to/file.xlsx で指定できます。
公開用の public/data/spots.json を確認してmainへpushするとサイトが更新されます。
data/master/spots_master.csv の手修正を保つため draft_master.py は通常の更新では実行しません。

## 文言・画像の編集
- 質問：src/content/questions.ts
- タイプ名・説明：src/content/types.ts
- おすすめの仕組み：src/components/AboutRecommendations.tsx
- タイプ画像：public/images/types/{小文字のタイプ記号}.png
- 観光地写真：public/images/spots/{spot_id}.jpg（既存WebPより優先）
- 説明ページの画像：public/images/about/step-1.png ～ step-3.png

観光地画像がない場合はプレースホルダーを表示します。タイプPNGがない場合は旧SVGへ切り替わります。画像変更後はビルドするとシェア用画像も更新されます。

## データ出典
「富山県観光ウェブアンケートデータ」（CC BY 4.0）を加工して使用しています。
