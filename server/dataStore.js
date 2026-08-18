const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const FAVORITES_FILE = path.join(DATA_DIR, 'favorites.json');

// 内存兜底：serverless 平台（如 Vercel）文件系统只读，写文件会失败时降级到内存
const memoryStore = {
  history: {},
  favorites: []
};
let readOnly = false;

function initFiles() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, JSON.stringify({}));
    if (!fs.existsSync(FAVORITES_FILE)) fs.writeFileSync(FAVORITES_FILE, JSON.stringify([]));
    readOnly = false;
  } catch (error) {
    readOnly = true;
    console.warn('File storage unavailable, using in-memory fallback:', error.message);
  }

  // 读入内存，保证内存与文件一致
  try {
    memoryStore.history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch {
    memoryStore.history = {};
  }
  try {
    memoryStore.favorites = JSON.parse(fs.readFileSync(FAVORITES_FILE, 'utf8'));
  } catch {
    memoryStore.favorites = [];
  }
}
initFiles();

/**
 * Get history data for a specific product
 * @param {string} productId - The product ID
 * @returns {Array} Array of historical price points
 */
function getHistory(productId) {
  return memoryStore.history[productId] || [];
}

/**
 * Save price data to history
 * @param {string} productId - The product ID
 * @param {Object} priceData - Current price data
 */
function saveToHistory(productId, priceData) {
  try {
    if (!memoryStore.history[productId]) {
      memoryStore.history[productId] = [];
    }

    const timestamp = new Date().toISOString();
    memoryStore.history[productId].push({
      timestamp,
      buyPrice: priceData.buyPrice,
      sellPrice: priceData.sellPrice,
      buyOrders: priceData.buyOrders,
      sellOrders: priceData.sellOrders
    });

    // Keep only last 30 days of data (assuming updates every few minutes)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    memoryStore.history[productId] = memoryStore.history[productId].filter(entry => {
      return new Date(entry.timestamp).getTime() > thirtyDaysAgo;
    });

    if (!readOnly) {
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(memoryStore.history, null, 2));
    }
  } catch (error) {
    console.error('Error saving to history:', error.message);
  }
}

/**
 * Get all favorites
 * @returns {Array} Array of favorite product IDs
 */
function getFavorites() {
  return memoryStore.favorites;
}

/**
 * Add a product to favorites
 * @param {string} productId - The product ID to add
 */
function addFavorite(productId) {
  try {
    if (!memoryStore.favorites.includes(productId)) {
      memoryStore.favorites.push(productId);
      if (!readOnly) {
        fs.writeFileSync(FAVORITES_FILE, JSON.stringify(memoryStore.favorites, null, 2));
      }
    }
    return memoryStore.favorites;
  } catch (error) {
    console.error('Error adding favorite:', error.message);
    return memoryStore.favorites;
  }
}

/**
 * Remove a product from favorites
 * @param {string} productId - The product ID to remove
 */
function removeFavorite(productId) {
  try {
    memoryStore.favorites = memoryStore.favorites.filter(f => f !== productId);
    if (!readOnly) {
      fs.writeFileSync(FAVORITES_FILE, JSON.stringify(memoryStore.favorites, null, 2));
    }
    return memoryStore.favorites;
  } catch (error) {
    console.error('Error removing favorite:', error.message);
    return memoryStore.favorites;
  }
}

/**
 * Get all history data for export
 * @returns {Object} All historical data
 */
function getAllHistory() {
  return memoryStore.history;
}

/**
 * Export history as CSV format
 * @returns {string} CSV formatted string
 */
function exportAsCSV() {
  const history = getAllHistory();
  let csv = 'Product ID,Timestamp,Buy Price,Sell Price,Buy Orders,Sell Orders\n';

  for (const [productId, entries] of Object.entries(history)) {
    for (const entry of entries) {
      csv += `${productId},${entry.timestamp},${entry.buyPrice},${entry.sellPrice},${entry.buyOrders},${entry.sellOrders}\n`;
    }
  }

  return csv;
}

module.exports = {
  getHistory,
  saveToHistory,
  getFavorites,
  addFavorite,
  removeFavorite,
  getAllHistory,
  exportAsCSV
};
