const CARTS_KEY = 'tih-carts';
const SELECTED_PRODUCTS_KEY = 'tih-selected-products';
const CURRENT_USER_KEY = 'tih-current-user';

function getCartOwnerKey() {
  const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
  return currentUser?.email || 'guest';
}

function readCartsStore() {
  const cartsStore = JSON.parse(localStorage.getItem(CARTS_KEY));

  if (!cartsStore || typeof cartsStore !== 'object') {
    return {};
  }

  return cartsStore;
}

function saveCartsStore(cartsStore) {
  localStorage.setItem(CARTS_KEY, JSON.stringify(cartsStore));
}

function readSelectedStore() {
  const selectedStore = JSON.parse(localStorage.getItem(SELECTED_PRODUCTS_KEY));

  if (!selectedStore || typeof selectedStore !== 'object') {
    return {};
  }

  return selectedStore;
}

function saveSelectedStore(selectedStore) {
  localStorage.setItem(SELECTED_PRODUCTS_KEY, JSON.stringify(selectedStore));
}

function getOwnerCart(ownerKey = getCartOwnerKey()) {
  const cartsStore = readCartsStore();
  return Array.isArray(cartsStore[ownerKey]) ? cartsStore[ownerKey] : [];
}

function setOwnerCart(cartItems, ownerKey = getCartOwnerKey()) {
  const cartsStore = readCartsStore();
  cartsStore[ownerKey] = cartItems;
  saveCartsStore(cartsStore);
}

export let cart = getOwnerCart();

export function syncCartFromStorage() {
  cart = getOwnerCart();
  return cart;
}

export function saveToStorage() {
  setOwnerCart(cart);
}

export function addSelectedProduct(productId) {
  const ownerKey = getCartOwnerKey();
  const selectedStore = readSelectedStore();
  const selectedProducts = Array.isArray(selectedStore[ownerKey]) ? selectedStore[ownerKey] : [];

  const withoutCurrent = selectedProducts.filter((id) => id !== productId);
  withoutCurrent.unshift(productId);

  selectedStore[ownerKey] = withoutCurrent.slice(0, 20);
  saveSelectedStore(selectedStore);
}

export function getSelectedProducts() {
  const ownerKey = getCartOwnerKey();
  const selectedStore = readSelectedStore();
  return Array.isArray(selectedStore[ownerKey]) ? selectedStore[ownerKey] : [];
}

export function addToCart(productId) {
  syncCartFromStorage();

  let matchingItem = cart.find((cartItem) => cartItem.productId === productId);

  if (matchingItem) {
    matchingItem.quantity += 1;
  } else {
    matchingItem = {
      productId,
      quantity: 1
    };

    cart.push(matchingItem);
  }

  addSelectedProduct(productId);
  saveToStorage();
}

export function removeFromCart(productId) {
  syncCartFromStorage();
  cart = cart.filter((cartItem) => cartItem.productId !== productId);
  saveToStorage();
}

export function updateCartItemQuantity(productId, quantity) {
  syncCartFromStorage();

  const parsedQuantity = Number(quantity);

  if (Number.isNaN(parsedQuantity) || parsedQuantity < 1) {
    return;
  }

  cart = cart.map((cartItem) => {
    if (cartItem.productId !== productId) {
      return cartItem;
    }

    return {
      ...cartItem,
      quantity: parsedQuantity
    };
  });

  saveToStorage();
}

export function clearCart() {
  cart = [];
  saveToStorage();
}

export function getCartQuantity() {
  syncCartFromStorage();
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}
