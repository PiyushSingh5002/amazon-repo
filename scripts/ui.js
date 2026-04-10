import {formatCurrency} from './utils/money.js';

let modalElement;
let modalAddButton;
let modalProductName;
let modalProductImage;
let modalProductPrice;
let modalProductRating;
let modalProductDescription;
let addToCartHandler = null;
let toastTimeoutId;

function getRatingData(product) {
  if (typeof product.rating === 'number') {
    return {
      stars: product.rating,
      count: 0
    };
  }

  return {
    stars: product.rating?.stars || 0,
    count: product.rating?.count || 0
  };
}

function getRatingText(product) {
  const {stars, count} = getRatingData(product);

  if (!count) {
    return `⭐ ${stars.toFixed(1)}`;
  }

  return `⭐ ${stars.toFixed(1)} (${count.toLocaleString()})`;
}

function createHomeCardMarkup(product) {
  return `
    <article class="product-card js-product-card" data-product-id="${product.id}" tabindex="0" role="button"
      aria-label="View details for ${product.name}">
      <div class="product-image-wrap">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <h3 class="limit-text-to-2-lines">${product.name}</h3>
      <div class="product-rating">${getRatingText(product)}</div>
      <div class="product-price">Rs. ${formatCurrency(product.price)}</div>
      <button class="button-primary add-to-cart-button js-add-to-cart" data-product-id="${product.id}" type="button">
        Add to Cart
      </button>
    </article>
  `;
}

function createCategoryCardMarkup(product) {
  return `
    <article class="category-item js-product-card" data-product-id="${product.id}" tabindex="0" role="button"
      aria-label="View details for ${product.name}">
      <img src="${product.image}" alt="${product.name}">
      <h3 class="limit-text-to-2-lines">${product.name}</h3>
      <div class="category-rating">${getRatingText(product)}</div>
      <div class="category-price">Rs. ${formatCurrency(product.price)}</div>
      <button class="add-to-cart-button button-primary js-add-to-cart" data-product-id="${product.id}" type="button">
        Add to Cart
      </button>
    </article>
  `;
}

export function renderProductGrid({container, products, variant = 'home'}) {
  if (!container) {
    return;
  }

  const markupBuilder = variant === 'category' ? createCategoryCardMarkup : createHomeCardMarkup;
  container.innerHTML = products.map((product) => markupBuilder(product)).join('');
}

export function renderMiniCategoryGrid({container, products}) {
  if (!container) {
    return;
  }

  container.innerHTML = products
    .map((product) => `
      <article class="mini-item">
        <img src="${product.image}" alt="${product.name}">
        <p class="limit-text-to-2-lines">${product.name}</p>
      </article>
    `)
    .join('');
}

function ensureModal() {
  if (modalElement) {
    return;
  }

  modalElement = document.createElement('section');
  modalElement.className = 'product-modal js-product-modal';
  modalElement.innerHTML = `
    <div class="product-modal-backdrop js-close-product-modal"></div>
    <article class="product-modal-dialog" role="dialog" aria-modal="true" aria-label="Product details">
      <button class="product-modal-close js-close-product-modal" type="button" aria-label="Close product details">×</button>
      <div class="product-modal-layout">
        <div class="product-modal-media">
          <img class="js-product-modal-image" src="" alt="">
        </div>
        <div class="product-modal-content">
          <h2 class="js-product-modal-name"></h2>
          <p class="product-modal-rating js-product-modal-rating"></p>
          <p class="product-modal-price js-product-modal-price"></p>
          <p class="product-modal-description js-product-modal-description"></p>
          <button class="button-primary product-modal-add-button js-product-modal-add" type="button">Add to Cart</button>
        </div>
      </div>
    </article>
  `;

  document.body.append(modalElement);

  modalAddButton = modalElement.querySelector('.js-product-modal-add');
  modalProductName = modalElement.querySelector('.js-product-modal-name');
  modalProductImage = modalElement.querySelector('.js-product-modal-image');
  modalProductPrice = modalElement.querySelector('.js-product-modal-price');
  modalProductRating = modalElement.querySelector('.js-product-modal-rating');
  modalProductDescription = modalElement.querySelector('.js-product-modal-description');

  modalElement.addEventListener('click', (event) => {
    if (event.target.closest('.js-close-product-modal')) {
      closeProductModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeProductModal();
    }
  });

  modalAddButton.addEventListener('click', () => {
    const productId = modalAddButton.dataset.productId;

    if (!productId || !addToCartHandler) {
      return;
    }

    addToCartHandler(productId, modalAddButton);
    closeProductModal();
  });
}

export function initProductModal(options = {}) {
  addToCartHandler = options.onAddToCart || null;
  ensureModal();
}

export function openProductModal(product) {
  ensureModal();

  if (!product) {
    return;
  }

  const ratingText = getRatingText(product);

  modalProductName.textContent = product.name;
  modalProductImage.src = product.image;
  modalProductImage.alt = product.name;
  modalProductPrice.textContent = `Rs. ${formatCurrency(product.price)}`;
  modalProductRating.textContent = ratingText;
  modalProductDescription.textContent = product.description || 'No description available.';
  modalAddButton.dataset.productId = product.id;

  modalElement.classList.add('is-open');
  document.body.classList.add('modal-open');
}

export function closeProductModal() {
  if (!modalElement) {
    return;
  }

  modalElement.classList.remove('is-open');
  document.body.classList.remove('modal-open');
}

export function animateAddButton(button) {
  if (!button) {
    return;
  }

  button.classList.remove('added');
  void button.offsetWidth;
  button.classList.add('added');
}

export function showToast(message, duration = 1500) {
  const toastElement = document.querySelector('.js-toast');

  if (!toastElement) {
    return;
  }

  toastElement.textContent = message;
  toastElement.classList.add('show');

  clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => {
    toastElement.classList.remove('show');
  }, duration);
}

export function attachProductGridInteractions({container, getProductById, onAddToCart}) {
  if (!container) {
    return;
  }

  container.addEventListener('click', (event) => {
    const addButton = event.target.closest('.js-add-to-cart');

    if (addButton && container.contains(addButton)) {
      event.preventDefault();
      onAddToCart(addButton.dataset.productId, addButton);
      return;
    }

    const productCard = event.target.closest('.js-product-card');

    if (!productCard || !container.contains(productCard)) {
      return;
    }

    const product = getProductById(productCard.dataset.productId);

    if (product) {
      openProductModal(product);
    }
  });

  container.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    const productCard = event.target.closest('.js-product-card');

    if (!productCard || !container.contains(productCard)) {
      return;
    }

    if (event.target.closest('.js-add-to-cart')) {
      return;
    }

    event.preventDefault();

    const product = getProductById(productCard.dataset.productId);

    if (product) {
      openProductModal(product);
    }
  });
}
