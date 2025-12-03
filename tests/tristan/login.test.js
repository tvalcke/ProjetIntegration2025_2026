/**
 * Tests unitaires pour login.html
 * @jest-environment jsdom
 * 
 */

const fs = require('fs');
const path = require('path');

describe('Login Page Tests', () => {
  beforeEach(() => {
    // Chargement du fichier
    const html = fs.readFileSync(
      path.resolve(__dirname, '../../Frontend/src/login.html'),
      'utf8'
    );
    document.documentElement.innerHTML = html;
  });

  afterEach(() => {
    // Nettoyage du DOM
    document.documentElement.innerHTML = '';
  });

  describe('Page Structure', () => {
    // vérif Container principal login
    test('should have login-container', () => {
      const container = document.querySelector('.login-container');
      expect(container).toBeTruthy();
    });

    // check Card de login présente
    test('should have login-card', () => {
      const card = document.querySelector('.login-card');
      expect(card).toBeTruthy();
    });

    // test Background avec pattern
    test('should have login-bg with pattern and floating elements', () => {
      const bg = document.querySelector('.login-bg');
      const pattern = document.querySelector('.bg-pattern');
      const floatingElements = document.querySelector('.floating-elements');
      
      expect(bg).toBeTruthy();
      expect(pattern).toBeTruthy();
      expect(floatingElements).toBeTruthy();
    });
  });

  describe('Login Header', () => {
    // vérif Header avec titre JEMLO
    test('should display JEMLO Administration header', () => {
      const h1 = document.querySelector('.login-header h1');
      const h2 = document.querySelector('.login-header h2');
      const description = document.querySelector('.login-header p');
      
      expect(h1.textContent).toBe('JEMLO');
      expect(h2.textContent).toBe('Administration');
      expect(description.textContent).toBe('Connectez-vous pour accéder au panneau d\'administration');
    });
  });

  describe('Login Form', () => {
    // check Form avec id loginForm
    test('should have login form with id loginForm', () => {
      const form = document.getElementById('loginForm');
      
      expect(form).toBeTruthy();
      expect(form.classList.contains('login-form')).toBe(true);
    });

    // test Input email avec attributs
    test('should have email input with correct attributes', () => {
      const email = document.getElementById('email');
      const label = document.querySelector('label[for="email"]');
      
      expect(email).toBeTruthy();
      expect(email.type).toBe('email');
      expect(email.name).toBe('email');
      expect(email.required).toBe(true);
      expect(email.placeholder).toBe('admin@jemlo.be');
      expect(label.textContent).toBe('Email');
    });

    // vérif Password avec wrapper
    test('should have password input with wrapper', () => {
      const passwordWrapper = document.querySelector('.password-input');
      const password = document.getElementById('password');
      const label = document.querySelector('label[for="password"]');
      
      expect(passwordWrapper).toBeTruthy();
      expect(password).toBeTruthy();
      expect(password.type).toBe('password');
      expect(password.required).toBe(true);
      expect(password.placeholder).toBe('••••••••');
      expect(label.textContent).toBe('Mot de passe');
    });

    // check Bouton toggle password
    test('should have toggle password button with eye icon', () => {
      const toggleBtn = document.getElementById('togglePassword');
      const eyeIcon = toggleBtn.querySelector('.eye-icon');
      
      expect(toggleBtn).toBeTruthy();
      expect(toggleBtn.type).toBe('button');
      expect(toggleBtn.classList.contains('toggle-password')).toBe(true);
      expect(eyeIcon.textContent).toBe('👁️');
    });

    // test Bouton submit
    test('should have submit button', () => {
      const loginBtn = document.querySelector('.login-btn');
      
      expect(loginBtn).toBeTruthy();
      expect(loginBtn.type).toBe('submit');
      expect(loginBtn.textContent).toBe('Se connecter');
    });
  });

  describe('Form Options', () => {
    // vérif Section form-options
    test('should have form-options section', () => {
      const formOptions = document.querySelector('.form-options');
      expect(formOptions).toBeTruthy();
    });

    // check Checkbox remember me
    test('should have remember me checkbox with checkmark', () => {
      const rememberLabel = document.querySelector('.remember-me');
      const remember = document.getElementById('remember');
      const checkmark = rememberLabel.querySelector('.checkmark');
      
      expect(rememberLabel).toBeTruthy();
      expect(remember.type).toBe('checkbox');
      expect(checkmark).toBeTruthy();
      expect(rememberLabel.textContent).toContain('Se souvenir de moi');
    });

    // test Lien mot de passe oublié
    test('should have forgot password link', () => {
      const forgotLink = document.querySelector('.forgot-password');
      
      expect(forgotLink).toBeTruthy();
      expect(forgotLink.textContent).toBe('Mot de passe oublié ?');
      expect(forgotLink.getAttribute('href')).toBe('#');
    });
  });

  describe('Error Display', () => {
    // vérif Message erreur caché
    test('should have hidden error message by default', () => {
      const errorDiv = document.getElementById('loginError');
      
      expect(errorDiv).toBeTruthy();
      expect(errorDiv.classList.contains('login-error')).toBe(true);
      expect(errorDiv.style.display).toBe('none');
    });

    // check Icône et texte erreur
    test('should have error icon and message', () => {
      const errorDiv = document.getElementById('loginError');
      const errorIcon = errorDiv.querySelector('.error-icon');
      const errorMessage = errorDiv.querySelector('.error-message');
      
      expect(errorIcon.textContent).toBe('⚠️');
      expect(errorMessage.textContent).toBe('Email ou mot de passe incorrect');
    });
  });

  describe('Login Footer', () => {
    // test Footer avec lien contact
    test('should have login footer with contact link', () => {
      const footer = document.querySelector('.login-footer');
      const link = footer.querySelector('a');
      
      expect(footer).toBeTruthy();
      expect(link.textContent).toBe('Contactez l\'équipe');
      expect(link.getAttribute('href')).toBe('public.html#contact');
    });
  });

  describe('Floating Elements', () => {
    // vérif 3 éléments flottants
    test('should have 3 floating elements with emojis', () => {
      const elements = document.querySelectorAll('.floating-elements .element');
      
      expect(elements.length).toBe(3);
      expect(elements[0].classList.contains('element-1')).toBe(true);
      expect(elements[0].textContent).toBe('💧');
      expect(elements[1].classList.contains('element-2')).toBe(true);
      expect(elements[1].textContent).toBe('🌱');
      expect(elements[2].classList.contains('element-3')).toBe(true);
      expect(elements[2].textContent).toBe('⚡');
    });
  });

  describe('Form Validation', () => {
    // check Validation format email
    test('should validate email format', () => {
      const email = document.getElementById('email');
      
      email.value = 'invalid';
      expect(email.validity.valid).toBe(false);
      
      email.value = 'admin@jemlo.be';
      expect(email.validity.valid).toBe(true);
    });

    // test Champs requis
    test('should require both email and password', () => {
      const email = document.getElementById('email');
      const password = document.getElementById('password');
      
      expect(email.required).toBe(true);
      expect(password.required).toBe(true);
    });
  });

  describe('Scripts', () => {
    // vérif Script login.js présent
    test('should have login.js script', () => {
      const script = Array.from(document.querySelectorAll('script'))
        .find(s => s.getAttribute('src') === 'scripts/login.js');
      
      expect(script).toBeTruthy();
    });
  });

  describe('Demo Navigation', () => {
    // check Boutons nav demo
    test('should have demo navigation buttons', () => {
      const demoNav = document.querySelector('.demo-nav');
      expect(demoNav).toBeTruthy();
    });
  });
});
