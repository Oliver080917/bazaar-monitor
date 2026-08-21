// 生成 data/recipes.json：从 NEU 仓库拉取 Bazaar 商品的合成配方
// 数据源：NotEnoughUpdates/NotEnoughUpdates-REPO 的 items/<ID>.json（jsDelivr CDN）
// 用法：node scripts/build-recipes.js（需 .env 有 HYPIXEL_API_KEY）
// 说明：Hypixel 官方 resources/skyblock/items 端点不含配方字段，NEU 是唯一可靠源。

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const os = require('os');

const API_KEY = process.env.HYPIXEL_API_KEY || '';
const HYPIXEL_API_BASE = 'https://api.hypixel.net/v2';
const NEU_BASE = 'https://cdn.jsdelivr.net/gh/NotEnoughUpdates/NotEnoughUpdates-REPO@master/items';
const CONCURRENCY = 15;
const RETRIES = 3;
// 原始 NEU 文件缓存，避免重复拉取（临时目录，不入库）
const CACHE_DIR = path.join(os.tmpdir(), 'bazaar-neu-cache');

function cachedRead(file) {
  try {
    return JSON.parse(fs.readFileSync(path.join(CACHE_DIR, file + '.json'), 'utf8'));
  } catch {
    return null;
  }
}

function cachedWrite(file, json) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(path.join(CACHE_DIR, file + '.json'), JSON.stringify(json));
  } catch {}
}

async function fetchJson(url, { retries = RETRIES } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, attempt * 500));
    }
  }
}

async function mapWithConcurrency(items, limit, worker) {
  const results = [];
  let index = 0;
  async function run() {
    while (index < items.length) {
      const i = index++;
      results[i] = await worker(items[i]);
    }
  }
  await Promise.all(Array.from({ length: limit }, run));
  return results;
}

async function main() {
  if (!API_KEY) {
    console.error('缺少 HYPIXEL_API_KEY（.env）');
    process.exit(1);
  }

  console.log('拉取 Bazaar 商品列表...');
  const bazaarRes = await fetch(`${HYPIXEL_API_BASE}/skyblock/bazaar`, {
    headers: { 'API-Key': API_KEY },
    signal: AbortSignal.timeout(20000)
  });
  const bazaarData = await bazaarRes.json();
  if (!bazaarData.success) throw new Error('Bazaar 接口失败');
  const productIds = Object.keys(bazaarData.products);
  console.log(`Bazaar 商品数: ${productIds.length}`);

  const idSet = new Set(productIds);

  console.log(`并发拉取 NEU 物品文件（${CONCURRENCY} 并发，${CONCURRENCY > 10 ? '' : ''}可能需要 1-2 分钟）...`);
  const results = await mapWithConcurrency(productIds, CONCURRENCY, async (id) => {
    const file = id.replace(/:/g, '-');
    let neu = cachedRead(file);
    if (!neu) {
      try {
        neu = await fetchJson(`${NEU_BASE}/${file}.json`);
      } catch (err) {
        return { id, neu: null, error: true };
      }
      if (neu) cachedWrite(file, neu);
    }
    return { id, neu };
  });

  const recipes = {};
  let withRecipe = 0, skippedMissingMaterial = 0, noRecipe = 0, fetchFailed = 0;

  for (const { id, neu, error } of results) {
    if (error) { fetchFailed++; continue; }
    if (!neu) { noRecipe++; continue; }

    // 收集候选配方：单数 recipe（3x3 对象，产出 1）或复数 recipes（数组，每条可带 count）
    const candidates = [];
    if (neu.recipe && typeof neu.recipe === 'object' && !Array.isArray(neu.recipe)) {
      candidates.push({ grid: neu.recipe, count: 1 });
    }
    if (Array.isArray(neu.recipes)) {
      for (const r of neu.recipes) {
        if (r && typeof r === 'object') {
          const hasGrid = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'].some(k => r[k] !== undefined);
          if (hasGrid) candidates.push({ grid: r, count: r.count || 1 });
        }
      }
    }
    if (candidates.length === 0) { noRecipe++; continue; }

    const parsedVariants = [];
    for (const { grid, count } of candidates) {
      const ingredients = [];
      let valid = true;

      // 只取 3x3 格子的 9 个键，忽略 type/count 等附加字段
      for (const key of ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3']) {
        const slot = grid[key];
        if (!slot) continue;
        // 个别格子值不是字符串（结构数据），无法按纯材料计算，整条配方丢弃
        if (typeof slot !== 'string') { valid = false; break; }
        let raw, slotCount;
        const idx = slot.lastIndexOf(':');
        if (idx === -1) { raw = slot; slotCount = 1; }
        else { raw = slot.slice(0, idx); slotCount = parseInt(slot.slice(idx + 1), 10) || 1; }

        // 材料 ID 规范化：NEU 文件名把 bazaar 的 ':' 写成 '-'，还原成 bazaar 正式 ID
        let matId = idSet.has(raw) ? raw : null;
        if (!matId) {
          const restored = raw.replace(/-/g, ':');
          if (idSet.has(restored)) matId = restored;
        }
        if (!matId) { valid = false; break; }

        ingredients.push({ id: matId, count: slotCount });
      }

      if (!valid) continue;

      // 同材料多格合并数量（如 5 格 CARROT_ITEM:32 → 160）
      const merged = [];
      for (const ing of ingredients) {
        const ex = merged.find(m => m.id === ing.id);
        if (ex) ex.count += ing.count;
        else merged.push({ ...ing });
      }

      parsedVariants.push({ count, ingredients: merged });
    }

    if (parsedVariants.length === 0) { skippedMissingMaterial++; continue; }

    recipes[id] = { crafttext: neu.crafttext || null, recipes: parsedVariants };
    withRecipe++;
  }

  const out = path.join(__dirname, '..', 'data', 'recipes.json');
  fs.writeFileSync(out, JSON.stringify(recipes, null, 2));
  console.log(`完成: 有配方 ${withRecipe} | 材料不在Bazaar丢弃 ${skippedMissingMaterial} | 无配方 ${noRecipe} | 拉取失败 ${fetchFailed}`);
  console.log(`输出: ${out} (${(fs.statSync(out).size / 1024).toFixed(1)} KB)`);
}

main().catch(err => { console.error(err); process.exit(1); });
