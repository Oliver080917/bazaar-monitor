# Skyblock Bazaar Monitor

实时查看 Hypixel SkyBlock Bazaar 商品价格的监控应用。

## 本地运行

```bash
npm install
npm start
```

打开 http://localhost:3000

需要 `HYPIXEL_API_KEY`（放在 `.env` 里）。没有 key 时自动使用模拟数据。

## 部署到 Render（免费）

1. **推代码到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "init"
   # 在 github.com 新建一个仓库，然后：
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git push -u origin main
   ```

2. **在 Render 创建服务**
   - 登录 https://render.com → New → **Web Service**
   - 连接你的 GitHub 仓库，选择该仓库
   - Render 会自动识别（runtime: node, start: `npm start`），直接 Deploy 即可

3. **配置 API Key（必须，否则显示模拟数据）**
   - 服务部署后，进 **Dashboard → 你的服务 → Environment**
   - 添加变量 `HYPIXEL_API_KEY`，值填你的 Hypixel API key
   - 保存后会自动重新部署

4. 部署完成后访问 Render 给你的 `https://xxx.onrender.com` 网址

## 说明

- 收藏和历史数据存在服务器本地磁盘，免费套餐在重新部署后会重置
- `data/npc-prices.json` 是 NPC 售卖价静态数据（来自 NotEnoughUpdates 仓库）
