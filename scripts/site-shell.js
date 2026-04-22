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

  // Remove existing dropdown if present
  const existingDropdown = accountLink.querySelector('.account-dropdown');
  if (existingDropdown) {
    existingDropdown.remove();
  }

  if (currentUser) {
    accountLink.href = '#';
    accountLink.classList.add('has-dropdown');

    if (smallLine) {
      smallLine.textContent = `Hello, ${currentUser.name}`;
    }

    if (bigLine) {
      bigLine.textContent = 'Account \u25BE';
    }

    const dropdown = document.createElement('div');
    dropdown.className = 'account-dropdown js-account-dropdown';
    dropdown.innerHTML = `
      <div class="account-dropdown-header">
        <div class="account-dropdown-avatar">${currentUser.name.charAt(0).toUpperCase()}</div>
        <div>
          <div class="account-dropdown-name">${currentUser.name}</div>
          <div class="account-dropdown-email">${currentUser.email}</div>
        </div>
      </div>
      <div class="account-dropdown-links">
        <a href="orders.html"><span class="dd-icon">\uD83D\uDCE6</span> Your Orders</a>
        <a href="address-book.html"><span class="dd-icon">\uD83D\uDCCD</span> Address Book</a>
        <a href="payment-methods.html"><span class="dd-icon">\uD83D\uDCB3</span> Payment Methods</a>
        <a href="checkout.html"><span class="dd-icon">\uD83D\uDED2</span> Your Cart</a>
      </div>
      <button class="account-dropdown-signout js-logout-button" type="button">
        \uD83D\uDEAA Sign Out
      </button>
    `;

    accountLink.appendChild(dropdown);

    // Prevent clicks inside dropdown from navigating the parent link, but allow signout to bubble
    dropdown.addEventListener('click', (e) => {
      if (!e.target.closest('.js-logout-button')) {
        e.stopPropagation();
      }
    });
  } else {
    accountLink.href = 'login.html';
    accountLink.classList.remove('has-dropdown');

    if (smallLine) {
      smallLine.textContent = 'Hello, Guest';
    }

    if (bigLine) {
      bigLine.textContent = 'Sign in';
    }
  }
}

export function attachLogoutHandler() {
  // Use event delegation so dynamically created logout buttons work
  document.addEventListener('click', (event) => {
    const logoutButton = event.target.closest('.js-logout-button');

    if (!logoutButton) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    logoutUser();
    window.location.href = 'index.html';
  });
}

function ensureDarkModeToggle() {
  const headerRightSection = document.querySelector('.tih-header-right-section');
  if (!headerRightSection) {
    return null;
  }

  let toggle = headerRightSection.querySelector('.js-dark-mode-toggle');
  if (toggle) {
    return toggle;
  }

  toggle = document.createElement('button');
  toggle.className = 'dark-mode-toggle js-dark-mode-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Toggle dark mode');
  toggle.textContent = '\uD83C\uDF19';
  headerRightSection.prepend(toggle);

  return toggle;
}

function initDarkMode() {
  const toggle = ensureDarkModeToggle();
  if (!toggle) {
    return;
  }

  const saved = localStorage.getItem('tih-dark-mode');
  if (saved === 'true') {
    document.body.classList.add('dark-mode');
    toggle.textContent = '\u2600\uFE0F';
  }

  toggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    toggle.textContent = isDark ? '\u2600\uFE0F' : '\uD83C\uDF19';
    localStorage.setItem('tih-dark-mode', isDark);
  });
}

function attachSearchRedirectHandler() {
  // Skip on the main products page where takeitHome.js handles search
  if (document.querySelector('.js-filtered-products-grid')) {
    return;
  }

  const searchBar = document.querySelector('.search-bar');
  const searchButton = document.querySelector('.search-button');

  if (!searchBar || !searchButton) {
    return;
  }

  function redirectSearch() {
    const query = searchBar.value.trim();
    if (query) {
      window.location.href = `index.html?search=${encodeURIComponent(query)}`;
    }
  }

  searchButton.addEventListener('click', redirectSearch);
  searchBar.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      redirectSearch();
    }
  });
}

export function initSiteShell() {
  updateCartBadge();
  updateAuthNavbar();
  attachLogoutHandler();
  initDarkMode();
  attachSearchRedirectHandler();
}

initSiteShell();
