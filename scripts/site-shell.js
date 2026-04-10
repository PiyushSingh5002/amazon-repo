import {getCartQuantity, syncCartFromStorage} from './cart.js';
import {getCurrentUser, logoutUser} from './auth.js';

function ensureAccountLink() {
  const headerRightSection = document.querySelector('.tih-header-right-section');

  if (!headerRightSection) {
    return null;
  }

  let accountLink = headerRightSection.querySelector('.js-account-link');

  if (accountLink) {
    return accountLink;
  }

  accountLink = document.createElement('a');
  accountLink.className = 'orders-link header-link js-account-link';
  accountLink.innerHTML = `
    <span class="small-line js-account-small">Hello, Guest</span>
    <span class="big-line js-account-big">Sign in</span>
  `;

  const ordersLink = headerRightSection.querySelector('.orders-link');

  if (ordersLink) {
    headerRightSection.insertBefore(accountLink, ordersLink);
  } else {
    headerRightSection.prepend(accountLink);
  }

  return accountLink;
}

export function updateCartBadge() {
  syncCartFromStorage();
  const quantity = getCartQuantity();

  document.querySelectorAll('.js-cart-quantity').forEach((badgeElement) => {
    badgeElement.textContent = quantity;
  });
}

export function updateAuthNavbar() {
  const currentUser = getCurrentUser();
  const accountLink = ensureAccountLink();

  if (!accountLink) {
    return;
  }

  const smallLine = accountLink.querySelector('.js-account-small');
  const bigLine = accountLink.querySelector('.js-account-big');

  if (currentUser) {
    accountLink.href = 'address-book.html';

    if (smallLine) {
      smallLine.textContent = `Hello, ${currentUser.name}`;
    }

    if (bigLine) {
      bigLine.textContent = currentUser.email;
    }
  } else {
    accountLink.href = 'login.html';

    if (smallLine) {
      smallLine.textContent = 'Hello, Guest';
    }

    if (bigLine) {
      bigLine.textContent = 'Sign in';
    }
  }
}

export function attachLogoutHandler() {
  const logoutButton = document.querySelector('.js-logout-button');

  if (!logoutButton) {
    return;
  }

  logoutButton.addEventListener('click', (event) => {
    event.preventDefault();
    logoutUser();
    alert('Logged out successfully.');
    window.location.href = 'index.html';
  });
}

export function initSiteShell() {
  updateCartBadge();
  updateAuthNavbar();
  attachLogoutHandler();
}

initSiteShell();
