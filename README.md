# 旅行のしおり

GitHub Pagesで公開する、旅行しおりの静的サイトです。

## 構成

- `index.html`: 入口ページ
- `schedule.html`: パスフレーズで開く暗号化された旅程
- `packing.html`: 持ち物チェックリスト
- `links.html`: 汎用リンク
- `data/trip-data.js`: 公開してよい表示データ
- `data/private-trip.enc.js`: 暗号化された旅程データ

旅程に関する日付、集合、移動、宿泊、帰路などは `schedule.html` に一本化しています。

## 暗号化された旅程

`schedule.html` は `data/private-trip.enc.js` の暗号化データをブラウザ内で復号します。
パスフレーズはリポジトリに保存しません。

公開リポジトリに平文の私的情報を置かないため、暗号化前のJSONなどを作る場合はコミットしないでください。

## ローカル確認

```powershell
python -m http.server 3000
```

ブラウザで `http://localhost:3000/` を開きます。

## GitHub Pages

GitHubのリポジトリ設定で、Pagesの公開元を `main` ブランチの `/` に設定します。
