window.TRIP_DATA = {
  title: "旅行のしおり",
  dates: "旅程はパスフレーズで確認",
  destination: "旅程ロック中",
  meeting: {
    label: "旅程",
    date: "",
    time: "",
    placeLabel: "旅程ページで確認",
    memo: "日付、集合、移動、宿泊、帰路など旅程に関する情報はすべて旅程ページにまとめています。"
  },
  days: [],
  packing: [
    {
      category: "必ず持つ",
      items: ["財布", "スマートフォン", "充電器", "交通系ICカード", "身分証", "健康保険証"]
    },
    {
      category: "長旅の安心",
      items: ["モバイルバッテリー", "常備薬", "酔い止め", "折りたたみ傘", "羽織もの", "タオル"]
    },
    {
      category: "あると楽しい",
      items: ["カメラ", "歩きやすい靴", "日焼け止め", "小さめのノート", "おやつ", "エコバッグ"]
    }
  ],
  links: [
    {
      label: "地図",
      url: "https://www.google.com/maps",
      memo: "行き先は旅程ページで確認してから開きます。"
    },
    {
      label: "天気予報",
      url: "https://www.jma.go.jp/bosai/forecast/",
      memo: "出発前と当日の服装確認に使います。"
    },
    {
      label: "交通情報",
      url: "https://www.jorudan.co.jp/",
      memo: "列車や乗換の確認に使います。"
    }
  ],
  notes: [
    "旅程に関する情報は、公開ページには載せません。",
    "日付、集合、移動、宿泊、帰路は旅程ページでパスフレーズを入れて確認します。",
    "公開側は持ち物と汎用リンクだけを置きます。"
  ]
};
