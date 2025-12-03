/**
 * Tests unitaires pour public.html
 * @jest-environment jsdom
 * 
 */

const fs = require('fs');
const path = require('path');

describe('Public Page Tests', () => {
  beforeEach(() => {
    // Chargement du fichier
    const html = fs.readFileSync(
      path.resolve(__dirname, '../../Frontend/src/public.html'),
      'utf8'
    );
    document.documentElement.innerHTML = html;
  });

  afterEach(() => {
    // Nettoyage du DOM
    document.documentElement.innerHTML = '';
  });

  describe('Header et Navigation', () => {
    // vérif brand JEMLO existe dans header
    test('should have JEMLO brand in header', () => {
      const brand = document.querySelector('.nav-brand h1');
      expect(brand.textContent).toBe('JEMLO');
    });

    // check 3 liens + 1 bouton CTA
    test('should have 3 navigation links plus CTA button', () => {
      const links = document.querySelectorAll('.nav-links a');
      const ctaButton = document.querySelector('.nav-links .cta-button');
      
      expect(links.length).toBe(3);
      expect(ctaButton).toBeTruthy();
      expect(ctaButton.textContent).toBe('En savoir plus');
    });

    // test Liens nav doivent pointer vers les bonne ancres
    test('should have navigation links with correct hrefs', () => {
      const links = document.querySelectorAll('.nav-links a');
      
      expect(links[0].getAttribute('href')).toBe('#features');
      expect(links[1].getAttribute('href')).toBe('#about');
      expect(links[2].getAttribute('href')).toBe('#contact');
    });
  });

  describe('Hero Section', () => {
    // check Présence du hero
    test('should have hero section', () => {
      const hero = document.querySelector('.hero');
      expect(hero).toBeTruthy();
    });

    // vérif Titre doit contenir le span highlight
    test('should have hero title with highlight', () => {
      const title = document.querySelector('.hero-title');
      const highlight = title.querySelector('.highlight');
      
      expect(title).toBeTruthy();
      expect(title.textContent).toContain('Des fontaines intelligentes');
      expect(highlight.textContent).toBe('futur durable');
    });

    // test Description doit mentionner JEMLO
    test('should have hero description', () => {
      const description = document.querySelector('.hero-description');
      
      expect(description.textContent).toContain('JEMLO transforme les fontaines');
      expect(description.textContent).toContain('calculent l\'eau consommée');
    });

    // check 2 boutons d'action dans hero
    test('should have two hero action buttons', () => {
      const buttons = document.querySelectorAll('.hero-actions button');
      
      expect(buttons.length).toBe(2);
      expect(buttons[0].classList.contains('primary-button')).toBe(true);
      expect(buttons[0].textContent).toBe('Découvrir nos fontaines');
      expect(buttons[1].classList.contains('secondary-button')).toBe(true);
      expect(buttons[1].textContent).toBe('Voir l\'impact');
    });

    // vérif Visualisation bouteille complète
    test('should have bottle visualization with water level', () => {
      const bottleShowcase = document.querySelector('.bottle-showcase');
      const bottleContainer = document.querySelector('.bottle-container');
      const bottle = document.querySelector('.bottle');
      const waterLevel = document.getElementById('heroWater');
      
      expect(bottleShowcase).toBeTruthy();
      expect(bottleContainer).toBeTruthy();
      expect(bottle).toBeTruthy();
      expect(waterLevel).toBeTruthy();
      expect(waterLevel.classList.contains('water-level')).toBe(true);
    });
  });

  describe('Features Section', () => {
    // test Section features avec id et classe
    test('should have features section with id', () => {
      const features = document.getElementById('features');
      expect(features).toBeTruthy();
      expect(features.classList.contains('features')).toBe(true);
    });

    // check Titre de section correct
    test('should have section title', () => {
      const title = document.querySelector('.features .section-title');
      expect(title.textContent).toBe('Pourquoi choisir les fontaines JEMLO ?');
    });

    // vérif exactement 3 feature cards
    test('should have exactly 3 feature cards', () => {
      const featureCards = document.querySelectorAll('.feature-card');
      expect(featureCards.length).toBe(3);
    });

    // test Titres des features correspondent
    test('should have correct feature titles', () => {
      const titles = Array.from(document.querySelectorAll('.feature-card h4'))
        .map(h4 => h4.textContent);
      
      expect(titles).toContain('Calcul en Temps Réel');
      expect(titles).toContain('Impact Environnemental');
      expect(titles).toContain('Écran Intégré');
    });

    // check Icônes correct
    test('should have correct feature icons', () => {
      const icons = Array.from(document.querySelectorAll('.feature-icon'))
        .map(icon => icon.textContent);
      
      expect(icons).toContain('📊');
      expect(icons).toContain('🌱');
      expect(icons).toContain('💻');
    });
  });

  describe('About Section', () => {
    // vérif Section about avec id
    test('should have about section with id', () => {
      const about = document.getElementById('about');
      expect(about).toBeTruthy();
    });

    // test Titre about présent
    test('should have about title', () => {
      const title = document.querySelector('.about-text h3');
      expect(title.textContent).toBe('Révolutionner l\'hydratation dans les bâtiments');
    });

    // check 2 paragraphes dans about-text
    test('should have two paragraphs in about-text', () => {
      const paragraphs = document.querySelectorAll('.about-text p');
      expect(paragraphs.length).toBe(2);
      expect(paragraphs[1].textContent).toContain('Chaque litre d\'eau consommé');
    });

    // vérif 3 stats présentes
    test('should have 3 statistics', () => {
      const stats = document.querySelectorAll('.about-stats .stat');
      expect(stats.length).toBe(3);
    });

    // test Valeurs des stats
    test('should display correct stat values', () => {
      const statNumbers = Array.from(document.querySelectorAll('.stat-number'))
        .map(el => el.textContent);
      
      expect(statNumbers).toContain('150+');
      expect(statNumbers).toContain('5');
      expect(statNumbers).toContain('2025');
    });

    // check Note avec disclaimer
    test('should have about-note with disclaimer', () => {
      const aboutNote = document.querySelector('.about-note');
      const small = aboutNote.querySelector('small');
      
      expect(aboutNote).toBeTruthy();
      expect(small.textContent).toContain('Projections basées sur');
    });
  });

  describe('CTA Section', () => {
    // vérif Section CTA existe
    test('should have cta-section', () => {
      const ctaSection = document.querySelector('.cta-section');
      expect(ctaSection).toBeTruthy();
    });

    // test Titre et desc du CTA
    test('should have CTA title and description', () => {
      const title = document.querySelector('.cta-section h3');
      const description = document.querySelector('.cta-section p');
      
      expect(title.textContent).toContain('Prêt à installer JEMLO');
      expect(description.textContent).toContain('Équipez vos espaces');
    });

    // check Bouton large primary
    test('should have large primary button', () => {
      const button = document.querySelector('.cta-section .primary-button.large');
      expect(button).toBeTruthy();
      expect(button.textContent).toBe('Demander un devis');
    });
  });

  describe('Contact Section', () => {
    // vérif Section contact avec id
    test('should have contact section with id', () => {
      const contact = document.getElementById('contact');
      expect(contact).toBeTruthy();
    });

    // test Info contact avec desc
    test('should have contact-info with description', () => {
      const contactInfo = document.querySelector('.contact-info');
      const description = contactInfo.querySelector('p');
      
      expect(description.textContent).toContain('Vous souhaitez équiper vos locaux');
    });

    // check 4 items contact avec icônes
    test('should have 4 contact items with icons', () => {
      const contactItems = document.querySelectorAll('.contact-item');
      expect(contactItems.length).toBe(4);
      
      const icons = Array.from(document.querySelectorAll('.contact-icon'))
        .map(icon => icon.textContent);
      
      expect(icons).toContain('📧');
      expect(icons).toContain('📞');
      expect(icons).toContain('📍');
      expect(icons).toContain('⏰');
    });

    // vérif Adresse EPHEC complète
    test('should have EPHEC address details', () => {
      const addressItem = Array.from(document.querySelectorAll('.contact-item'))
        .find(item => item.textContent.includes('EPHEC'));
      
      expect(addressItem).toBeTruthy();
      expect(addressItem.textContent).toContain('Avenue du ciseau 15');
      expect(addressItem.textContent).toContain('1348 Louvain-la-Neuve');
    });

    // test Horaires ouverture
    test('should have business hours', () => {
      const hoursItem = Array.from(document.querySelectorAll('.contact-item'))
        .find(item => item.textContent.includes('Horaires'));
      
      expect(hoursItem).toBeTruthy();
      expect(hoursItem.textContent).toContain('Lun-Ven: 9h00 - 17h00');
    });

    // check Form contact avec id
    test('should have contact form with id contactForm', () => {
      const form = document.getElementById('contactForm');
      expect(form).toBeTruthy();
      expect(form.classList.contains('contact-form')).toBe(true);
    });

    // vérif Champs required du form
    test('should have all required form fields', () => {
      const company = document.getElementById('company');
      const firstName = document.getElementById('firstName');
      const lastName = document.getElementById('lastName');
      const email = document.getElementById('email');
      
      expect(company.required).toBe(true);
      expect(firstName.required).toBe(true);
      expect(lastName.required).toBe(true);
      expect(email.required).toBe(true);
      expect(email.type).toBe('email');
    });

    // test Select buildingType avec options
    test('should have building type select with 6 options', () => {
      const buildingType = document.getElementById('buildingType');
      const options = buildingType.querySelectorAll('option');
      
      expect(options.length).toBe(7);
      expect(options[1].value).toBe('bureau');
      expect(options[3].value).toBe('hopital');
    });

    // check Checkbox newsletter
    test('should have newsletter checkbox', () => {
      const newsletter = document.getElementById('newsletter');
      const checkboxText = document.querySelector('.checkbox-text');
      
      expect(newsletter.type).toBe('checkbox');
      expect(checkboxText.textContent).toBe('Je souhaite recevoir les actualités JEMLO');
    });

    // vérif Bouton submit
    test('should have submit button', () => {
      const submitBtn = document.querySelector('.contact-form button[type="submit"]');
      expect(submitBtn.textContent).toBe('Envoyer la demande');
    });
  });

  describe('Footer', () => {
    // test Footer avec brand
    test('should have footer with brand', () => {
      const footer = document.querySelector('.footer');
      const brand = document.querySelector('.footer-brand h4');
      
      expect(footer).toBeTruthy();
      expect(brand.textContent).toBe('JEMLO');
    });

    // check 2 sections footer
    test('should have footer sections', () => {
      const footerSections = document.querySelectorAll('.footer-section');
      expect(footerSections.length).toBe(2);
    });

    // vérif Titres sections footer
    test('should have Solutions and Entreprise sections', () => {
      const titles = Array.from(document.querySelectorAll('.footer-section h5'))
        .map(h5 => h5.textContent);
      
      expect(titles).toContain('Solutions');
      expect(titles).toContain('Entreprise');
    });

    // test Lien team dans footer
    test('should have team link in footer', () => {
      const teamLink = Array.from(document.querySelectorAll('.footer-section a'))
        .find(link => link.textContent === 'Équipe');
      
      expect(teamLink).toBeTruthy();
      expect(teamLink.getAttribute('href')).toBe('team.html');
    });

    // check Copyright 2025
    test('should have copyright', () => {
      const copyright = document.querySelector('.footer-bottom p');
      expect(copyright.textContent).toContain('2025 JEMLO');
      expect(copyright.textContent).toContain('Tous droits réservés');
    });
  });

  describe('Demo Navigation', () => {
    // vérif Boutons nav demo présents
    test('should have demo navigation buttons', () => {
      const demoNav = document.querySelector('.demo-nav');
      const buttons = demoNav.querySelectorAll('button');
      
      expect(demoNav).toBeTruthy();
      expect(buttons.length).toBe(4);
    });

    // test 4 boutons demo présents
    test('should have all 4 demo buttons', () => {
      const buttons = document.querySelectorAll('.demo-nav button');
      const buttonTexts = Array.from(buttons).map(btn => btn.textContent);
      
      expect(buttonTexts).toContain('Public');
      expect(buttonTexts).toContain('Team');
      expect(buttonTexts).toContain('Login');
      expect(buttonTexts).toContain('Admin');
    });
  });
});
