export const user = {
  nickname: "小满",
  city: "上海",
  email: "xiaoman@needu.app",
};

export const partner = {
  nickname: "阿遥",
  city: "杭州",
};

export const anniversaries = [
  { id: "a1", title: "一周年", date: "2027-02-14", hint: "距离一周年还有 298 天" },
  { id: "a2", title: "第一次见面", date: "2026-07-18", hint: "距离第一次见面还有 87 天" },
  { id: "a3", title: "100 天", date: "2026-05-20", hint: "今天就是你们的 100 天纪念日" },
];

export const diaryList = [
  {
    id: "d1",
    author: "阿遥",
    date: "2026-04-21",
    mood: "想你",
    summary: "今天下班的时候突然下雨了，我站在地铁口想起你以前总会提醒我带伞。",
  },
  {
    id: "d2",
    author: "小满",
    date: "2026-04-20",
    mood: "开心",
    summary: "今天把你寄来的明信片夹进了手帐里，突然觉得这一整周都被点亮了。",
  },
];

export const diaryDetail = {
  author: "阿遥",
  date: "2026-04-21",
  mood: "想你",
  content: [
    "今天下班的时候突然下雨了，我站在地铁口想起你以前总会提醒我带伞。",
    "回家之后把视频通话截图又翻了一遍，觉得平凡的一天也被你照亮了。",
    "等下次见面，我们去吃那家一直没去成的面馆吧。",
  ].join("\n\n"),
  reply: {
    author: "小满",
    content: "以后下雨我也会继续提醒你。那家面馆也记住了，等见面我们一起去。",
    time: "21:36",
  },
};

export const albumEntries = [
  {
    id: "p1",
    date: "2026-04-21",
    note: "通话结束前你比了一个有点傻的心。",
    author: "阿遥",
  },
  {
    id: "p2",
    date: "2026-04-19",
    note: "今天的晚安截图也留住了。",
    author: "小满",
  },
];
