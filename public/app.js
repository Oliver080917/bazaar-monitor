// Skyblock Bazaar Monitor - Frontend Application

const API_BASE = '';

// Config
const ITEMS_PER_PAGE = 50; // 每页显示数量
let currentPage = 1;
let totalPages = 1;
let filteredProducts = []; // 筛选后的商品列表
let products = []; // 所有商品列表
let favorites = [];
let selectedProduct = null;
let priceChart = null;
let currentCategory = 'all'; // 当前选中的分类
let currentSubcategory = null; // 当前选中的子分类

// 分类映射 - 基于真实商品 ID 的精确映射（每个商品只属于一个子分类）
const CATEGORY_MAP = {
  farming: {
    name: "Farming",
    subcategories: {
      wheat_seeds: { name: "Wheat & Seeds", ids: ["WHEAT", "ENCHANTED_WHEAT", "SEEDS", "ENCHANTED_SEEDS", "BOX_OF_SEEDS", "GODSEED", "ENCHANTED_BREAD", "VERY_MOLDY_BREAD", "HAY_BLOCK", "ENCHANTED_HAY_BLOCK", "ENCHANTED_HAY_BALE", "TIGHTLY_TIED_HAY_BALE"] },
      carrot: { name: "Carrot", ids: ["CARROT_ITEM", "ENCHANTED_CARROT", "ENCHANTED_GOLDEN_CARROT", "ENCHANTED_CARROT_ON_A_STICK", "ENCHANTED_CARROT_STICK", "EXPORTABLE_CARROTS", "SIMPLE_CARROT_CANDY", "GREAT_CARROT_CANDY", "SUPERB_CARROT_CANDY", "ULTIMATE_CARROT_CANDY"] },
      potato: { name: "Potato", ids: ["POTATO_ITEM", "ENCHANTED_POTATO", "ENCHANTED_BAKED_POTATO", "POISONOUS_POTATO", "ENCHANTED_POISONOUS_POTATO", "DEEPFRIES", "HASHBROWN", "FUMING_POTATO_BOOK", "HOT_POTATO_BOOK", "POTATO_SPREADING"] },
      pumpkin: { name: "Pumpkin", ids: ["PUMPKIN", "ENCHANTED_PUMPKIN", "POLISHED_PUMPKIN", "PUMPKIN_BOMB", "PUMPKIN_GUTS", "EXPIRED_PUMPKIN"] },
      melon: { name: "Melon", ids: ["MELON", "ENCHANTED_MELON", "MELON_BLOCK", "ENCHANTED_MELON_BLOCK", "ENCHANTED_GLISTERING_MELON", "MELON_JUICE"] },
      mushroom: { name: "Mushrooms", ids: ["BROWN_MUSHROOM", "RED_MUSHROOM", "ENCHANTED_BROWN_MUSHROOM", "ENCHANTED_RED_MUSHROOM", "HUGE_MUSHROOM_1", "HUGE_MUSHROOM_2", "ENCHANTED_HUGE_MUSHROOM_1", "ENCHANTED_HUGE_MUSHROOM_2", "GLOWING_MUSHROOM", "ENCHANTED_MYCELIUM", "ENCHANTED_MYCELIUM_CUBE", "MAGIC_MUSHROOM_SOUP", "SUPER_MAGIC_MUSHROOM_SOUP", "HALF_EATEN_MUSHROOM", "DO_NOT_EAT_SHROOM", "DIGESTED_MUSHROOMS", "FEASTFUNGUS"] },
      cocoa: { name: "Cocoa Beans", ids: ["ENCHANTED_COCOA", "ENCHANTED_COOKIE", "REFINED_DARK_CACAO_TRUFFLE"] },
      cactus: { name: "Cactus", ids: ["CACTUS", "ENCHANTED_CACTUS", "CACTUS_FLOWER", "ENCHANTED_CACTUS_GREEN", "POTTED_CACTUS"] },
      sugar_cane: { name: "Sugar Cane", ids: ["SUGAR_CANE", "ENCHANTED_SUGAR_CANE", "ENCHANTED_SUGAR", "ENCHANTED_PAPER", "CANE_KNOT"] },
      leather: { name: "Leather & Beef", ids: ["LEATHER", "ENCHANTED_LEATHER", "RAW_BEEF", "ENCHANTED_RAW_BEEF", "LEATHER_CLOTH", "TORN_CLOTH"] },
      pork: { name: "Pork", ids: ["PORK", "ENCHANTED_PORK", "ENCHANTED_GRILLED_PORK"] },
      chicken: { name: "Chicken & Feather", ids: ["RAW_CHICKEN", "ENCHANTED_RAW_CHICKEN", "EGG", "ENCHANTED_EGG", "FEATHER", "ENCHANTED_FEATHER", "RAINBOW_FEATHER", "FRIED_FEATHER", "ENCHANTED_CAKE"] },
      mutton: { name: "Raw Mutton", ids: ["MUTTON", "ENCHANTED_MUTTON", "ENCHANTED_COOKED_MUTTON", "WOOL", "ENCHANTED_WOOL"] },
      rabbit: { name: "Rabbit", ids: ["RABBIT", "ENCHANTED_RABBIT", "RABBIT_FOOT", "ENCHANTED_RABBIT_FOOT", "RABBIT_HIDE", "ENCHANTED_RABBIT_HIDE", "ENCHANTED_COOKED_RABBIT"] },
      nether_wart: { name: "Nether Warts", ids: ["NETHER_STALK", "ENCHANTED_NETHER_STALK", "MUTANT_NETHER_STALK", "NETHER_STALK_DISTILLATE"] },
      garden: { name: "Garden", ids: ["COMPOST", "ENCHANTED_COMPOST", "FERMENTO", "CONDENSED_FERMENTO", "SQUASH", "CROPIE", "PLANT_MATTER", "DOUBLE_PLANT", "DEAD_PLANT", "MOONFLOWER", "ENCHANTED_MOONFLOWER", "COMPACTED_MOONFLOWER", "HELIANTHUS", "CONDENSED_HELIANTHUS", "ENCHANTED_SUNFLOWER", "SUNFLOWER_BUTTER", "SUNFLOWER_OIL", "RED_ROSE", "YELLOW_FLOWER", "ENCHANTED_POPPY", "ENCHANTED_DANDELION", "WILD_ROSE", "ENCHANTED_WILD_ROSE", "COMPACTED_WILD_ROSE", "LUSHLILAC", "BACHELOR_ROSE", "LUSH_BERBERIS", "ENCHANTED_LUSH_BERBERIS", "FLOWERING_BOUQUET", "WATER_LILY", "ENCHANTED_WATER_LILY", "CONDENSED_WATER_LILY", "SEA_LUMIES", "ENCHANTED_SEA_LUMIES", "LOTUS", "LOTUS_DIAMOND", "LOTUS_GOLD", "LOTUS_SILVER", "LOTUS_WATER_ORB", "HELIX", "HELIXIS"] }
    }
  },
  mining: {
    name: "Mining",
    subcategories: {
      cobblestone: { name: "Cobblestone", ids: ["COBBLESTONE", "ENCHANTED_COBBLESTONE"] },
      coal: { name: "Coal", ids: ["COAL", "ENCHANTED_COAL", "ENCHANTED_COAL_BLOCK", "ENCHANTED_CHARCOAL", "SULPHURIC_COAL", "COALROOT"] },
      iron: { name: "Iron", ids: ["IRON_INGOT", "ENCHANTED_IRON", "ENCHANTED_IRON_BLOCK"] },
      gold: { name: "Gold", ids: ["GOLD_INGOT", "ENCHANTED_GOLD", "ENCHANTED_GOLD_BLOCK", "GOLDEN_POWDER", "GOLDEN_PLATE", "GOLD_BOTTLE_CAP", "GOLDEN_BALL"] },
      diamond: { name: "Diamond", ids: ["DIAMOND", "ENCHANTED_DIAMOND", "ENCHANTED_DIAMOND_BLOCK", "REFINED_DIAMOND", "RARE_DIAMOND", "DIAMOND_ATOM"] },
      lapis: { name: "Lapis", ids: ["ENCHANTED_LAPIS_LAZULI", "ENCHANTED_LAPIS_LAZULI_BLOCK", "LAPIS_CRYSTAL"] },
      emerald: { name: "Emerald", ids: ["EMERALD", "ENCHANTED_EMERALD", "ENCHANTED_EMERALD_BLOCK", "JADERALD"] },
      redstone: { name: "Redstone", ids: ["REDSTONE", "ENCHANTED_REDSTONE", "ENCHANTED_REDSTONE_BLOCK", "ENCHANTED_REDSTONE_LAMP", "ELECTRON_TRANSMITTER"] },
      obsidian: { name: "Obsidian", ids: ["OBSIDIAN", "ENCHANTED_OBSIDIAN", "OBSIDIAN_TABLET"] },
      end_stone: { name: "End Stone", ids: ["ENDER_STONE", "ENCHANTED_ENDSTONE", "END_STONE_SHULKER", "ENDSTONE_GEODE", "ENDSTONE_IDOL"] },
      flint_gravel: { name: "Flint & Gravel", ids: ["FLINT", "ENCHANTED_FLINT", "GRAVEL"] },
      sand: { name: "Sand", ids: ["SAND", "SAND:1", "ENCHANTED_SAND", "ENCHANTED_RED_SAND", "ENCHANTED_RED_SAND_CUBE"] },
      ice: { name: "Ice", ids: ["ICE", "PACKED_ICE", "ENCHANTED_ICE", "ENCHANTED_PACKED_ICE", "GLACIAL_FRAGMENT", "POCKET_ICEBERG", "POCKET_SIZED_IGLOO", "BLUE_ICE_HUNK", "FROZEN_BAUBLE", "ICE_HUNK"] },
      snow: { name: "Snow", ids: ["SNOW_BALL", "SNOW_BLOCK", "ENCHANTED_SNOW_BLOCK"] },
      hard_stone: { name: "Hard Stone", ids: ["HARD_STONE", "ENCHANTED_HARD_STONE", "CONCENTRATED_STONE", "BULKY_STONE", "VOLCANIC_ROCK"] },
      gemstones: { name: "Gemstones", ids: ["ROUGH_AMBER_GEM", "FLAWED_AMBER_GEM", "FINE_AMBER_GEM", "FLAWLESS_AMBER_GEM", "PERFECT_AMBER_GEM", "ROUGH_AMETHYST_GEM", "FLAWED_AMETHYST_GEM", "FINE_AMETHYST_GEM", "FLAWLESS_AMETHYST_GEM", "PERFECT_AMETHYST_GEM", "ROUGH_AQUAMARINE_GEM", "FLAWED_AQUAMARINE_GEM", "FINE_AQUAMARINE_GEM", "FLAWLESS_AQUAMARINE_GEM", "PERFECT_AQUAMARINE_GEM", "ROUGH_CITRINE_GEM", "FLAWED_CITRINE_GEM", "FINE_CITRINE_GEM", "FLAWLESS_CITRINE_GEM", "PERFECT_CITRINE_GEM", "ROUGH_JADE_GEM", "FLAWED_JADE_GEM", "FINE_JADE_GEM", "FLAWLESS_JADE_GEM", "PERFECT_JADE_GEM", "ROUGH_JASPER_GEM", "FLAWED_JASPER_GEM", "FINE_JASPER_GEM", "FLAWLESS_JASPER_GEM", "PERFECT_JASPER_GEM", "ROUGH_ONYX_GEM", "FLAWED_ONYX_GEM", "FINE_ONYX_GEM", "FLAWLESS_ONYX_GEM", "PERFECT_ONYX_GEM", "ROUGH_OPAL_GEM", "FLAWED_OPAL_GEM", "FINE_OPAL_GEM", "FLAWLESS_OPAL_GEM", "PERFECT_OPAL_GEM", "ROUGH_PERIDOT_GEM", "FLAWED_PERIDOT_GEM", "FINE_PERIDOT_GEM", "FLAWLESS_PERIDOT_GEM", "PERFECT_PERIDOT_GEM", "ROUGH_RUBY_GEM", "FLAWED_RUBY_GEM", "FINE_RUBY_GEM", "FLAWLESS_RUBY_GEM", "PERFECT_RUBY_GEM", "ROUGH_SAPPHIRE_GEM", "FLAWED_SAPPHIRE_GEM", "FINE_SAPPHIRE_GEM", "FLAWLESS_SAPPHIRE_GEM", "PERFECT_SAPPHIRE_GEM", "ROUGH_TOPAZ_GEM", "FLAWED_TOPAZ_GEM", "FINE_TOPAZ_GEM", "FLAWLESS_TOPAZ_GEM", "PERFECT_TOPAZ_GEM", "AMBER_MATERIAL", "GLOSSY_GEMSTONE", "GEMSTONE_MIXTURE", "ROCK_GEMSTONE"] },
      dwarven: { name: "Dwarven Mines", ids: ["MITHRIL_ORE", "ENCHANTED_MITHRIL", "REFINED_MITHRIL", "PURE_MITHRIL", "MITHRIL_PLATE", "MITHRIL_INFUSION", "TITANIUM_ORE", "ENCHANTED_TITANIUM", "REFINED_TITANIUM", "TITANIUM_TESSERACT", "TUNGSTEN", "ENCHANTED_TUNGSTEN", "REFINED_TUNGSTEN", "TUNGSTEN_KEY", "TUNGSTEN_PLATE", "UMBER", "ENCHANTED_UMBER", "REFINED_UMBER", "UMBER_KEY", "UMBER_PLATE", "STARFALL", "PETRIFIED_STARFALL", "GLACITE", "ENCHANTED_GLACITE", "GLACITE_SHARD", "GLACITE_JEWEL", "GLACITE_AMALGAMATION", "TREASURITE", "SORROW", "IRIDIUM", "MAGMA_CHUNK", "MOONSTONE", "SUNSTONE", "DIVAN_FRAGMENT", "DIVAN_POWDER_COATING", "DWARVEN_TREASURE"] }
    }
  },
  combat: {
    name: "Combat",
    subcategories: {
      drops: { name: "Basic Drops", ids: ["ROTTEN_FLESH", "ENCHANTED_ROTTEN_FLESH", "BONE", "ENCHANTED_BONE", "ENCHANTED_BONE_BLOCK", "ENCHANTED_BONE_MEAL", "STRING", "ENCHANTED_STRING", "ARROW_BUNDLE_MAGMA", "ENCHANTED_GUNPOWDER", "SPIDER_EYE", "ENCHANTED_SPIDER_EYE", "ENCHANTED_FERMENTED_SPIDER_EYE", "GHAST_TEAR", "ENCHANTED_GHAST_TEAR", "SLIME_BALL", "ENCHANTED_SLIME_BALL", "ENCHANTED_SLIME_BLOCK", "ENDER_PEARL", "ENCHANTED_ENDER_PEARL", "ABSOLUTE_ENDER_PEARL", "TESSELLATED_ENDER_PEARL", "BLAZE_ROD", "ENCHANTED_BLAZE_ROD", "ENCHANTED_BLAZE_POWDER", "MAGMA_CREAM", "ENCHANTED_MAGMA_CREAM", "LUMP_OF_MAGMA", "WHIPPED_MAGMA_CREAM", "FOUL_FLESH", "PREMIUM_FLESH", "REVENANT_FLESH", "REVENANT_VISCERA", "TARANTULA_WEB", "TARANTULA_SILK", "WOLF_TOOTH", "SILVER_FANG", "SPIRIT_BONE", "SPIRIT_WING", "WITHER_BLOOD", "WITHER_SOUL", "SUMMONING_EYE", "HORN_OF_TAURUS", "HORNS_OF_TORMENT", "KUUDRA_MANDIBLE", "KUUDRA_TENTACLE", "KUUDRA_TEETH", "ECTOPLASM", "ANCIENT_CLAW", "ENCHANTED_ANCIENT_CLAW", "SOULFLOW", "RAW_SOULFLOW", "SOULFLOW_ENGINE", "LESSER_SOULFLOW_ENGINE", "REAPER_PEPPER", "DUNGEON_CHEST_KEY", "DUNGEON_DECOY", "DUNGEON_TRAP", "SUPERBOOM_TNT", "STOCK_OF_STONKS", "HALLOWED_SKULL", "SEVERED_HAND", "SEVERED_PINCER", "FLY_SWATTER", "SPECTRE_DUST", "SPOOKY_SHARD", "MAGMA_URCHIN", "ARACHNE_FANG", "ARACHNE_FRAGMENT", "ARACHNE_KEEPER_FRAGMENT", "TENTACLE_MEAT", "RUSTY_ANCHOR", "FEL_PEARL", "GAZING_PEARL", "HEAVY_PEARL", "PRECIOUS_PEARL"] },
      fishing: { name: "Fishing", ids: ["SHARK_FIN", "ENCHANTED_SHARK_FIN", "TIGER_SHARK_TOOTH", "GREAT_WHITE_SHARK_TOOTH", "GREAT_WHITE_TOOTH_MEAL", "NURSE_SHARK_TOOTH", "BLUE_SHARK_TOOTH", "WHALE_BAIT", "SHARK_BAIT", "MAGMA_FISH", "MAGMA_FISH_DIAMOND", "MAGMA_FISH_GOLD", "MAGMA_FISH_SILVER", "FROZEN_SCUTE", "GILL_MEMBRANE", "INK_SACK", "INK_SACK:3", "INK_SACK:4", "ENCHANTED_INK_SACK", "CHUM", "FULL_CHUM_BUCKET", "EMPTY_CHUM_BUCKET", "GLOWY_CHUM_BAIT", "DARK_BAIT", "SPIKED_BAIT", "LIGHT_BAIT", "MINNOW_BAIT", "HOT_BAIT", "ICE_BAIT", "FROZEN_BAIT", "BLESSED_BAIT", "TREASURE_BAIT", "WOODEN_BAIT", "WORM_BAIT", "SPOOKY_BAIT", "CORRUPTED_BAIT", "CARROT_BAIT", "MOUND_OF_SEAGRASS", "PRISMARINE_SHARD", "ENCHANTED_PRISMARINE_SHARD", "PRISMARINE_CRYSTALS", "ENCHANTED_PRISMARINE_CRYSTALS", "CLAY_BALL", "ENCHANTED_CLAY_BALL", "ENCHANTED_CLAY_BLOCK", "BAYOU_WATER_ORB", "HOTSPOT_WATER_ORB", "LAVA_WATER_ORB", "SHARK_WATER_ORB", "SPOOKY_WATER_ORB", "WINTER_WATER_ORB", "WATER_ORB", "DEEP_SEA_ORB"] },
      boss: { name: "Boss Drops", ids: ["GIANT_FRAGMENT_BIGFOOT", "GIANT_FRAGMENT_BOULDER", "GIANT_FRAGMENT_DIAMOND", "GIANT_FRAGMENT_LASER", "NECROMANCER_BROOCH", "SADAN_BROOCH", "THORN_FRAGMENT", "BONZO_FRAGMENT", "SCARF_FRAGMENT", "LIVID_FRAGMENT", "OLD_FRAGMENT", "STRONG_FRAGMENT", "SUPERIOR_FRAGMENT", "PROTECTOR_FRAGMENT", "WISE_FRAGMENT", "YOUNG_FRAGMENT", "UNSTABLE_FRAGMENT", "HOLY_FRAGMENT", "REKINDLED_EMBER_FRAGMENT", "CRYSTAL_FRAGMENT", "GOLDEN_FRAGMENT", "DRAGON_CLAW", "DRAGON_HORN", "DRAGON_SCALE", "BEATING_HEART", "INFERNO_APEX", "INFERNO_VERTEX", "INFERNO_FUEL_BLOCK", "PYROCLASTIC_SCALE", "FLAMING_HEART", "WEREWOLF_SKIN", "SOUL_FRAGMENT", "METEOR_SHARD", "DIAMONITE", "MAGMA_LORD_FRAGMENT", "GUARDIAN_LUCKY_BLOCK", "MYTHOS_FRAGMENT"] }
    }
  },
  woods_fishes: {
    name: "Woods & Fishes",
    subcategories: {
      logs: { name: "Logs", ids: ["LOG", "LOG:1", "LOG:2", "LOG:3", "LOG_2", "LOG_2:1", "ENCHANTED_OAK_LOG", "ENCHANTED_BIRCH_LOG", "ENCHANTED_SPRUCE_LOG", "ENCHANTED_DARK_OAK_LOG", "ENCHANTED_JUNGLE_LOG", "ENCHANTED_ACACIA_LOG", "MANGROVE_LOG", "ENCHANTED_MANGROVE_LOG", "FIG_LOG", "ENCHANTED_FIG_LOG", "HELIX_LOG", "ENCHANTED_HELIX_LOG", "MOIL_LOG", "TOIL_LOG", "HARDENED_WOOD", "TENDER_WOOD", "ENCHANTED_TENDER_WOOD"] },
      fish: { name: "Raw Fish", ids: ["RAW_FISH", "RAW_FISH:1", "RAW_FISH:2", "RAW_FISH:3", "ENCHANTED_RAW_FISH", "ENCHANTED_COOKED_FISH", "ENCHANTED_RAW_SALMON", "ENCHANTED_COOKED_SALMON", "ENCHANTED_CLOWNFISH", "ENCHANTED_PUFFERFISH", "FISH_BAIT", "PITCHIN_KOI", "OCTOPUS_TENDRIL", "SALMON_OPAL", "SHINY_PRISM", "SPONGE", "ENCHANTED_SPONGE", "ENCHANTED_WET_SPONGE"] }
    }
  },
  oddities: {
    name: "Oddities",
    subcategories: {
      catalysts: { name: "Catalysts", ids: ["CATALYST", "HYPER_CATALYST", "REVENANT_CATALYST", "SPIDER_CATALYST", "TARANTULA_CATALYST", "UNDEAD_CATALYST", "WEAK_WOLF_CATALYST", "WITHER_CATALYST"] },
      honey: { name: "Honey", ids: ["HONEYCOMB", "ENCHANTED_HONEYCOMB", "ENCHANTED_HONEYCOMB_BLOCK", "HONEY_JAR", "CANDYCOMB", "GIANT_HONEY_DIPPER", "LARGE_HONEY_DIPPER", "MEDIUM_HONEY_DIPPER", "SMALL_HONEY_DIPPER"] },
      refines: { name: "Refines & Crafting", ids: ["COMPACTOR", "ENCHANTED_HOPPER", "BUDGET_HOPPER", "OVERFLOWING_TRASH_CAN", "MINION_EXPANDER", "SMALL_ENCHANTED_CHEST", "MEDIUM_ENCHANTED_CHEST", "LARGE_ENCHANTED_CHEST", "XLARGE_ENCHANTED_CHEST", "XXLARGE_ENCHANTED_CHEST", "RECOMBOBULATOR_3000", "REVERSE_REFORGE_STONE_CORE", "DAEDALUS_STICK", "MIDAS_JEWEL", "WOOD_SINGULARITY", "AMALGAMATED_CRIMSONITE", "AMALGAMATED_CRIMSONITE_NEW", "REFINED_BOTTLE_OF_JYRRE", "REFINED_MINERAL", "AUTO_SMELTER", "DIAMOND_SPREADING", "THE_ART_OF_WAR", "THE_ART_OF_PEACE"] }
    }
  }
};

// DOM Elements
const elements = {
  productGrid: document.getElementById('productGrid'),
  searchInput: document.getElementById('searchInput'),
  showFavoritesOnly: document.getElementById('showFavoritesOnly'),
  favoritesList: document.getElementById('favoritesList'),
  detailPanel: document.getElementById('detailPanel'),
  closeDetail: document.getElementById('closeDetail'),
  refreshBtn: document.getElementById('refreshBtn'),
  exportBtn: document.getElementById('exportBtn'),
  exportModal: document.getElementById('exportModal'),
  statusText: document.getElementById('statusText'),
  lastUpdated: document.getElementById('lastUpdated'),
  categoryList: document.getElementById('categoryList'),
  flipsList: document.getElementById('flipsList'),
  flipsListSection: document.getElementById('flipsListSection'),
  flipsCount: document.getElementById('flipsCount'),
  flipsToggle: document.getElementById('flipsToggle')
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
  bindEvents();
  await checkStatus();
  await loadProducts();
  await loadFavorites();
  startAutoRefresh();
}

function bindEvents() {
  elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
  elements.showFavoritesOnly.addEventListener('change', handleFilterChange);
  elements.refreshBtn.addEventListener('click', refreshData);
  elements.closeDetail.addEventListener('click', closeDetailPanel);
  elements.exportBtn.addEventListener('click', () => elements.exportModal.classList.add('active'));
  document.getElementById('cancelExport').addEventListener('click', () => elements.exportModal.classList.remove('active'));
  document.getElementById('exportJson').addEventListener('click', () => exportData('json'));
  document.getElementById('exportCsv').addEventListener('click', () => exportData('csv'));

  // 分类点击事件
  if (elements.categoryList) {
    elements.categoryList.addEventListener('click', handleCategoryClick);
  }

  // 倒卖机会展开/收起
  if (elements.flipsToggle) {
    elements.flipsToggle.addEventListener('click', () => {
      const expanded = elements.flipsListSection.classList.toggle('open');
      elements.flipsList.style.display = expanded ? 'block' : 'none';
    });
  }

  // 价格图表：双击放大到页面中间，再次双击恢复全图（手动控制 x 轴范围）
  document.getElementById('priceChart').addEventListener('dblclick', (e) => {
    e.preventDefault();
    if (!priceChart) return;
    const chart = priceChart;
    const xScale = chart.scales && chart.scales.x;
    if (!xScale) return;
    const labels = chart.data.labels || [];
    const isZoomed = xScale.min > 0 || xScale.max < (labels.length - 1);
    if (isZoomed) {
      chart.options.scales.x.min = undefined;
      chart.options.scales.x.max = undefined;
    } else {
      const mid = (xScale.min + xScale.max) / 2;
      const half = (xScale.max - xScale.min) / 4;
      chart.options.scales.x.min = mid - half;
      chart.options.scales.x.max = mid + half;
    }
    chart.update();
  });
}

// 分类点击处理
function handleCategoryClick(e) {
  const item = e.target.closest('.category-item');
  if (!item) return;

  const category = item.dataset.category;

  // "全部" 分类特殊处理
  if (category === 'all') {
    // 隐藏所有子分类
    document.querySelectorAll('.subcategory-list').forEach(el => {
      el.style.display = 'none';
    });
    document.querySelectorAll('.category-item').forEach(el => {
      el.classList.remove('expanded');
    });

    // 更新选中状态
    document.querySelectorAll('.category-item').forEach(el => {
      el.classList.remove('active');
    });
    item.classList.add('active');

    currentCategory = 'all';
    currentSubcategory = null;

    const query = elements.searchInput.value.toLowerCase();
    filterProducts(query, elements.showFavoritesOnly.checked);
    return;
  }

  // 获取点击的主分类元素
  const categoryItem = item;

  // 检查是否点击了子分类
  const subcategoryItem = e.target.closest('.subcategory-item');
  if (subcategoryItem) {
    // 处理子分类点击
    const subcategory = subcategoryItem.dataset.subcategory;

    // 更新子分类选中状态
    const subcategoryList = categoryItem.querySelector('.subcategory-list');
    if (subcategoryList) {
      subcategoryList.querySelectorAll('.subcategory-item').forEach(el => {
        el.classList.remove('active');
      });
      subcategoryItem.classList.add('active');
    }

    currentSubcategory = subcategory;

    const query = elements.searchInput.value.toLowerCase();
    filterProducts(query, elements.showFavoritesOnly.checked);
    return;
  }

  // 切换主分类的展开/收起状态
  const subcategoryList = categoryItem.querySelector('.subcategory-list');

  // 如果点击的是一个新的分类，先收起其他分类的子分类
  document.querySelectorAll('.category-item').forEach(el => {
    if (el !== categoryItem) {
      el.classList.remove('expanded');
      const otherSubList = el.querySelector('.subcategory-list');
      if (otherSubList) otherSubList.style.display = 'none';
    }
  });

  // 切换当前分类的展开状态
  if (subcategoryList) {
    const isExpanded = categoryItem.classList.contains('expanded');
    if (isExpanded) {
      categoryItem.classList.remove('expanded');
      subcategoryList.style.display = 'none';
    } else {
      categoryItem.classList.add('expanded');
      // 如果子分类还没有渲染，则渲染
      if (subcategoryList.children.length === 0) {
        renderSubcategories(category, subcategoryList);
      }
      subcategoryList.style.display = 'block';
    }
  }

  // 更新主分类选中状态（只选中展开的分类）
  document.querySelectorAll('.category-item').forEach(el => {
    el.classList.remove('active');
  });
  categoryItem.classList.add('active');

  // 设置当前分类并筛选
  currentCategory = category;
  currentSubcategory = null; // 重置子分类，显示该分类下的所有物品

  const query = elements.searchInput.value.toLowerCase();
  filterProducts(query, elements.showFavoritesOnly.checked);
}

// 渲染子分类
function renderSubcategories(category, container) {
  const categoryData = CATEGORY_MAP[category];
  if (!categoryData || !categoryData.subcategories) {
    return;
  }

  const subcategories = categoryData.subcategories;
  // 默认不选中任何子分类，显示该分类下的所有物品
  let html = '';

  for (const [key, data] of Object.entries(subcategories)) {
    html += `<li class="subcategory-item" data-subcategory="${key}">${data.name}</li>`;
  }

  container.innerHTML = html;
}

async function checkStatus() {
  try {
    const response = await fetch(`${API_BASE}/api/status`);
    const data = await response.json();

    if (data.success && data.data.hasApiKey) {
      elements.statusText.className = 'status status-success';
      elements.statusText.textContent = '✅ API 已连接';
    } else {
      elements.statusText.className = 'status status-error';
      elements.statusText.textContent = '⚠️ API 密钥未配置';
    }
  } catch (error) {
    elements.statusText.className = 'status status-error';
    elements.statusText.textContent = '❌ 连接失败';
  }
}

async function loadProducts() {
  showLoading(true);

  try {
    const response = await fetch(`${API_BASE}/api/products`);
    const data = await response.json();

    if (data.success) {
      products = data.data;
      filteredProducts = products; // 初始时筛选列表等于全部商品
      currentPage = 1; // 重置到第一页
      renderProducts();
      renderPagination();
      renderFlips();
      updateLastUpdated(data.lastUpdated);
    } else {
      showError(data.error || '加载商品失败');
    }
  } catch (error) {
    showError('连接服务器失败');
  } finally {
    showLoading(false);
  }
}

async function loadFavorites() {
  try {
    const response = await fetch(`${API_BASE}/api/favorites`);
    const data = await response.json();

    if (data.success) {
      favorites = data.data;
      renderFavorites();
    }
  } catch (error) {
    console.error('Failed to load favorites:', error);
  }
}

async function loadProductDetail(productId) {
  try {
    const response = await fetch(`${API_BASE}/api/product/${productId}`);
    const data = await response.json();

    if (data.success) {
      selectedProduct = data.data;
      renderProductDetail(selectedProduct);
      elements.detailPanel.classList.add('active');

      // Update selected state in grid
      document.querySelectorAll('.product-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.id === productId);
      });
    }
  } catch (error) {
    console.error('Failed to load product detail:', error);
  }
}

// Render Functions
function renderProducts() {
  // 计算分页
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageProducts = filteredProducts.slice(start, end);

  if (filteredProducts.length === 0) {
    elements.productGrid.innerHTML = `
      <div class="empty-state">
        <p>未找到商品</p>
      </div>
    `;
    return;
  }

  elements.productGrid.innerHTML = pageProducts.map(product => `
    <div class="product-card" data-id="${product.id}">
      <div class="name" title="${product.name}">${product.name}</div>
      <div class="prices">
        <div class="price-box buy">
          <span class="label">买入</span>
          <span class="price">${formatPrice(product.buyPrice)}</span>
        </div>
        <div class="price-box sell">
          <span class="label">卖出</span>
          <span class="price">${formatPrice(product.sellPrice)}</span>
        </div>
      </div>
      <div class="volume">
        📊 ${formatNumber(product.buyVolume)} / ${formatNumber(product.sellVolume)}
      </div>
      ${product.npcBuyPrice != null ? `
        <div class="npc-tag" title="NPC 购买价（${product.npcSource}）">
          🏪 NPC ${formatPrice(product.npcBuyPrice)}
          ${product.buyPrice && product.npcBuyPrice < product.buyPrice ? '<span class="npc-cheap">更便宜</span>' : ''}
        </div>` : ''}
    </div>
  `).join('');

  // Bind click events
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => loadProductDetail(card.dataset.id));
  });
}

// 分页控件
function renderPagination() {
  totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  // 检查是否已有分页控件
  let pagination = document.getElementById('pagination');
  if (!pagination) {
    // 创建分页控件
    pagination = document.createElement('div');
    pagination.id = 'pagination';
    pagination.className = 'pagination';
    elements.productGrid.parentElement.appendChild(pagination);
  }

  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let html = '';

  // 上一页
  html += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">上一页</button>`;

  // 页码
  const maxPages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
  let endPage = Math.min(totalPages, startPage + maxPages - 1);

  if (endPage - startPage < maxPages - 1) {
    startPage = Math.max(1, endPage - maxPages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }

  // 下一页
  html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">下一页</button>`;

  // 总数信息
  html += `<span class="page-info">${filteredProducts.length} 个商品，第 ${currentPage}/${totalPages} 页</span>`;

  pagination.innerHTML = html;
}

// 全局函数供分页按钮调用
window.goToPage = function(page) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderProducts();
  renderPagination();
  // 滚动到顶部
  elements.productGrid.scrollTop = 0;
};

function renderFavorites() {
  if (favorites.length === 0) {
    elements.favoritesList.innerHTML = '<li style="color: var(--text-muted); font-size: 0.75rem;">暂无收藏</li>';
    return;
  }

  const favoriteProducts = products.filter(p => favorites.includes(p.id));

  elements.favoritesList.innerHTML = favoriteProducts.map(product => `
    <li data-id="${product.id}">
      <span>${product.name}</span>
      <span class="remove-fav" data-id="${product.id}">×</span>
    </li>
  `).join('');

  // Bind events
  elements.favoritesList.querySelectorAll('li').forEach(li => {
    const id = li.dataset.id;
    li.addEventListener('click', (e) => {
      if (!e.target.classList.contains('remove-fav')) {
        loadProductDetail(id);
      }
    });
  });

  elements.favoritesList.querySelectorAll('.remove-fav').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await removeFavorite(btn.dataset.id);
    });
  });
}

// 倒卖机会：NPC 价 < bazaar 买入价（挂卖能收到的钱）即有利可图
function renderFlips() {
  const flips = products
    .filter(p => p.npcBuyPrice != null && p.buyPrice > 0 && p.buyPrice > p.npcBuyPrice && p.buyVolume >= 1000)
    .map(p => ({
      product: p,
      profit: Math.round((p.buyPrice - p.npcBuyPrice) * 100) / 100,
      margin: (p.buyPrice - p.npcBuyPrice) / p.npcBuyPrice
    }))
    .sort((a, b) => b.profit - a.profit);

  elements.flipsCount.textContent = flips.length ? `(${flips.length})` : '';

  if (flips.length === 0) {
    elements.flipsList.innerHTML = '<li style="color: var(--text-muted); font-size: 0.75rem;">暂无倒卖机会</li>';
    return;
  }

  elements.flipsList.innerHTML = flips.map(({ product, profit, margin }) => `
    <li data-id="${product.id}" title="${product.name} · 从 ${product.npcSource} 进货，bazaar 卖出赚 ${formatPrice(profit)}">
      <span class="flip-name">${product.name}</span>
      <span class="flip-profit">+${formatPrice(profit)} <em>${Math.round(margin * 100)}%</em></span>
    </li>
  `).join('');

  elements.flipsList.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => loadProductDetail(li.dataset.id));
  });
}

function renderProductDetail(product) {
  document.getElementById('detailName').textContent = product.name;
  document.getElementById('detailBuyPrice').textContent = formatPrice(product.buyPrice);
  document.getElementById('detailSellPrice').textContent = formatPrice(product.sellPrice);
  document.getElementById('detailBuyOrders').textContent = `${formatNumber(product.buyOrders)} 订单`;
  document.getElementById('detailSellOrders').textContent = `${formatNumber(product.sellOrders)} 订单`;
  document.getElementById('detailBuyVolume').textContent = formatNumber(product.buyVolume);
  document.getElementById('detailSellVolume').textContent = formatNumber(product.sellVolume);

  // NPC 购买价
  const npcInfo = document.getElementById('npcInfo');
  const npcHint = document.getElementById('npcHint');
  if (product.npcBuyPrice != null) {
    npcInfo.style.display = 'flex';
    document.getElementById('detailNpcPrice').textContent = formatPrice(product.npcBuyPrice) + `（${product.npcSource}）`;
    if (product.buyPrice && product.npcBuyPrice < product.buyPrice) {
      npcHint.textContent = '⚡ 比 bazaar 买入价低，可从 NPC 进货';
      npcHint.className = 'hint cheap';
    } else {
      npcHint.textContent = '';
      npcHint.className = 'hint';
    }
  } else {
    npcInfo.style.display = 'none';
  }

  // Update favorite button
  const favoriteBtn = document.getElementById('favoriteBtn');
  favoriteBtn.classList.toggle('active', favorites.includes(product.id));
  favoriteBtn.onclick = () => toggleFavorite(product.id);

  // Render chart
  renderPriceChart(product);
}

function renderPriceChart(product) {
  const ctx = document.getElementById('priceChart').getContext('2d');
  const history = product.history || [];

  if (priceChart) {
    priceChart.destroy();
  }

  if (history.length === 0) {
    document.querySelector('.chart-container canvas').style.display = 'none';
    document.querySelector('.chart-container').insertAdjacentHTML('beforeend',
      '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">暂无历史数据</p>');
    return;
  }

  document.querySelector('.chart-container canvas').style.display = 'block';
  const existingMsg = document.querySelector('.chart-container p');
  if (existingMsg) existingMsg.remove();

  const labels = history.map(h => new Date(h.timestamp).toLocaleDateString());
  const buyPrices = history.map(h => h.buyPrice);
  const sellPrices = history.map(h => h.sellPrice);

  // Create gradient backgrounds
  const buyGradient = ctx.createLinearGradient(0, 0, 0, 200);
  buyGradient.addColorStop(0, 'rgba(255, 107, 107, 0.2)');
  buyGradient.addColorStop(1, 'rgba(255, 107, 107, 0)');

  const sellGradient = ctx.createLinearGradient(0, 0, 0, 200);
  sellGradient.addColorStop(0, 'rgba(78, 205, 196, 0.2)');
  sellGradient.addColorStop(1, 'rgba(78, 205, 196, 0)');

  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '买入价格',
          data: buyPrices,
          borderColor: '#ff6b6b',
          backgroundColor: buyGradient,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#ff6b6b',
          tension: 0.4,
          fill: true
        },
        {
          label: '卖出价格',
          data: sellPrices,
          borderColor: '#4ecdc4',
          backgroundColor: sellGradient,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#4ecdc4',
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#8899a6',
            font: { size: 11 },
            usePointStyle: true,
            padding: 15
          }
        },
        tooltip: {
          backgroundColor: '#1a1f26',
          titleColor: '#fff',
          bodyColor: '#8899a6',
          borderColor: '#2f3943',
          borderWidth: 1,
          padding: 10,
          displayColors: true,
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + formatPrice(context.raw);
            }
          }
        },
        zoom: {
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: 'x'
          },
          pan: {
            enabled: true,
            mode: 'x'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#657786',
            maxTicksLimit: 8,
            font: { size: 10 }
          },
          grid: { color: '#2f3943', drawBorder: false }
        },
        y: {
          ticks: {
            color: '#657786',
            font: { size: 10 },
            callback: function(value) {
              return formatPrice(value);
            }
          },
          grid: { color: '#2f3943', drawBorder: false }
        }
      }
    }
  });
}

// Event Handlers
function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  filterProducts(query, elements.showFavoritesOnly.checked);
}

function handleFilterChange() {
  const query = elements.searchInput.value.toLowerCase();
  filterProducts(query, elements.showFavoritesOnly.checked);
}

function filterProducts(query, favoritesOnly) {
  let filtered = products;

  // 按分类筛选
  if (currentCategory && currentCategory !== 'all') {
    const categoryData = CATEGORY_MAP[currentCategory];
    if (categoryData) {
      // 如果有选中的子分类
      if (currentSubcategory && currentSubcategory !== 'all' && categoryData.subcategories) {
        const subData = categoryData.subcategories[currentSubcategory];
        if (subData && subData.ids) {
          filtered = filtered.filter(p => subData.ids.includes(p.id));
        }
      } else {
        // 没有子分类选中，显示该分类下的所有物品
        const allIds = new Set();
        for (const sub of Object.values(categoryData.subcategories || {})) {
          if (sub.ids) sub.ids.forEach(id => allIds.add(id));
        }
        filtered = filtered.filter(p => allIds.has(p.id));
      }
    }
  }

  if (query) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query)
    );
  }

  if (favoritesOnly) {
    filtered = filtered.filter(p => favorites.includes(p.id));
  }

  filteredProducts = filtered;
  currentPage = 1;
  renderProducts();
  renderPagination();
}

async function refreshData() {
  elements.refreshBtn.disabled = true;
  elements.refreshBtn.innerHTML = '<span class="btn-icon">⏳</span> 刷新中...';

  await loadProducts();
  await loadFavorites();

  elements.refreshBtn.disabled = false;
  elements.refreshBtn.innerHTML = '<span class="btn-icon">🔄</span> 刷新';
}

function closeDetailPanel() {
  elements.detailPanel.classList.remove('active');
  selectedProduct = null;
  document.querySelectorAll('.product-card.selected').forEach(card => {
    card.classList.remove('selected');
  });
}

async function toggleFavorite(productId) {
  if (favorites.includes(productId)) {
    await removeFavorite(productId);
  } else {
    await addFavorite(productId);
  }
}

async function addFavorite(productId) {
  try {
    const response = await fetch(`${API_BASE}/api/favorites/${productId}`, { method: 'POST' });
    const data = await response.json();

    if (data.success) {
      favorites = data.data;
      renderFavorites();
      if (selectedProduct && selectedProduct.id === productId) {
        document.getElementById('favoriteBtn').classList.add('active');
      }
    }
  } catch (error) {
    console.error('Failed to add favorite:', error);
  }
}

async function removeFavorite(productId) {
  try {
    const response = await fetch(`${API_BASE}/api/favorites/${productId}`, { method: 'DELETE' });
    const data = await response.json();

    if (data.success) {
      favorites = data.data;
      renderFavorites();
      if (selectedProduct && selectedProduct.id === productId) {
        document.getElementById('favoriteBtn').classList.remove('active');
      }
    }
  } catch (error) {
    console.error('Failed to remove favorite:', error);
  }
}

async function exportData(format) {
  const url = `${API_BASE}/api/export?format=${format}`;
  window.open(url, '_blank');
  elements.exportModal.classList.remove('active');
}

// Utility Functions
function showLoading(loading) {
  const loadingEl = document.getElementById('loading');
  if (!loadingEl) return;
  if (loading) {
    loadingEl.style.display = 'flex';
  } else {
    loadingEl.style.display = 'none';
  }
}

function showError(message) {
  elements.productGrid.innerHTML = `
    <div class="empty-state">
      <p>❌ ${message}</p>
    </div>
  `;
}

function formatPrice(price) {
  if (!price || price === 0) return '-';
  if (price >= 1000000) return `${(price / 1000000).toFixed(2)}M`;
  if (price >= 1000) return `${(price / 1000).toFixed(1)}k`;
  return price.toString();
}

function formatNumber(num) {
  if (!num || num === 0) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}

function updateLastUpdated(timestamp) {
  if (timestamp) {
    const date = new Date(timestamp);
    elements.lastUpdated.textContent = `最后更新：${date.toLocaleTimeString()}`;
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function startAutoRefresh() {
  setInterval(async () => {
    await loadProducts();
    if (selectedProduct) {
      await loadProductDetail(selectedProduct.id);
    }
  }, 300000); // 每5分钟刷新一次
}
