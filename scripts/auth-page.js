import {initAuthForms, redirectIfAuthenticated} from './auth.js';

redirectIfAuthenticated('index.html');
initAuthForms();
