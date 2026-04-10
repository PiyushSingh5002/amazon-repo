import {addToCart, syncCartFromStorage} from './cart.js';
import {getProducts, getProductById, getProductsByCategory, normalizeCategory} from './products.js';
import {updateCartBadge} from './site-shell.js';
import {
  animateAddButton,
  attachProductGridInteractions,
  initProductModal,
  renderMiniCategoryGrid as renderMiniGridCards,
  renderProductGrid as renderProducts,
  showToast
} from './ui.js';

const CATEGORY_TITLES = {
  all: 'All Products',
  deals: 'Today Deals',
  electronics: 'Electronics',
  fashion: 'Fashion Picks',
  clothes: 'Fashion Picks',
  books: 'Books and Learning',
  utensils: 'Utensils Deals'
};

let selectedCategory = 'all';
const PRODUCTS_PER_VIEW = 12;

const productsTitleElement = document.querySelector('.js-products-title');
const productsCountElement = document.querySelector('.js-products-count');
const productsGridElement = document.querySelector('.js-filtered-products-grid');
const productsSectionElement = document.querySelector('.products-section');

function getFilteredProducts(category) {
  const normalizedCategory = normalizeCategory(category);

  if (normalizedCategory === 'all') {
    return getProducts();
  }

  return getProductsByCategory(normalizedCategory, {limit: PRODUCTS_PER_VIEW});
}

function renderMainProductGrid() {
  const filteredProducts = getFilteredProducts(selectedCategory);

  productsGridElement.classList.add('is-updating');

  productsTitleElement.textContent = CATEGORY_TITLES[selectedCategory] || 'Products';
  productsCountElement.textContent = `${filteredProducts.length} items`;

  renderProducts({
    container: productsGridElement,
    products: filteredProducts
  });

  requestAnimationFrame(() => {
    productsGridElement.classList.remove('is-updating');
  });
}

function renderMiniGrid(category) {
  const miniGrid = document.querySelector(`.js-mini-grid-${category}`);
  const products = getProductsByCategory(category, {limit: 4});

  if (!miniGrid) {
    return;
  }

  renderMiniGridCards({
    container: miniGrid,
    products
  });
}

function updateActiveCategoryUI() {
  document.querySelectorAll('.nav-chip').forEach((chip) => {
    chip.classList.toggle('is-active', normalizeCategory(chip.dataset.category) === selectedCategory);
  });

  document.querySelectorAll('.category-card').forEach((card) => {
    card.classList.toggle('is-active', card.dataset.category === normalizeCategory(selectedCategory));
  });
}

function setCategory(category, options = {}) {
  const {scrollToSection = true} = options;
  const normalizedCategory = normalizeCategory(category);

  if (selectedCategory === normalizedCategory) {
    return;
  }

  selectedCategory = normalizedCategory;
  updateActiveCategoryUI();
  renderMainProductGrid();

  if (scrollToSection && productsSectionElement) {
    productsSectionElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

function attachCategoryHandlers() {
  const secondaryNav = document.querySelector('.secondary-nav');
  const categoryDeck = document.querySelector('.category-deck');

  secondaryNav.addEventListener('click', (event) => {
    const chip = event.target.closest('.nav-chip');

    if (!chip) {
      return;
    }

    event.preventDefault();
    setCategory(chip.dataset.category);
  });

  categoryDeck.addEventListener('click', (event) => {
    const categoryCard = event.target.closest('.category-card');
    const seeMoreLink = event.target.closest('.see-more-link');

    if (seeMoreLink) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      event.preventDefault();
      setCategory(seeMoreLink.dataset.category);
      return;
    }

    if (categoryCard) {
      setCategory(categoryCard.dataset.category);
    }
  });

  categoryDeck.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    const categoryCard = event.target.closest('.category-card');

    if (!categoryCard) {
      return;
    }

    event.preventDefault();
    setCategory(categoryCard.dataset.category);
  });
}

function updateCartQuantity() {
  const cartItems = syncCartFromStorage();
  const cartQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartBadge = document.querySelector('.js-cart-quantity');

  if (!cartBadge) {
    return;
  }

  cartBadge.textContent = cartQuantity;
  cartBadge.classList.remove('bump');
  void cartBadge.offsetWidth;
  cartBadge.classList.add('bump');
}

function handleAddToCart(productId, button) {
  addToCart(productId);
  updateCartQuantity();
  updateCartBadge();
  animateAddButton(button);

  const product = getProductById(productId);
  const toastMessage = product ? `${product.name} added to cart` : 'Item added to cart';
  showToast(toastMessage);
}

function initHeroSlider() {
  const heroSlides = Array.from(document.querySelectorAll('.hero-slide'));
  const heroDotsContainer = document.querySelector('.js-hero-dots');
  const nextButton = document.querySelector('.js-hero-next');
  const prevButton = document.querySelector('.js-hero-prev');

  let currentSlideIndex = 0;
  let autoSlideIntervalId;

  function renderHeroDots() {
    heroDotsContainer.innerHTML = heroSlides
      .map((_, index) => `
        <button class="hero-dot ${index === currentSlideIndex ? 'is-active' : ''} js-hero-dot"
          data-index="${index}" aria-label="Go to slide ${index + 1}"></button>
      `)
      .join('');

    document.querySelectorAll('.js-hero-dot').forEach((dot) => {
      dot.addEventListener('click', () => {
        currentSlideIndex = Number(dot.dataset.index);
        updateHeroSlide();
        restartAutoSlide();
      });
    });
  }

  function updateHeroSlide() {
    heroSlides.forEach((slide, index) => {
      slide.classList.toggle('is-active', index === currentSlideIndex);
    });

    renderHeroDots();
  }

  function goToNextSlide() {
    currentSlideIndex = (currentSlideIndex + 1) % heroSlides.length;
    updateHeroSlide();
  }

  function goToPrevSlide() {
    currentSlideIndex = (currentSlideIndex - 1 + heroSlides.length) % heroSlides.length;
    updateHeroSlide();
  }

  function restartAutoSlide() {
    clearInterval(autoSlideIntervalId);
    autoSlideIntervalId = setInterval(goToNextSlide, 3000);
  }

  if (heroSlides.length > 0) {
    updateHeroSlide();
    restartAutoSlide();

    nextButton.addEventListener('click', () => {
      goToNextSlide();
      restartAutoSlide();
    });

    prevButton.addEventListener('click', () => {
      goToPrevSlide();
      restartAutoSlide();
    });
  }
}

function initSplashScreen() {
  const splashElement = document.querySelector('.js-splash-screen');
  const contentElement = document.querySelector('.js-home-content');

  if (!splashElement || !contentElement) {
    return;
  }

  setTimeout(() => {
    splashElement.classList.add('hidden');
    contentElement.classList.add('visible');
    document.body.classList.remove('page-loading');

    splashElement.addEventListener('transitionend', () => {
      splashElement.remove();
    }, {once: true});
  }, 1500);
}

function init() {
  initProductModal({
    onAddToCart: handleAddToCart
  });

  renderMiniGrid('deals');
  renderMiniGrid('utensils');
  renderMiniGrid('clothes');
  renderMiniGrid('electronics');
  renderMiniGrid('books');

  attachCategoryHandlers();
  attachProductGridInteractions({
    container: productsGridElement,
    getProductById,
    onAddToCart: handleAddToCart
  });

  selectedCategory = '';
  setCategory('all', {scrollToSection: false});
  updateCartQuantity();
  initHeroSlider();
  initSplashScreen();
}

init();
