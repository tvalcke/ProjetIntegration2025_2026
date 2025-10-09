document.addEventListener('DOMContentLoaded', function() {
    // Animation remplissage bouteille
    const heroWater = document.getElementById('heroWater');
    
    function animateHeroBottle() {
        let height = 0;
        const targetHeight = 75;
        const increment = 0.5;
        
        const fillAnimation = setInterval(() => {
            height += increment;
            heroWater.style.height = height + '%';
            
            if (height >= targetHeight) {
                clearInterval(fillAnimation);
                heroWater.classList.add('filling');
                
                // Redémarrer l'animation après 2sec
                setTimeout(() => {
                    heroWater.classList.remove('filling');
                    heroWater.style.height = '0%';
                    setTimeout(animateHeroBottle, 2000);
                }, 3000);
            }
        }, 50);
    }
    
    // Démarre l'animation
    setTimeout(animateHeroBottle, 1000);
    
    // scroll pr les liens de navbar
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // apparition des cartes
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.feature-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.2}s, transform 0.6s ease ${index * 0.2}s`;
        observer.observe(card);
    });
    
    // petit paralax sue le header
    let ticking = false;
    
    function updateHeader() {
        const scrolled = window.pageYOffset;
        const header = document.querySelector('.header');
        
        if (scrolled > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = 'none';
        }
        
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestTick);
    
    // Animation des statistiques
    function animateStats() {
        const stats = document.querySelectorAll('.stat-number');
        
        stats.forEach(stat => {
            const target = stat.textContent;
            let targetNum = 0;
            let suffix = '';
            
            // Gérer les différents formats
            if (target.includes('+')) {
                targetNum = parseInt(target);
                suffix = '+';
            } else if (target === '2025') {
                // Animation spéciale pour l'année
                let current = 2020;
                const timer = setInterval(() => {
                    current += 1;
                    stat.textContent = current;
                    if (current >= 2025) {
                        clearInterval(timer);
                    }
                }, 100);
                return;
            } else {
                targetNum = parseInt(target);
                suffix = '';
            }
            
            let current = 0;
            const increment = targetNum / 60;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= targetNum) {
                    current = targetNum;
                    clearInterval(timer);
                }
                
                stat.textContent = Math.round(current) + suffix;
            }, 30);
        });
    }
    
    // ke check la section about pour déclencer l'animation des stats
    const aboutSection = document.querySelector('.about');
    if (aboutSection) {
        const aboutObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateStats();
                    aboutObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        aboutObserver.observe(aboutSection);
    }
    
    // gérer btns cta
    document.querySelectorAll('.primary-button, .secondary-button, .cta-button').forEach(button => {
        button.addEventListener('click', function(e) {
            // Effet de ripple
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // animation ripple en CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    // formulaire contact
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validation formulaire
            const requiredFields = contactForm.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.style.borderColor = '#ef4444';
                    isValid = false;
                } else {
                    field.style.borderColor = '#10b981';
                }
            });
            
            if (isValid) {
                // Animation soumission du form
                const submitButton = contactForm.querySelector('button[type="submit"]');
                const originalText = submitButton.textContent;
                
                submitButton.textContent = 'Envoi en cours...';
                submitButton.disabled = true;
                
                // Simulation d'envoi (à remplacer par vraie logique d'envoi) \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ IMPORTANT
                setTimeout(() => {
                    submitButton.textContent = 'Demande envoyée ✓';
                    submitButton.style.background = '#10b981';
                    
                    // Réinitialiser le formulaire après 2 secondes
                    setTimeout(() => {
                        contactForm.reset();
                        submitButton.textContent = originalText;
                        submitButton.disabled = false;
                        submitButton.style.background = '';
                        
                        // Réinitialiser les couleurs des champs
                        requiredFields.forEach(field => {
                            field.style.borderColor = '';
                        });
                    }, 2000);
                }, 1500);
            } else {
                // défiler vers le premier champ invalide
                const firstInvalidField = contactForm.querySelector('[style*="border-color: rgb(239, 68, 68)"]');
                if (firstInvalidField) {
                    firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstInvalidField.focus();
                }
            }
        });
        
        // Validation en temps réel
        const inputs = contactForm.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                if (this.hasAttribute('required')) {
                    if (this.value.trim()) {
                        this.style.borderColor = '#10b981';
                    } else {
                        this.style.borderColor = '#ef4444';
                    }
                }
            });
            
            input.addEventListener('input', function() {
                if (this.style.borderColor === 'rgb(239, 68, 68)' && this.value.trim()) {
                    this.style.borderColor = '#10b981';
                }
            });
        });
    }
});
