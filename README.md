---
noteId: "bed17f80492e11f1a5ddb1ec935416a5"
tags: []

---

# NeedU App

NeedU 是一个给异地情侣使用的轻量 Web App，用来记录日记、相册、重要日子和恋爱天数。

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 部署到 Vercel

1. 将代码推送到 GitHub。
2. 在 Vercel 导入该仓库。
3. Framework Preset 选择 `Vite`。
4. Build Command 使用 `npm run build`。
5. Output Directory 使用 `dist`。
6. 在 Vercel 环境变量里配置：

```env
VITE_SUPABASE_URL=你的 Supabase Project URL
VITE_SUPABASE_ANON_KEY=你的 Supabase anon public key
```

如果修改了 `supabase/schema.sql` 或 `supabase/policies.sql`，需要在 Supabase SQL Editor 里重新执行对应 SQL。
