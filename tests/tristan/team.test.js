/**
 * Tests unitaires pour team.html
 * @jest-environment jsdom
 * 
 */

const fs = require('fs');
const path = require('path');

describe('Team Page Tests', () => {
  beforeEach(() => {
    // Chargement du fichier
    const html = fs.readFileSync(
      path.resolve(__dirname, '../../Frontend/src/team.html'),
      'utf8'
    );
    document.documentElement.innerHTML = html;
  });

  afterEach(() => {
    // Nettoyage du DOM
    document.documentElement.innerHTML = '';
  });

  describe('Header et Navigation', () => {
    // vérif Brand JEMLO link vers public
    test('should have JEMLO link to public.html', () => {
      const brandLink = document.querySelector('.nav-brand a');
      expect(brandLink.textContent).toBe('JEMLO');
      expect(brandLink.getAttribute('href')).toBe('public.html');
    });

    // check 4 liens navigation
    test('should have 4 navigation links', () => {
      const links = document.querySelectorAll('.nav-links a');
      expect(links.length).toBe(4);
      
      expect(links[0].getAttribute('href')).toBe('public.html#features');
      expect(links[1].getAttribute('href')).toBe('public.html#about');
      expect(links[2].getAttribute('href')).toBe('team.html');
      expect(links[3].getAttribute('href')).toBe('public.html#contact');
    });

    // vérif Bouton CTA avec onclick
    test('should have CTA button with onclick', () => {
      const ctaButton = document.querySelector('.nav-links .cta-button');
      expect(ctaButton).toBeTruthy();
      expect(ctaButton.getAttribute('onclick')).toContain('public.html#contact');
    });
  });

  describe('Team Hero Section', () => {
    // check Section hero équipe
    test('should have team-hero section', () => {
      const teamHero = document.querySelector('.team-hero');
      expect(teamHero).toBeTruthy();
    });

    // test Titre Notre Équipe
    test('should display team hero title', () => {
      const title = document.querySelector('.team-hero-title');
      expect(title.textContent).toBe('Notre Équipe');
    });

    // vérif Description complète
    test('should have complete hero description', () => {
      const description = document.querySelector('.team-hero-description');
      expect(description.textContent).toContain('Rencontrez l\'équipe passionnée');
      expect(description.textContent).toContain('des étudiants déterminés');
    });
  });

  describe('Team Members', () => {
    // check Section membres présente
    test('should have team-members section', () => {
      const teamMembers = document.querySelector('.team-members');
      expect(teamMembers).toBeTruthy();
    });

    // test Grille avec 6 membres
    test('should have team grid with 6 members', () => {
      const teamGrid = document.querySelector('.team-grid');
      const teamCards = teamGrid.querySelectorAll('.team-card');
      
      expect(teamGrid).toBeTruthy();
      expect(teamCards.length).toBe(6);
    });

    // vérif Noms équipe affichés
    test('should display all team member names', () => {
      const names = Array.from(document.querySelectorAll('.team-info h3'))
        .map(h3 => h3.textContent);
      
      expect(names).toContain('Thomas P');
      expect(names).toContain('Thomas G');
      expect(names).toContain('Tristan');
      expect(names).toContain('Denis');
      expect(names).toContain('Arnaud');
      expect(names).toContain('Akbar');
    });

    // check Descriptions réelles des membres
    test('should have real descriptions for all members', () => {
      const descriptions = document.querySelectorAll('.team-info .description');
      
      descriptions.forEach(desc => {
        expect(desc.textContent.trim().length).toBeGreaterThan(0);
        expect(desc.textContent).not.toContain('Lorem ipsum');
      });
    });

    // test Placeholders photos
    test('should have photo placeholders', () => {
      const placeholders = document.querySelectorAll('.photo-placeholder');
      expect(placeholders.length).toBeGreaterThan(0);
    });

    // vérif Photos réelles chemins
    test('should have real photos with correct paths', () => {
      const photos = document.querySelectorAll('.member-photo');
      const photoSrcs = Array.from(photos).map(img => img.getAttribute('src'));
      
      expect(photoSrcs).toContain('img/team/ThomasG.jpg');
      expect(photoSrcs).toContain('img/team/Denis.jpg');
      expect(photoSrcs).toContain('img/team/arnaud.png');
    });

    // check Attributs alt photos
    test('should have correct alt attributes for photos', () => {
      const thomasG = document.querySelector('img[alt="Thomas G"]');
      const denis = document.querySelector('img[alt="Denis"]');
      const arnaud = document.querySelector('img[alt="Arnaud"]');
      
      expect(thomasG).toBeTruthy();
      expect(denis).toBeTruthy();
      expect(arnaud).toBeTruthy();
    });
  });

  describe('Team Values', () => {
    // test Section valeurs existe
    test('should have team-values section', () => {
      const teamValues = document.querySelector('.team-values');
      expect(teamValues).toBeTruthy();
    });

    // vérif Titre Nos Valeurs
    test('should display "Nos Valeurs" title', () => {
      const title = document.querySelector('.team-values h2');
      expect(title.textContent).toBe('Nos Valeurs');
    });

    // check Grille 3 cartes valeurs
    test('should have values grid with 3 value cards', () => {
      const valuesGrid = document.querySelector('.values-grid');
      const valueCards = valuesGrid.querySelectorAll('.value-card');
      
      expect(valuesGrid).toBeTruthy();
      expect(valueCards.length).toBe(3);
    });

    // test 3 valeurs affichées
    test('should display all three values', () => {
      const values = Array.from(document.querySelectorAll('.value-card h3'))
        .map(h3 => h3.textContent);
      
      expect(values).toContain('Durabilité');
      expect(values).toContain('Collaboration');
      expect(values).toContain('Innovation');
    });

    // vérif Icônes valeurs
    test('should have icons for each value', () => {
      const icons = document.querySelectorAll('.value-icon');
      
      expect(icons.length).toBe(3);
      expect(icons[0].textContent).toBe('🌱');
      expect(icons[1].textContent).toBe('🤝');
      expect(icons[2].textContent).toBe('💡');
    });

    // check Descriptions complètes
    test('should have complete descriptions', () => {
      const durability = Array.from(document.querySelectorAll('.value-card'))
        .find(card => card.querySelector('h3').textContent === 'Durabilité');
      
      expect(durability.textContent).toContain('développons des solutions');
    });
  });

  describe('Team CTA Section', () => {
    // test Section CTA équipe
    test('should have team-cta section', () => {
      const teamCta = document.querySelector('.team-cta');
      expect(teamCta).toBeTruthy();
    });

    // vérif Titre CTA
    test('should display CTA title', () => {
      const title = document.querySelector('.team-cta h2');
      expect(title.textContent).toBe('Rejoignez notre mission');
    });

    // check Description complète
    test('should have complete description', () => {
      const description = document.querySelector('.team-cta p');
      expect(description.textContent).toContain('Vous partagez notre vision');
      expect(description.textContent).toContain('comment JEMLO peut équiper vos espaces');
    });

    // test Bouton onclick
    test('should have button with onclick', () => {
      const button = document.querySelector('.team-cta .primary-button');
      expect(button.classList.contains('large')).toBe(true);
      expect(button.getAttribute('onclick')).toContain('public.html#contact');
      expect(button.textContent).toBe('Nous contacter');
    });
  });

  describe('Footer', () => {
    // vérif Footer brand JEMLO
    test('should have footer with brand', () => {
      const footer = document.querySelector('.footer');
      const brand = document.querySelector('.footer-brand h4');
      
      expect(footer).toBeTruthy();
      expect(brand.textContent).toBe('JEMLO');
    });

    // check Liens footer
    test('should have all footer links pointing to public.html or team.html', () => {
      const links = document.querySelectorAll('.footer-section a');
      
      links.forEach(link => {
        const href = link.getAttribute('href');
        expect(href.startsWith('public.html') || href === 'team.html').toBe(true);
      });
    });

    // test Copyright 2025
    test('should have copyright', () => {
      const copyright = document.querySelector('.footer-bottom p');
      expect(copyright.textContent).toContain('2025 JEMLO');
    });
  });

  describe('Scripts', () => {
    // vérif Script team.js chargé
    test('should have team.js script', () => {
      const script = Array.from(document.querySelectorAll('script'))
        .find(s => s.getAttribute('src') === 'scripts/team.js');
      
      expect(script).toBeTruthy();
    });
  });

  describe('Demo Navigation', () => {
    // check Boutons nav demo
    test('should have demo navigation buttons', () => {
      const demoNav = document.querySelector('.demo-nav');
      expect(demoNav).toBeTruthy();
    });

    // test 4 boutons demo
    test('should have 4 demo buttons', () => {
      const buttons = document.querySelectorAll('.demo-nav button');
      expect(buttons.length).toBe(4);
    });
  });
});
