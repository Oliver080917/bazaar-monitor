require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const dataStore = require('./dataStore');
const npcPrices = require('../data/npc-prices.json');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Configuration - API Key should be set via environment variable
// Get your API key from https://hypixel.net/developer
const API_KEY = process.env.HYPIXEL_API_KEY || '';
const HYPIXEL_API_BASE = 'https://api.hypixel.net/v2';
const USE_MOCK_DATA = !API_KEY; // Use mock data if no API key

// Cache for Bazaar data
let bazaarCache = {
  data: null,
  lastUpdated: null
};
const CACHE_DURATION = 60 * 1000; // 1 minute cache

// Format product data for frontend
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

// 带数据值（:N 后缀）商品的正确名称，避免被通用格式化拆成 "Sand: 1" 之类的错名
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

// Format product ID to readable name
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

// Generate realistic mock Bazaar data with history
function generateMockData() {
  const mockProducts = {
    'ENCHANTED_DIAMOND': { buyPrice: 12500, sellPrice: 10200, buyVolume: 150000, sellVolume: 180000, buyOrders: 45, sellOrders: 120 },
    'ENCHANTED_GOLD': { buyPrice: 2800, sellPrice: 2400, buyVolume: 320000, sellVolume: 350000, buyOrders: 89, sellOrders: 210 },
    'ENCHANTED_IRON': { buyPrice: 450, sellPrice: 380, buyVolume: 890000, sellVolume: 920000, buyOrders: 230, sellOrders: 450 },
    'ENCHANTED_COAL': { buyPrice: 180, sellPrice: 150, buyVolume: 1200000, sellVolume: 1150000, buyOrders: 520, sellOrders: 680 },
    'ENCHANTED_REDSTONE': { buyPrice: 95, sellPrice: 78, buyVolume: 980000, sellVolume: 1020000, buyOrders: 380, sellOrders: 420 },
    'ENCHANTED_LAPIS_LAZULI': { buyPrice: 220, sellPrice: 185, buyVolume: 750000, sellVolume: 780000, buyOrders: 290, sellOrders: 350 },
    'ENCHANTED_EMERALD': { buyPrice: 18500, sellPrice: 15200, buyVolume: 85000, sellVolume: 92000, buyOrders: 28, sellOrders: 65 },
    'ENCHANTED_DIAMOND_BLOCK': { buyPrice: 112000, sellPrice: 98000, buyVolume: 12000, sellVolume: 15000, buyOrders: 8, sellOrders: 22 },
    'ENCHANTED_GOLD_BLOCK': { buyPrice: 25000, sellPrice: 22000, buyVolume: 28000, sellVolume: 32000, buyOrders: 15, sellOrders: 35 },
    'DRAGON_BREATH': { buyPrice: 180, sellPrice: 145, buyVolume: 450000, sellVolume: 480000, buyOrders: 180, sellOrders: 250 },
    'ELDER_GUARDIAN_CONSUME': { buyPrice: 8500, sellPrice: 7200, buyVolume: 8500, sellVolume: 9200, buyOrders: 12, sellOrders: 18 },
    'GUARDIAN_FEATHER': { buyPrice: 1450, sellPrice: 1200, buyVolume: 45000, sellVolume: 52000, buyOrders: 35, sellOrders: 55 },
    'SHARK_FIN': { buyPrice: 3800, sellPrice: 3200, buyVolume: 28000, sellVolume: 32000, buyOrders: 22, sellOrders: 38 },
    'WHALE_BAIT': { buyPrice: 950, sellPrice: 780, buyVolume: 65000, sellVolume: 72000, buyOrders: 48, sellOrders: 72 },
    'MAGMA_CREAM': { buyPrice: 280, sellPrice: 220, buyVolume: 680000, sellVolume: 720000, buyOrders: 320, sellOrders: 450 },
    'ROSE_RED': { buyPrice: 85, sellPrice: 65, buyVolume: 520000, sellVolume: 550000, buyOrders: 280, sellOrders: 320 },
    'OXEYE_DAISY': { buyPrice: 280, sellPrice: 220, buyVolume: 180000, sellVolume: 210000, buyOrders: 95, sellOrders: 140 },
    'WITHER_SKELETON_SKULL': { buyPrice: 4200, sellPrice: 3500, buyVolume: 15000, sellVolume: 18000, buyOrders: 18, sellOrders: 28 },
    'WITHER_ROSE': { buyPrice: 1800, sellPrice: 1500, buyVolume: 35000, sellVolume: 42000, buyOrders: 25, sellOrders: 42 },
    'SLIME_BALL': { buyPrice: 145, sellPrice: 115, buyVolume: 420000, sellVolume: 450000, buyOrders: 240, sellOrders: 320 },
    'RABBIT_FOOT': { buyPrice: 380, sellPrice: 310, buyVolume: 120000, sellVolume: 140000, buyOrders: 75, sellOrders: 105 },
    'SPIDER_EYE': { buyPrice: 85, sellPrice: 65, buyVolume: 380000, sellVolume: 420000, buyOrders: 220, sellOrders: 280 },
    'FERMENTED_SPIDER_EYE': { buyPrice: 420, sellPrice: 350, buyVolume: 95000, sellVolume: 110000, buyOrders: 58, sellOrders: 82 },
    'BLAZE_ROD': { buyPrice: 680, sellPrice: 550, buyVolume: 220000, sellVolume: 250000, buyOrders: 145, sellOrders: 190 },
    'BLAZE_POWDER': { buyPrice: 380, sellPrice: 310, buyVolume: 180000, sellVolume: 210000, buyOrders: 110, sellOrders: 155 },
    'GHAST_TEAR': { buyPrice: 1850, sellPrice: 1500, buyVolume: 28000, sellVolume: 35000, buyOrders: 22, sellOrders: 35 },
    'NETHER_WART': { buyPrice: 45, sellPrice: 35, buyVolume: 850000, sellVolume: 920000, buyOrders: 480, sellOrders: 580 },
    'POTION_ENCHANTED_GOLDEN_APPLE': { buyPrice: 55000, sellPrice: 48000, buyVolume: 2500, sellVolume: 3200, buyOrders: 5, sellOrders: 12 },
    'ENCHANTED_GOLDEN_APPLE': { buyPrice: 85000, sellPrice: 72000, buyVolume: 1800, sellVolume: 2400, buyOrders: 4, sellOrders: 8 },
    'TIGHTLY_TIED_HONEY_BOTTLE': { buyPrice: 18500, sellPrice: 15500, buyVolume: 12000, sellVolume: 15000, buyOrders: 10, sellOrders: 18 },
    'HOG_FISH': { buyPrice: 145, sellPrice: 115, buyVolume: 280000, sellVolume: 320000, buyOrders: 165, sellOrders: 210 },
    'SNOW_BALL': { buyPrice: 25, sellPrice: 18, buyVolume: 1200000, sellVolume: 1350000, buyOrders: 650, sellOrders: 780 },
    'ICE': { buyPrice: 85, sellPrice: 65, buyVolume: 420000, sellVolume: 480000, buyOrders: 250, sellOrders: 320 },
    'PACKED_ICE': { buyPrice: 180, sellPrice: 145, buyVolume: 280000, sellVolume: 320000, buyOrders: 165, sellOrders: 220 },
    'PRISMARINE_SHARD': { buyPrice: 95, sellPrice: 75, buyVolume: 380000, sellVolume: 420000, buyOrders: 220, sellOrders: 280 },
    'PRISMARINE_CRYSTALS': { buyPrice: 320, sellPrice: 260, buyVolume: 150000, sellVolume: 180000, buyOrders: 95, sellOrders: 135 },
    'SEA_LANTERN': { buyPrice: 1450, sellPrice: 1200, buyVolume: 55000, sellVolume: 65000, buyOrders: 42, sellOrders: 65 },
    'TARANTULA_WEB': { buyPrice: 180, sellPrice: 145, buyVolume: 280000, sellVolume: 320000, buyOrders: 175, sellOrders: 230 },
    'FLYING_FISH': { buyPrice: 420, sellPrice: 350, buyVolume: 85000, sellVolume: 100000, buyOrders: 55, sellOrders: 78 },
    'GOLDEN_DRAGON_EGG': { buyPrice: 25000000, sellPrice: 22000000, buyVolume: 5, sellVolume: 8, buyOrders: 2, sellOrders: 3 },
    'TITANIUM': { buyPrice: 18500, sellPrice: 15500, buyVolume: 15000, sellVolume: 18000, buyOrders: 12, sellOrders: 20 },
    'AUGURITE': { buyPrice: 4200, sellPrice: 3500, buyVolume: 25000, sellVolume: 30000, buyOrders: 18, sellOrders: 28 },
    'BERBERIS': { buyPrice: 850, sellPrice: 700, buyVolume: 45000, sellVolume: 55000, buyOrders: 32, sellOrders: 48 },
    'SINTEA': { buyPrice: 680, sellPrice: 550, buyVolume: 62000, sellVolume: 75000, buyOrders: 45, sellOrders: 62 },
    'JUTE': { buyPrice: 145, sellPrice: 115, buyVolume: 180000, sellVolume: 220000, buyOrders: 115, sellOrders: 155 },
    'RICE': { buyPrice: 180, sellPrice: 145, buyVolume: 150000, sellVolume: 180000, buyOrders: 95, sellOrders: 130 },
    'PEONY': { buyPrice: 220, sellPrice: 175, buyVolume: 95000, sellVolume: 115000, buyOrders: 65, sellOrders: 88 },
    'VANILLA': { buyPrice: 950, sellPrice: 780, buyVolume: 55000, sellVolume: 68000, buyOrders: 38, sellOrders: 52 },
    'COMPRESSED_OBSIDIAN': { buyPrice: 4800, sellPrice: 4000, buyVolume: 35000, sellVolume: 42000, buyOrders: 25, sellOrders: 38 },
    'POWER_CRYSTAL': { buyPrice: 8500, sellPrice: 7200, buyVolume: 18000, sellVolume: 22000, buyOrders: 14, sellOrders: 22 },
    'CELL_CASE': { buyPrice: 1450, sellPrice: 1200, buyVolume: 65000, sellVolume: 78000, buyOrders: 42, sellOrders: 58 },
    'REACTOR_ARTIFACT': { buyPrice: 18500, sellPrice: 15500, buyVolume: 8500, sellVolume: 10500, buyOrders: 8, sellOrders: 14 },
    'NULL_OVOID': { buyPrice: 2200, sellPrice: 1850, buyVolume: 42000, sellVolume: 52000, buyOrders: 28, sellOrders: 42 },
    'GRIFFIN_FEATHER': { buyPrice: 4200, sellPrice: 3500, buyVolume: 25000, sellVolume: 32000, buyOrders: 18, sellOrders: 28 },
    'KISMET_FEATHER': { buyPrice: 6800, sellPrice: 5800, buyVolume: 15000, sellVolume: 18000, buyOrders: 12, sellOrders: 18 },
    'KELLERMAN_SLATE': { buyPrice: 1800, sellPrice: 1500, buyVolume: 55000, sellVolume: 65000, buyOrders: 38, sellOrders: 52 },
    'DARK_ORB': { buyPrice: 6500, sellPrice: 5500, buyVolume: 22000, sellVolume: 28000, buyOrders: 16, sellOrders: 25 },
    'WITHER_CATALYST': { buyPrice: 125000, sellPrice: 105000, buyVolume: 1800, sellVolume: 2200, buyOrders: 3, sellOrders: 5 },
    'SOUL_WHIP': { buyPrice: 85000, sellPrice: 72000, buyVolume: 2500, sellVolume: 3200, buyOrders: 4, sellOrders: 7 },
    'HYPER_CATALYST_UPGRADER': { buyPrice: 12000000, sellPrice: 10000000, buyVolume: 25, sellVolume: 35, buyOrders: 1, sellOrders: 2 },
    'PERFECT_CUT_GEM': { buyPrice: 8500000, sellPrice: 7200000, buyVolume: 45, sellVolume: 58, buyOrders: 1, sellOrders: 2 },
    'JASPER_GEM': { buyPrice: 5500000, sellPrice: 4800000, buyVolume: 85, sellVolume: 105, buyOrders: 2, sellOrders: 3 },
    'TOPAZ_GEM': { buyPrice: 3200000, sellPrice: 2800000, buyVolume: 120, sellVolume: 155, buyOrders: 2, sellOrders: 3 },
    'SAPPHIRE_GEM': { buyPrice: 4200000, sellPrice: 3600000, buyVolume: 95, sellVolume: 120, buyOrders: 2, sellOrders: 3 },
    'RUBY_GEM': { buyPrice: 5500000, sellPrice: 4800000, buyVolume: 85, sellVolume: 105, buyOrders: 2, sellOrders: 3 },
    'AMETHYST_GEM': { buyPrice: 6500000, sellPrice: 5500000, buyVolume: 75, sellVolume: 95, buyOrders: 2, sellOrders: 3 },
    'JADE_GEM': { buyPrice: 4800000, sellPrice: 4200000, buyVolume: 95, sellVolume: 120, buyOrders: 2, sellOrders: 3 },
    'AMBER_GEM': { buyPrice: 3800000, sellPrice: 3200000, buyVolume: 110, sellVolume: 145, buyOrders: 2, sellOrders: 3 }
  };

  const result = {};
  const now = Date.now();

  for (const [id, data] of Object.entries(mockProducts)) {
    // Generate random historical data points (last 7 days)
    const history = [];
    for (let i = 168; i >= 0; i--) {
      const hourAgo = now - (i * 60 * 60 * 1000);
      const randomVariation = (Math.random() - 0.5) * 0.2;
      const buyPrice = Math.round(data.buyPrice * (1 + randomVariation));
      const sellPrice = Math.round(data.sellPrice * (1 + randomVariation));

      history.push({
        timestamp: new Date(hourAgo).toISOString(),
        buyPrice,
        sellPrice,
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
        sellOrders: data.sellOrders,
        buyMovingWeek: Math.floor(data.buyVolume * 0.25),
        sellMovingWeek: Math.floor(data.sellVolume * 0.25)
      },
      history: history
    };
  }
  return result;
}

// Fetch Bazaar data from Hypixel API
async function fetchBazaarData() {
  // Use mock data if no API key configured
  if (USE_MOCK_DATA) {
    return generateMockData();
  }

  // Check cache first
  if (bazaarCache.data && bazaarCache.lastUpdated) {
    const timeSinceUpdate = Date.now() - bazaarCache.lastUpdated;
    if (timeSinceUpdate < CACHE_DURATION) {
      return bazaarCache.data;
    }
  }

  try {
    const response = await axios.get(`${HYPIXEL_API_BASE}/skyblock/bazaar`, {
      headers: {
        'API-Key': API_KEY
      },
      timeout: 10000
    });

    if (response.data.success) {
      bazaarCache.data = response.data.products;
      bazaarCache.lastUpdated = Date.now();
      return bazaarCache.data;
    } else {
      throw new Error('Failed to fetch Bazaar data from Hypixel API');
    }
  } catch (error) {
    console.error('Error fetching Bazaar data:', error.message);
    // Return cached data if available
    if (bazaarCache.data) {
      return bazaarCache.data;
    }
    throw error;
  }
}

// API Routes

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await fetchBazaarData();
    const formatted = Object.entries(products).map(([id, data]) => formatProduct(id, data));

    // Sort by buy volume (most popular first)
    formatted.sort((a, b) => b.buyVolume - a.buyVolume);

    res.json({
      success: true,
      data: formatted,
      lastUpdated: bazaarCache.lastUpdated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get single product details
app.get('/api/product/:id', async (req, res) => {
  try {
    const productId = req.params.id.toUpperCase();
    const products = await fetchBazaarData();

    if (!products[productId]) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const product = products[productId];
    const formatted = formatProduct(productId, product);

    // Only use file history if no history in product data (real API mode)
    if (!formatted.history || formatted.history.length === 0) {
      formatted.history = dataStore.getHistory(productId);
    }

    res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get product history
app.get('/api/history/:id', (req, res) => {
  const productId = req.params.id.toUpperCase();
  const history = dataStore.getHistory(productId);

  res.json({
    success: true,
    data: history
  });
});

// Get favorites
app.get('/api/favorites', (req, res) => {
  const favorites = dataStore.getFavorites();
  res.json({
    success: true,
    data: favorites
  });
});

// Add to favorites
app.post('/api/favorites/:id', (req, res) => {
  const productId = req.params.id.toUpperCase();
  const favorites = dataStore.addFavorite(productId);

  res.json({
    success: true,
    data: favorites
  });
});

// Remove from favorites
app.delete('/api/favorites/:id', (req, res) => {
  const productId = req.params.id.toUpperCase();
  const favorites = dataStore.removeFavorite(productId);

  res.json({
    success: true,
    data: favorites
  });
});

// Export data
app.get('/api/export', (req, res) => {
  const format = req.query.format || 'json';

  if (format === 'csv') {
    const csv = dataStore.exportAsCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=bazaar_history.csv');
    res.send(csv);
  } else {
    const data = dataStore.getAllHistory();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=bazaar_history.json');
    res.json(data);
  }
});

// Get cache status
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    data: {
      lastUpdated: bazaarCache.lastUpdated,
      hasApiKey: !!API_KEY,
      usingMockData: USE_MOCK_DATA
    }
  });
});

// Manual trigger to save history now
app.post('/api/save-history', async (req, res) => {
  try {
    const products = await fetchBazaarData();
    const popularProducts = Object.entries(products)
      .sort((a, b) => {
        const aVol = a[1].quick_status?.buyVolume || 0;
        const bVol = b[1].quick_status?.buyVolume || 0;
        return bVol - aVol;
      })
      .slice(0, 50);

    for (const [id, data] of popularProducts) {
      dataStore.saveToHistory(id, {
        buyPrice: data.quick_status?.buyPrice || 0,
        sellPrice: data.quick_status?.sellPrice || 0,
        buyOrders: data.quick_status?.buyOrders || 0,
        sellOrders: data.quick_status?.sellOrders || 0
      });
    }

    res.json({ success: true, message: 'History saved for ' + popularProducts.length + ' products' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start background task to save history periodically
setInterval(async () => {
  try {
    const products = await fetchBazaarData();
    // Save a sample of popular products to history
    const popularProducts = Object.entries(products)
      .sort((a, b) => {
        const aVol = a[1].quick_status?.buyVolume || 0;
        const bVol = b[1].quick_status?.buyVolume || 0;
        return bVol - aVol;
      })
      .slice(0, 50); // Save top 50 products

    for (const [id, data] of popularProducts) {
      dataStore.saveToHistory(id, {
        buyPrice: data.quick_status?.buyPrice || 0,
        sellPrice: data.quick_status?.sellPrice || 0,
        buyOrders: data.quick_status?.buyOrders || 0,
        sellOrders: data.quick_status?.sellOrders || 0
      });
    }
    console.log('History saved at', new Date().toISOString());
  } catch (error) {
    console.error('Error saving history:', error.message);
  }
}, 5 * 60 * 1000); // Every 5 minutes

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║     Skyblock Bazaar Monitor                       ║
║     Running on http://localhost:${PORT}               ║
╚═══════════════════════════════════════════════════╝
${USE_MOCK_DATA ? `
  📦 Using MOCK DATA (no API key configured)

  To use real data, get your API key from:
    https://hypixel.net/developer

  Then run:
    Windows: set HYPIXEL_API_KEY=your_key && npm start
    Linux/Mac: HYPIXEL_API_KEY=your_key npm start
` : `
  ✅ Connected to Hypixel API
`}
  `);
});

module.exports = app;
