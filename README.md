# 旅行のしおり

GitHub Pagesで公開しやすい、ビルド不要の旅行しおりテンプレートです。

## 編集方法

旅行の内容は `data/trip-data.js` の `window.TRIP_DATA` を編集します。

- `title`: しおりのタイトル
- `dates`: 表示用の日程
- `destination`: 旅先の表示名
- `meeting`: 集合情報
- `days`: 日ごとの予定
- `packing`: 持ち物チェックリスト
- `links`: 当日見るリンク
- `notes`: 公開ページ上の注意メモ

公開ページにする前提なので、予約番号、個人名、電話番号、詳しい住所は入れない運用がおすすめです。

## 内緒メモ

`private.html` は `data/private-trip.enc.js` の暗号化データをブラウザ内で復号します。
パスフレーズはリポジトリに保存しません。

公開リポジトリに平文の私的情報を置かないため、暗号化前のJSONなどを作る場合はコミットしないでください。

## ローカル確認

```powershell
python -m http.server 3000
```

ブラウザで `http://localhost:3000/` を開きます。

## GitHub Pages

GitHubのリポジトリ設定で、Pagesの公開元を `main` ブランチの `/` に設定します。
