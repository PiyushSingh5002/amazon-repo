import {addToCart, syncCartFromStorage} from './cart.js';
import {getProducts, getProductById, getProductsByCategory, normalizeCategory, searchProducts} from './products.js';
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
let currentSearchQuery = '';
let currentSort = 'default';
const PRODUCTS_PER_VIEW = 12;

const productsTitleElement = document.querySelector('.js-products-title');
const productsCountElement = document.querySelector('.js-products-count');
const productsGridElement = document.querySelector('.js-filtered-products-grid');
const productsSectionElement = document.querySelector('.products-section');
const searchBarElement = document.querySelector('.search-bar');
const searchButtonElement = document.querySelector('.search-button');
const searchSuggestionsElement = document.querySelector('.js-search-suggestions');
const sortSelectElement = document.querySelector('.js-sort-select');

function getFilteredProducts(category) {
  const normalizedCategory = normalizeCategory(category);

  if (currentSearchQuery) {
    return searchProducts(currentSearchQuery);
  }

  if (normalizedCategory === 'all') {
    return getProducts();
  }

  return getProductsByCategory(normalizedCategory, {limit: PRODUCTS_PER_VIEW});
}

function sortProducts(products) {
  if (currentSort === 'default') {
    return products;
  }

  const sorted = [...products];

  switch (currentSort) {
    case 'price-low':
      sorted.sort((a, b) => (a.price || a.priceCents || 0) - (b.price || b.priceCents || 0));
      break;
    case 'price-high':
      sorted.sort((a, b) => (b.price || b.priceCents || 0) - (a.price || a.priceCents || 0));
      break;
    case 'rating': {
      sorted.sort((a, b) => {
        const ratingA = typeof a.rating === 'number' ? a.rating : (a.rating?.stars || 0);
        const ratingB = typeof b.rating === 'number' ? b.rating : (b.rating?.stars || 0);
        return ratingB - ratingA;
      });
      break;
    }
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  return sorted;
}

function renderMainProductGrid() {
  let filteredProducts = getFilteredProducts(selectedCategory);
  filteredProducts = sortProducts(filteredProducts);

  productsGridElement.classList.add('is-updating');

  if (currentSearchQuery) {
    productsTitleElement.textContent = `Results for \u201C${currentSearchQuery}\u201D`;
  } else {
    productsTitleElement.textContent = CATEGORY_TITLES[selectedCategory] || 'Products';
  }

  productsCountElement.textContent = `${filteredProducts.length} items`;

  if (filteredProducts.length === 0) {
    productsGridElement.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">\uD83D\uDD0D</div>
        <h3>No products found</h3>
        <p>Try a different search term or browse our categories above.</p>
      </div>
    `;
  } else {
    renderProducts({
      container: productsGridElement,
      products: filteredProducts
    });
  }

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

  // Clear search when switching categories
  currentSearchQuery = '';
  if (searchBarElement) {
    searchBarElement.value = '';
  }

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

/* ─── Search ─── */

function performSearch(query) {
  const trimmedQuery = (query || '').trim();

  if (!trimmedQuery) {
    currentSearchQuery = '';
    selectedCategory = 'all';
    updateActiveCategoryUI();
    renderMainProductGrid();
    return;
  }

  currentSearchQuery = trimmedQuery;

  // Deactivate all category chips while showing search results
  document.querySelectorAll('.nav-chip').forEach((chip) => chip.classList.remove('is-active'));
  document.querySelectorAll('.category-card').forEach((card) => card.classList.remove('is-active'));

  renderMainProductGrid();

  if (productsSectionElement) {
    productsSectionElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  hideSuggestions();
}

function showSuggestions(query) {
  if (!searchSuggestionsElement || !query || query.trim().length < 2) {
    hideSuggestions();
    return;
  }

  const results = searchProducts(query.trim()).slice(0, 6);
  const q = query.trim().toLowerCase();

  if (results.length === 0) {
    searchSuggestionsElement.innerHTML = `
      <div class="search-no-results">No products match \u201C<strong>${q}</strong>\u201D</div>
    `;
    searchSuggestionsElement.classList.add('is-visible');
    return;
  }

  searchSuggestionsElement.innerHTML = results
    .map((product) => {
      const name = product.name;
      const idx = name.toLowerCase().indexOf(q);
      let displayName = name;

      if (idx >= 0) {
        displayName =
          name.substring(0, idx) +
          `<span class="highlight">${name.substring(idx, idx + q.length)}</span>` +
          name.substring(idx + q.length);
      }

      return `
        <div class="search-suggestion-item" data-product-name="${name}">
          <img src="${product.image}" alt="" loading="lazy">
          <div class="search-suggestion-text">${displayName}</div>
        </div>
      `;
    })
    .join('');

  searchSuggestionsElement.classList.add('is-visible');

  searchSuggestionsElement.querySelectorAll('.search-suggestion-item').forEach((item) => {
    item.addEventListener('click', () => {
      searchBarElement.value = item.dataset.productName;
      performSearch(item.dataset.productName);
    });
  });
}

function hideSuggestions() {
  if (searchSuggestionsElement) {
    searchSuggestionsElement.classList.remove('is-visible');
  }
}

function attachSearchHandlers() {
  if (!searchBarElement || !searchButtonElement) {
    return;
  }

  searchButtonElement.addEventListener('click', () => {
    performSearch(searchBarElement.value);
  });

  searchBarElement.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      performSearch(searchBarElement.value);
    }
  });

  let debounceTimer;
  searchBarElement.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      showSuggestions(searchBarElement.value);
    }, 200);
  });

  searchBarElement.addEventListener('focus', () => {
    if (searchBarElement.value.trim().length >= 2) {
      showSuggestions(searchBarElement.value);
    }
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.tih-header-middle-section')) {
      hideSuggestions();
    }
  });
}

/* ─── Sort ─── */

function attachSortHandler() {
  if (!sortSelectElement) {
    return;
  }

  sortSelectElement.addEventListener('change', () => {
    currentSort = sortSelectElement.value;
    renderMainProductGrid();
  });
}

/* ─── Categories ─── */

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

/* ─── Cart ─── */

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

/* ─── Hero Slider ─── */

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

/* ─── Splash Screen ─── */

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

/* ─── Back to Top ─── */

function initBackToTop() {
  const btn = document.querySelector('.js-back-to-top');
  if (!btn) {
    return;
  }

  window.addEventListener('scroll', () => {
    btn.classList.toggle('is-visible', window.scrollY > 400);
  });

  btn.addEventListener('click', () => {
    window.scrollTo({top: 0, behavior: 'smooth'});
  });
}

/* ─── URL Search Param ─── */

function handleUrlSearchParam() {
  const params = new URLSearchParams(window.location.search);
  const query = params.get('search');

  if (query && searchBarElement) {
    searchBarElement.value = query;
    performSearch(query);
  }
}

/* ─── Init ─── */

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
  attachSearchHandlers();
  attachSortHandler();
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
  initBackToTop();
  handleUrlSearchParam();
}

init();
