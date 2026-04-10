import {addToCart, syncCartFromStorage} from './cart.js';
import {getProductById, getProductsByCategory, normalizeCategory} from './products.js';
import {updateCartBadge} from './site-shell.js';
import {
  animateAddButton,
  attachProductGridInteractions,
  initProductModal,
  renderProductGrid,
  showToast
} from './ui.js';

const CATEGORY_LABELS = {
  utensils: 'Utensils Deals',
  clothes: 'Fashion Picks',
  electronics: 'Electronics Essentials',
  books: 'Books and Learning',
  deals: 'Today Deals'
};

const params = new URLSearchParams(window.location.search);
const requestedCategory = normalizeCategory(params.get('category') || 'utensils');

let activeCategory = requestedCategory;
let matchedProducts = getProductsByCategory(activeCategory, {limit: 12});

if (matchedProducts.length === 0) {
  activeCategory = 'utensils';
  matchedProducts = getProductsByCategory(activeCategory, {limit: 12});
}

const categoryGrid = document.querySelector('.js-category-grid');
const categoryTitleElement = document.querySelector('.js-category-title');
const categoryCountElement = document.querySelector('.js-category-count');

categoryTitleElement.textContent = CATEGORY_LABELS[activeCategory] || 'Category Deals';

if (categoryCountElement) {
  categoryCountElement.textContent = `${matchedProducts.length} items loaded`;
}

renderProductGrid({
  container: categoryGrid,
  products: matchedProducts,
  variant: 'category'
});

function updateCartQuantity() {
  const quantity = syncCartFromStorage().reduce((sum, item) => sum + item.quantity, 0);
  const cartBadge = document.querySelector('.js-cart-quantity');

  if (cartBadge) {
    cartBadge.textContent = quantity;
  }
}

function handleAddToCart(productId, button) {
  addToCart(productId);
  updateCartQuantity();
  updateCartBadge();
  animateAddButton(button);

  const product = getProductById(productId);
  const message = product ? `${product.name} added to cart` : 'Item added to cart';
  showToast(message, 1400);
}

initProductModal({
  onAddToCart: handleAddToCart
});

attachProductGridInteractions({
  container: categoryGrid,
  getProductById,
  onAddToCart: handleAddToCart
});

updateCartQuantity();
