const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const FAVORITES_FILE = path.join(DATA_DIR, 'favorites.json');

// Initialize files if they don't exist
if (!fs.existsSync(HISTORY_FILE)) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify({}));
}

if (!fs.existsSync(FAVORITES_FILE)) {
  fs.writeFileSync(FAVORITES_FILE, JSON.stringify([]));
}

/**
 * Get history data for a specific product
 * @param {string} productId - The product ID
 * @returns {Array} Array of historical price points
 */
function getHistory(productId) {
  try {
    const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    return data[productId] || [];
  } catch (error) {
    console.error('Error reading history:', error);
    return [];
  }
}

/**
 * Save price data to history
 * @param {string} productId - The product ID
 * @param {Object} priceData - Current price data
 */
function saveToHistory(productId, priceData) {
  try {
    const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));

    if (!data[productId]) {
      data[productId] = [];
    }

    const timestamp = new Date().toISOString();
    data[productId].push({
      timestamp,
      buyPrice: priceData.buyPrice,
      sellPrice: priceData.sellPrice,
      buyOrders: priceData.buyOrders,
      sellOrders: priceData.sellOrders
    });

    // Keep only last 30 days of data (assuming updates every few minutes)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    data[productId] = data[productId].filter(entry => {
      return new Date(entry.timestamp).getTime() > thirtyDaysAgo;
    });

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving to history:', error);
  }
}

/**
 * Get all favorites
 * @returns {Array} Array of favorite product IDs
 */
function getFavorites() {
  try {
    return JSON.parse(fs.readFileSync(FAVORITES_FILE, 'utf8'));
  } catch (error) {
    console.error('Error reading favorites:', error);
    return [];
  }
}

/**
 * Add a product to favorites
 * @param {string} productId - The product ID to add
 */
function addFavorite(productId) {
  try {
    const favorites = getFavorites();
    if (!favorites.includes(productId)) {
      favorites.push(productId);
      fs.writeFileSync(FAVORITES_FILE, JSON.stringify(favorites, null, 2));
    }
    return favorites;
  } catch (error) {
    console.error('Error adding favorite:', error);
    return [];
  }
}

/**
 * Remove a product from favorites
 * @param {string} productId - The product ID to remove
 */
function removeFavorite(productId) {
  try {
    const favorites = getFavorites().filter(f => f !== productId);
    fs.writeFileSync(FAVORITES_FILE, JSON.stringify(favorites, null, 2));
    return favorites;
  } catch (error) {
    console.error('Error removing favorite:', error);
    return [];
  }
}

/**
 * Get all history data for export
 * @returns {Object} All historical data
 */
function getAllHistory() {
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch (error) {
    console.error('Error reading all history:', error);
    return {};
  }
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
