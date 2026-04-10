const ADDRESSES_KEY = 'takeit-home-addresses';
const PAYMENTS_KEY = 'takeit-home-payments';
const SELECTED_ADDRESS_KEY = 'takeit-home-selected-address';
const SELECTED_PAYMENT_KEY = 'takeit-home-selected-payment';

function readFromStorage(key, fallbackValue) {
  const rawValue = localStorage.getItem(key);

  if (!rawValue) {
    return fallbackValue;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return fallbackValue;
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function getDefaultAddresses() {
  return [{
    id: makeId('addr'),
    fullName: 'Sample User',
    phone: '9876543210',
    addressLine: '221B Student Lane',
    city: 'Pune',
    state: 'Maharashtra',
    pinCode: '411001'
  }];
}

function getDefaultPaymentMethods() {
  return [{
    id: makeId('pay'),
    cardName: 'Student Visa Card',
    cardNumber: '**** **** **** 1025',
    expiry: '12/28'
  }];
}

export function getAddresses() {
  const savedAddresses = readFromStorage(ADDRESSES_KEY, null);

  if (!savedAddresses) {
    const defaults = getDefaultAddresses();
    saveToStorage(ADDRESSES_KEY, defaults);
    return defaults;
  }

  return savedAddresses;
}

export function addAddress(address) {
  const addresses = getAddresses();
  const newAddress = {
    ...address,
    id: makeId('addr')
  };

  addresses.push(newAddress);
  saveToStorage(ADDRESSES_KEY, addresses);

  if (!localStorage.getItem(SELECTED_ADDRESS_KEY)) {
    localStorage.setItem(SELECTED_ADDRESS_KEY, newAddress.id);
  }
}

export function deleteAddress(addressId) {
  const updatedAddresses = getAddresses().filter((address) => address.id !== addressId);
  saveToStorage(ADDRESSES_KEY, updatedAddresses);

  const selectedAddressId = getSelectedAddressId();
  if (selectedAddressId === addressId) {
    const fallback = updatedAddresses[0]?.id || '';
    localStorage.setItem(SELECTED_ADDRESS_KEY, fallback);
  }
}

export function getPaymentMethods() {
  const savedMethods = readFromStorage(PAYMENTS_KEY, null);

  if (!savedMethods) {
    const defaults = getDefaultPaymentMethods();
    saveToStorage(PAYMENTS_KEY, defaults);
    return defaults;
  }

  return savedMethods;
}

export function addPaymentMethod(method) {
  const paymentMethods = getPaymentMethods();
  const newMethod = {
    ...method,
    id: makeId('pay')
  };

  paymentMethods.push(newMethod);
  saveToStorage(PAYMENTS_KEY, paymentMethods);

  if (!localStorage.getItem(SELECTED_PAYMENT_KEY)) {
    localStorage.setItem(SELECTED_PAYMENT_KEY, newMethod.id);
  }
}

export function deletePaymentMethod(paymentId) {
  const updatedMethods = getPaymentMethods().filter((method) => method.id !== paymentId);
  saveToStorage(PAYMENTS_KEY, updatedMethods);

  const selectedPaymentId = getSelectedPaymentId();
  if (selectedPaymentId === paymentId) {
    const fallback = updatedMethods[0]?.id || '';
    localStorage.setItem(SELECTED_PAYMENT_KEY, fallback);
  }
}

export function getSelectedAddressId() {
  const addresses = getAddresses();
  const selectedAddressId = localStorage.getItem(SELECTED_ADDRESS_KEY);

  if (!selectedAddressId && addresses[0]?.id) {
    localStorage.setItem(SELECTED_ADDRESS_KEY, addresses[0].id);
    return addresses[0].id;
  }

  return selectedAddressId;
}

export function getSelectedPaymentId() {
  const paymentMethods = getPaymentMethods();
  const selectedPaymentId = localStorage.getItem(SELECTED_PAYMENT_KEY);

  if (!selectedPaymentId && paymentMethods[0]?.id) {
    localStorage.setItem(SELECTED_PAYMENT_KEY, paymentMethods[0].id);
    return paymentMethods[0].id;
  }

  return selectedPaymentId;
}

export function setSelectedAddressId(addressId) {
  localStorage.setItem(SELECTED_ADDRESS_KEY, addressId);
}

export function setSelectedPaymentId(paymentId) {
  localStorage.setItem(SELECTED_PAYMENT_KEY, paymentId);
 }