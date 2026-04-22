import {storeProducts as defaultProducts} from '../data/store-products.js';

const PRODUCTS_KEY = 'tih-products';
const PRODUCTS_VERSION_KEY = 'tih-products-version';
const PRODUCTS_VERSION = 2;

function writeProducts(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  localStorage.setItem(PRODUCTS_VERSION_KEY, String(PRODUCTS_VERSION));
}

function initializeProductsStore() {
  const savedProducts = JSON.parse(localStorage.getItem(PRODUCTS_KEY));
  const savedVersion = Number(localStorage.getItem(PRODUCTS_VERSION_KEY));

  if (!Array.isArray(savedProducts) || savedProducts.length < 30 || savedVersion !== PRODUCTS_VERSION) {
    writeProducts(defaultProducts);
  }
}

export function normalizeCategory(category) {
  return category === 'fashion' ? 'clothes' : category;
}

export function getProducts() {
  initializeProductsStore();

  const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY));
  return Array.isArray(products) ? products : defaultProducts;
}

export function setProducts(products) {
  if (!Array.isArray(products)) {
    return;
  }

  writeProducts(products);
}

export function getProductById(productId) {
  return getProducts().find((product) => product.id === productId);
}

export function getProductsByCategory(category, options = {}) {
  const {limit} = options;
  const products = getProducts();
  const normalizedCategory = normalizeCategory(category);

  if (normalizedCategory === 'all') {
    return products;
  }

  if (normalizedCategory === 'deals') {
    const sortedDeals = [...products].sort((a, b) => a.price - b.price);
    return typeof limit === 'number' ? sortedDeals.slice(0, limit) : sortedDeals.slice(0, 12);
  }

  const filteredProducts = products.filter((product) => product.category === normalizedCategory);
  return typeof limit === 'number' ? filteredProducts.slice(0, limit) : filteredProducts;
}

export function searchProducts(query) {
  if (!query || !query.trim()) {
    return getProducts();
  }

  const terms = query.trim().toLowerCase().split(/\s+/);
  const products = getProducts();

  return products.filter((product) => {
    const name = (product.name || '').toLowerCase();
    const keywords = Array.isArray(product.keywords) ? product.keywords.join(' ').toLowerCase() : '';
    const category = (product.category || '').toLowerCase();
    const description = (product.description || '').toLowerCase();
    const searchable = `${name} ${keywords} ${category} ${description}`;

    return terms.every((term) => searchable.includes(term));
  });
}
