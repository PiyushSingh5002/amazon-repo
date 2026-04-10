const USERS_KEY = 'tih-users';
const CURRENT_USER_KEY = 'tih-current-user';

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function readUsers() {
  const users = JSON.parse(localStorage.getItem(USERS_KEY));
  return Array.isArray(users) ? users : [];
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getUsers() {
  return readUsers();
}

export function getCurrentUser() {
  const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));

  if (!currentUser || !currentUser.email) {
    return null;
  }

  return currentUser;
}

export function isAuthenticated() {
  return Boolean(getCurrentUser());
}

export function signupUser({name, email, password}) {
  const trimmedName = name.trim();
  const normalizedEmail = normalizeEmail(email);
  const trimmedPassword = password.trim();

  if (!trimmedName || !normalizedEmail || !trimmedPassword) {
    return {
      success: false,
      message: 'Please fill all required fields.'
    };
  }

  if (trimmedPassword.length < 6) {
    return {
      success: false,
      message: 'Password must be at least 6 characters.'
    };
  }

  const users = readUsers();
  const existingUser = users.find((user) => user.email === normalizedEmail);

  if (existingUser) {
    return {
      success: false,
      message: 'An account with this email already exists.'
    };
  }

  const newUser = {
    id: `user-${Date.now()}`,
    name: trimmedName,
    email: normalizedEmail,
    password: trimmedPassword
  };

  users.push(newUser);
  saveUsers(users);

  return {
    success: true,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email
    },
    message: 'Account created successfully. You can now log in.'
  };
}

export function loginUser({email, password}) {
  const normalizedEmail = normalizeEmail(email);
  const users = readUsers();

  const matchingUser = users.find((user) => {
    return user.email === normalizedEmail && user.password === password;
  });

  if (!matchingUser) {
    return {
      success: false,
      message: 'Invalid email or password.'
    };
  }

  const currentUser = {
    id: matchingUser.id,
    name: matchingUser.name,
    email: matchingUser.email
  };

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));

  return {
    success: true,
    user: currentUser,
    message: 'Login successful. Welcome back!'
  };
}

export function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function requireAuth(redirectPath = 'login.html') {
  if (isAuthenticated()) {
    return true;
  }

  window.location.href = redirectPath;
  return false;
}

export function redirectIfAuthenticated(redirectPath = 'index.html') {
  if (!isAuthenticated()) {
    return false;
  }

  window.location.href = redirectPath;
  return true;
}

function setMessage(messageElement, text, type) {
  if (!messageElement) {
    return;
  }

  messageElement.textContent = text;
  messageElement.className = `auth-message ${type}`;
}

export function initAuthForms() {
  const loginForm = document.querySelector('.js-login-form');
  const signupForm = document.querySelector('.js-signup-form');

  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(loginForm);
      const result = loginUser({
        email: formData.get('email').toString().trim(),
        password: formData.get('password').toString()
      });

      const messageElement = document.querySelector('.js-auth-message');
      setMessage(messageElement, result.message, result.success ? 'success' : 'error');

      if (result.success) {
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 700);
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(signupForm);
      const password = formData.get('password').toString();
      const confirmPassword = formData.get('confirmPassword').toString();
      const messageElement = document.querySelector('.js-auth-message');

      if (password !== confirmPassword) {
        setMessage(messageElement, 'Passwords do not match.', 'error');
        return;
      }

      const result = signupUser({
        name: formData.get('name').toString().trim(),
        email: formData.get('email').toString().trim(),
        password
      });

      setMessage(messageElement, result.message, result.success ? 'success' : 'error');

      if (result.success) {
        signupForm.reset();
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 900);
      }
    });
  }
}
