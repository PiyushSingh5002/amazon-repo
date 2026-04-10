import {cart, removeFromCart, updateCartItemQuantity, clearCart, syncCartFromStorage} from './cart.js';
import {getProductById} from './products.js';
import {formatCurrency} from './utils/money.js';
import {requireAuth} from './auth.js';
import {
  getAddresses,
  getPaymentMethods,
  getSelectedAddressId,
  getSelectedPaymentId,
  setSelectedAddressId,
  setSelectedPaymentId
} from '../data/user-profile.js';

requireAuth('login.html');

const SHIPPING_CENTS = 499;

function getProduct(productId) {
  return getProductById(productId);
}

function getProductPriceCents(product) {
  if (!product) {
    return 0;
  }

  if (typeof product.price === 'number') {
    return product.price;
  }

  if (typeof product.priceCents === 'number') {
    return product.priceCents;
  }

  return 0;
}

function getCartQuantity() {
  syncCartFromStorage();
  return cart.reduce((total, cartItem) => total + cartItem.quantity, 0);
}

function getItemsTotalCents() {
  syncCartFromStorage();
  return cart.reduce((sum, cartItem) => {
    const product = getProduct(cartItem.productId);
    return sum + (getProductPriceCents(product) * cartItem.quantity);
  }, 0);
}

function renderCartSummary() {
  syncCartFromStorage();
  const orderSummaryElement = document.querySelector('.js-order-summary');

  if (cart.length === 0) {
    orderSummaryElement.innerHTML = `
      <div class="empty-cart-message">
        <h3>Your cart feels lonely right now.</h3>
        <p>Add something you love and we will deliver it fast.</p>
        <a class="link-primary" href="index.html">Continue shopping</a>
      </div>
    `;
    return;
  }

  orderSummaryElement.innerHTML = cart
    .map((cartItem) => {
      const product = getProduct(cartItem.productId);

      if (!product) {
        return '';
      }

      return `
        <div class="cart-item-container js-cart-item-container-${product.id}">
          <div class="delivery-date">Delivery in 2-4 working days</div>

          <div class="cart-item-details-grid">
            <img class="product-image" src="${product.image}">

            <div class="cart-item-details">
              <div class="product-name">${product.name}</div>
              <div class="product-price">Rs. ${formatCurrency(getProductPriceCents(product))}</div>
              <div class="product-quantity">
                <span>
                  Quantity:
                  <select class="js-quantity-select" data-product-id="${product.id}">
                    <option value="1" ${cartItem.quantity === 1 ? 'selected' : ''}>1</option>
                    <option value="2" ${cartItem.quantity === 2 ? 'selected' : ''}>2</option>
                    <option value="3" ${cartItem.quantity === 3 ? 'selected' : ''}>3</option>
                    <option value="4" ${cartItem.quantity === 4 ? 'selected' : ''}>4</option>
                    <option value="5" ${cartItem.quantity === 5 ? 'selected' : ''}>5</option>
                  </select>
                </span>
                <span class="delete-quantity-link link-primary js-delete-link" data-product-id="${product.id}">
                  Delete
                </span>
              </div>
            </div>

            <div class="delivery-options">
              <div class="delivery-options-title">Delivery option:</div>
              <div class="delivery-option">
                <input type="radio" checked class="delivery-option-input" name="delivery-option-${product.id}">
                <div>
                  <div class="delivery-option-date">Standard Delivery</div>
                  <div class="delivery-option-price">Rs. ${formatCurrency(SHIPPING_CENTS)} shipping once per order</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderAddressOptions() {
  const addresses = getAddresses();
  const selectedAddressId = getSelectedAddressId();
  const listElement = document.querySelector('.js-address-selection-list');

  if (addresses.length === 0) {
    listElement.innerHTML = '<p>Add a delivery address to continue.</p>';
    return;
  }

  listElement.innerHTML = addresses
    .map((address) => `
      <label class="selection-item">
        <input type="radio" name="selected-address" class="js-address-radio"
          value="${address.id}" ${address.id === selectedAddressId ? 'checked' : ''}>
        <div>
          <div class="selection-name">${address.fullName}</div>
          <div>${address.addressLine}, ${address.city}, ${address.state} - ${address.pinCode}</div>
          <div>Phone: ${address.phone}</div>
        </div>
      </label>
    `)
    .join('');

  document.querySelectorAll('.js-address-radio').forEach((radio) => {
    radio.addEventListener('change', () => {
      setSelectedAddressId(radio.value);
    });
  });
}

function renderPaymentOptions() {
  const paymentMethods = getPaymentMethods();
  const selectedPaymentId = getSelectedPaymentId();
  const listElement = document.querySelector('.js-payment-selection-list');

  if (paymentMethods.length === 0) {
    listElement.innerHTML = '<p>Add a card to continue.</p>';
    return;
  }

  listElement.innerHTML = paymentMethods
    .map((method) => `
      <label class="selection-item">
        <input type="radio" name="selected-payment" class="js-payment-radio"
          value="${method.id}" ${method.id === selectedPaymentId ? 'checked' : ''}>
        <div>
          <div class="selection-name">${method.cardName}</div>
          <div>${method.cardNumber}</div>
          <div>Expiry: ${method.expiry}</div>
        </div>
      </label>
    `)
    .join('');

  document.querySelectorAll('.js-payment-radio').forEach((radio) => {
    radio.addEventListener('change', () => {
      setSelectedPaymentId(radio.value);
    });
  });
}

function renderPaymentSummary() {
  const quantity = getCartQuantity();
  const itemsTotalCents = getItemsTotalCents();
  const shippingCents = quantity > 0 ? SHIPPING_CENTS : 0;
  const subtotalCents = itemsTotalCents + shippingCents;
  const taxCents = Math.round(subtotalCents * 0.1);
  const totalCents = subtotalCents + taxCents;

  document.querySelector('.js-return-to-home-link').textContent = `${quantity} items`;
  document.querySelector('.js-items-label').textContent = `Items (${quantity}):`;
  document.querySelector('.js-items-price').textContent = formatCurrency(itemsTotalCents);
  document.querySelector('.js-shipping-price').textContent = formatCurrency(shippingCents);
  document.querySelector('.js-subtotal-price').textContent = formatCurrency(subtotalCents);
  document.querySelector('.js-tax-price').textContent = formatCurrency(taxCents);
  document.querySelector('.js-total-price').textContent = formatCurrency(totalCents);
}

function attachDeleteHandlers() {
  document.querySelectorAll('.js-delete-link').forEach((link) => {
    link.addEventListener('click', () => {
      const productId = link.dataset.productId;
      removeFromCart(productId);
      renderAll();
    });
  });
}

function attachQuantityHandlers() {
  document.querySelectorAll('.js-quantity-select').forEach((select) => {
    select.addEventListener('change', () => {
      updateCartItemQuantity(select.dataset.productId, select.value);
      renderAll();
    });
  });
}

function renderAll() {
  renderCartSummary();
  renderPaymentSummary();
  renderAddressOptions();
  renderPaymentOptions();
  attachDeleteHandlers();
  attachQuantityHandlers();
}

document.querySelector('.js-place-order-button').addEventListener('click', () => {
  syncCartFromStorage();
  const hasAddress = getAddresses().length > 0;
  const hasPayment = getPaymentMethods().length > 0;

  if (cart.length === 0) {
    alert('Your cart is empty. Add a few products first.');
    return;
  }

  if (!hasAddress || !hasPayment) {
    alert('Please add both an address and a payment method before placing your order.');
    return;
  }

  clearCart();
  window.location.href = 'order-confirmation.html';
});

renderAll();