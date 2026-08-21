// EdgeOne 云函数处理器（零依赖，仅用 Node 内置 + 全局 fetch）
// 源文件 —— 构建时由 scripts/build-edgeone.js 内联 npcPrices 后生成 cloud-functions/api/[[default]].js
// 注意：EdgeOne 函数运行时不装 node_modules，不能用 express/axios/cors/dotenv

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const API_KEY = process.env.HYPIXEL_API_KEY || '';
const HYPIXEL_API_BASE = 'https://api.hypixel.net/v2';
const USE_MOCK_DATA = !API_KEY;

let bazaarCache = { data: null, lastUpdated: null };
const CACHE_DURATION = 60 * 1000;

const PRODUCT_NAME_OVERRIDES = {
  'SAND:1': 'Red Sand',
  'LOG:1': 'Spruce Log',
  'LOG:2': 'Birch Log',
  'LOG:3': 'Jungle Log',
  'LOG_2': 'Acacia Log',
  'LOG_2:1': 'Dark Oak Log',
  'INK_SACK:3': 'Cocoa Beans',
  'INK_SACK:4': 'Lapis Lazuli',
  'RAW_FISH:1': 'Raw Salmon',
  'RAW_FISH:2': 'Raw Clownfish',
  'RAW_FISH:3': 'Pufferfish'
};

function formatProductName(productId) {
  if (PRODUCT_NAME_OVERRIDES[productId]) return PRODUCT_NAME_OVERRIDES[productId];
  return productId
    .replace(/_/g, ' ')
    .replace(/(\d+)/g, ' $1')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

function formatProduct(productId, product) {
  const quickStatus = product.quick_status;
  const npc = npcPrices[productId];
  return {
    id: productId,
    name: formatProductName(productId),
    buyPrice: Math.round((quickStatus.buyPrice || 0) * 100) / 100,
    sellPrice: Math.round((quickStatus.sellPrice || 0) * 100) / 100,
    buyOrders: quickStatus.buyOrders || 0,
    sellOrders: quickStatus.sellOrders || 0,
    buyVolume: quickStatus.buyVolume || 0,
    sellVolume: quickStatus.sellVolume || 0,
    npcBuyPrice: npc ? npc.perUnit : null,
    npcSource: npc ? npc.npc : null,
    history: product.history || []
  };
}

// 无 API key 时的兜底假数据（精简版）
function generateMockData() {
  const mockProducts = {
    'ENCHANTED_DIAMOND': { buyPrice: 12500, sellPrice: 10200, buyVolume: 150000, sellVolume: 180000, buyOrders: 45, sellOrders: 120 },
    'ENCHANTED_GOLD': { buyPrice: 2800, sellPrice: 2400, buyVolume: 320000, sellVolume: 350000, buyOrders: 89, sellOrders: 210 },
    'ENCHANTED_IRON': { buyPrice: 450, sellPrice: 380, buyVolume: 890000, sellVolume: 920000, buyOrders: 230, sellOrders: 450 },
    'ENCHANTED_COAL': { buyPrice: 180, sellPrice: 150, buyVolume: 1200000, sellVolume: 1150000, buyOrders: 520, sellOrders: 680 },
    'ENCHANTED_REDSTONE': { buyPrice: 95, sellPrice: 78, buyVolume: 980000, sellVolume: 1020000, buyOrders: 380, sellOrders: 420 },
    'ENCHANTED_LAPIS_LAZULI': { buyPrice: 220, sellPrice: 185, buyVolume: 750000, sellVolume: 780000, buyOrders: 290, sellOrders: 350 },
    'ENCHANTED_EMERALD': { buyPrice: 18500, sellPrice: 15200, buyVolume: 85000, sellVolume: 92000, buyOrders: 28, sellOrders: 65 },
    'DRAGON_BREATH': { buyPrice: 180, sellPrice: 145, buyVolume: 450000, sellVolume: 480000, buyOrders: 180, sellOrders: 250 },
    'MAGMA_CREAM': { buyPrice: 280, sellPrice: 220, buyVolume: 680000, sellVolume: 720000, buyOrders: 320, sellOrders: 450 },
    'BLAZE_ROD': { buyPrice: 680, sellPrice: 550, buyVolume: 220000, sellVolume: 250000, buyOrders: 145, sellOrders: 190 },
    'GHAST_TEAR': { buyPrice: 1850, sellPrice: 1500, buyVolume: 28000, sellVolume: 35000, buyOrders: 22, sellOrders: 35 },
    'SPIDER_EYE': { buyPrice: 85, sellPrice: 65, buyVolume: 380000, sellVolume: 420000, buyOrders: 220, sellOrders: 280 },
    'SLIME_BALL': { buyPrice: 145, sellPrice: 115, buyVolume: 420000, sellVolume: 450000, buyOrders: 240, sellOrders: 320 },
    'PRISMARINE_SHARD': { buyPrice: 95, sellPrice: 75, buyVolume: 380000, sellVolume: 420000, buyOrders: 220, sellOrders: 280 },
    'SEA_LANTERN': { buyPrice: 1450, sellPrice: 1200, buyVolume: 55000, sellVolume: 65000, buyOrders: 42, sellOrders: 65 },
    'ICE': { buyPrice: 85, sellPrice: 65, buyVolume: 420000, sellVolume: 480000, buyOrders: 250, sellOrders: 320 },
    'SNOW_BALL': { buyPrice: 25, sellPrice: 18, buyVolume: 1200000, sellVolume: 1350000, buyOrders: 650, sellOrders: 780 },
    'WITHER_SKELETON_SKULL': { buyPrice: 4200, sellPrice: 3500, buyVolume: 15000, sellVolume: 18000, buyOrders: 18, sellOrders: 28 },
    'GOLDEN_DRAGON_EGG': { buyPrice: 25000000, sellPrice: 22000000, buyVolume: 5, sellVolume: 8, buyOrders: 2, sellOrders: 3 },
    'ENCHANTED_DIAMOND_BLOCK': { buyPrice: 112000, sellPrice: 98000, buyVolume: 12000, sellVolume: 15000, buyOrders: 8, sellOrders: 22 }
  };

  const result = {};
  const now = Date.now();
  for (const [id, data] of Object.entries(mockProducts)) {
    const history = [];
    for (let i = 168; i >= 0; i--) {
      const hourAgo = now - (i * 60 * 60 * 1000);
      const randomVariation = (Math.random() - 0.5) * 0.2;
      history.push({
        timestamp: new Date(hourAgo).toISOString(),
        buyPrice: Math.round(data.buyPrice * (1 + randomVariation)),
        sellPrice: Math.round(data.sellPrice * (1 + randomVariation)),
        buyOrders: data.buyOrders + Math.floor(Math.random() * 20 - 10),
        sellOrders: data.sellOrders + Math.floor(Math.random() * 30 - 15)
      });
    }
    result[id] = {
      product_id: id,
      quick_status: {
        buyPrice: data.buyPrice,
        sellPrice: data.sellPrice,
        buyVolume: data.buyVolume,
        sellVolume: data.sellVolume,
        buyOrders: data.buyOrders,
        sellOrders: data.sellOrders
      },
      history: history
    };
  }
  return result;
}

async function fetchBazaarData() {
  if (USE_MOCK_DATA) return generateMockData();

  if (bazaarCache.data && bazaarCache.lastUpdated) {
    if (Date.now() - bazaarCache.lastUpdated < CACHE_DURATION) return bazaarCache.data;
  }

  const res = await fetch(`${HYPIXEL_API_BASE}/skyblock/bazaar`, {
    headers: { 'API-Key': API_KEY },
    signal: AbortSignal.timeout(10000)
  });
  const data = await res.json();
  if (!data.success) throw new Error('Failed to fetch Bazaar data from Hypixel API');

  bazaarCache.data = data.products;
  bazaarCache.lastUpdated = Date.now();
  return bazaarCache.data;
}

// 内存态收藏/历史（serverless 无持久文件系统）
const memoryStore = { history: {}, favorites: [] };

function getHistory(productId) {
  return memoryStore.history[productId] || [];
}

function saveToHistory(productId, priceData) {
  if (!memoryStore.history[productId]) memoryStore.history[productId] = [];
  memoryStore.history[productId].push({
    timestamp: new Date().toISOString(),
    buyPrice: priceData.buyPrice,
    sellPrice: priceData.sellPrice,
    buyOrders: priceData.buyOrders,
    sellOrders: priceData.sellOrders
  });
}

function getFavorites() {
  return memoryStore.favorites;
}

function addFavorite(productId) {
  if (!memoryStore.favorites.includes(productId)) memoryStore.favorites.push(productId);
  return memoryStore.favorites;
}

function removeFavorite(productId) {
  memoryStore.favorites = memoryStore.favorites.filter(f => f !== productId);
  return memoryStore.favorites;
}

function getAllHistory() {
  return memoryStore.history;
}

function exportAsCSV() {
  let csv = 'Product ID,Timestamp,Buy Price,Sell Price,Buy Orders,Sell Orders\n';
  for (const [productId, entries] of Object.entries(memoryStore.history)) {
    for (const entry of entries) {
      csv += `${productId},${entry.timestamp},${entry.buyPrice},${entry.sellPrice},${entry.buyOrders},${entry.sellOrders}\n`;
    }
  }
  return csv;
}

function setCors(res) {
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);
}

function sendJson(res, status, body) {
  res.statusCode = status;
  setCors(res);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function handleRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    setCors(res);
    res.end();
    return;
  }

  // EdgeOne 云函数转发 /api/* 时会剥离 /api 前缀（函数内 req.url 为 /products），补回
  let rawUrl = req.url || '/';
  if (!rawUrl.startsWith('/api')) rawUrl = '/api' + rawUrl;

  let url;
  try {
    url = new URL(rawUrl, 'http://localhost');
  } catch {
    return sendJson(res, 400, { success: false, error: 'Bad request' });
  }
  const p = url.pathname;
  const method = req.method;

  try {
    if (method === 'GET' && p === '/api/products') {
      const products = await fetchBazaarData();
      const formatted = Object.entries(products).map(([id, data]) => formatProduct(id, data));
      formatted.sort((a, b) => b.buyVolume - a.buyVolume);
      return sendJson(res, 200, { success: true, data: formatted, lastUpdated: bazaarCache.lastUpdated });
    }

    if (method === 'GET' && p.startsWith('/api/product/')) {
      const productId = p.slice('/api/product/'.length).toUpperCase();
      const products = await fetchBazaarData();
      if (!products[productId]) return sendJson(res, 404, { success: false, error: 'Product not found' });
      const formatted = formatProduct(productId, products[productId]);
      if (!formatted.history || formatted.history.length === 0) formatted.history = getHistory(productId);
      return sendJson(res, 200, { success: true, data: formatted });
    }

    if (method === 'GET' && p.startsWith('/api/history/')) {
      const productId = p.slice('/api/history/'.length).toUpperCase();
      return sendJson(res, 200, { success: true, data: getHistory(productId) });
    }

    if (method === 'GET' && p === '/api/favorites') {
      return sendJson(res, 200, { success: true, data: getFavorites() });
    }

    if (method === 'POST' && p.startsWith('/api/favorites/')) {
      const productId = p.slice('/api/favorites/'.length).toUpperCase();
      return sendJson(res, 200, { success: true, data: addFavorite(productId) });
    }

    if (method === 'DELETE' && p.startsWith('/api/favorites/')) {
      const productId = p.slice('/api/favorites/'.length).toUpperCase();
      return sendJson(res, 200, { success: true, data: removeFavorite(productId) });
    }

    if (method === 'GET' && p === '/api/status') {
      return sendJson(res, 200, {
        success: true,
        data: { lastUpdated: bazaarCache.lastUpdated, hasApiKey: !!API_KEY, usingMockData: USE_MOCK_DATA }
      });
    }

    if (method === 'GET' && p === '/api/export') {
      const format = url.searchParams.get('format') || 'json';
      if (format === 'csv') {
        res.statusCode = 200;
        setCors(res);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=bazaar_history.csv');
        return res.end(exportAsCSV());
      }
      return sendJson(res, 200, getAllHistory());
    }

    if (method === 'POST' && p === '/api/save-history') {
      const products = await fetchBazaarData();
      const popular = Object.entries(products)
        .sort((a, b) => (b[1].quick_status?.buyVolume || 0) - (a[1].quick_status?.buyVolume || 0))
        .slice(0, 50);
      for (const [id, data] of popular) {
        saveToHistory(id, {
          buyPrice: data.quick_status?.buyPrice || 0,
          sellPrice: data.quick_status?.sellPrice || 0,
          buyOrders: data.quick_status?.buyOrders || 0,
          sellOrders: data.quick_status?.sellOrders || 0
        });
      }
      return sendJson(res, 200, { success: true, message: 'History saved for ' + popular.length + ' products' });
    }

    return sendJson(res, 404, { success: false, error: 'Not found' });
  } catch (error) {
    return sendJson(res, 500, { success: false, error: error.message });
  }
}
