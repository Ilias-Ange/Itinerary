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

## 旅程を手で編集するとき

作業用の平文データは `data/private-trip.local.js` に置きます。このファイルは `.gitignore` 済みなので、GitHub Pages には公開されません。

1. `data/private-trip.local.js` の `window.PRIVATE_TRIP_SOURCE` を編集します。
2. `node tools/encrypt-private-trip.js data/private-trip.local.js 0000` を実行します。
3. 生成された `data/private-trip.enc.js` と更新された `schedule.html` をコミットしてpushします。

地図リンクや宿泊先など、伏せたい情報は `data/private-trip.local.js` 側に書き、暗号化してから公開します。

## ローカル確認

```powershell
python -m http.server 3000
```

ブラウザで `http://localhost:3000/` を開きます。

## GitHub Pages

GitHubのリポジトリ設定で、Pagesの公開元を `main` ブランチの `/` に設定します。
