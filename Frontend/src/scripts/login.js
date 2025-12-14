document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('loginError');
    const loginBtn = document.querySelector('.login-btn');
    const API_URL = window.VITE_API_URL;
    // visibuilité paswd
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        const eyeIcon = this.querySelector('.eye-icon');
        eyeIcon.textContent = type === 'password' ? '👁️' : '🙈';
    });

    // submi du form
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const remember = document.getElementById('remember').checked;

        loginError.style.display = 'none';
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;

        try {
            const response = await fetch(`${API_URL}/api/admin/login`, {
                method: 'POST',
                credentials: 'include', // 🔴 REQUIRED
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                showError(errorData.detail || 'Email ou mot de passe incorrect');
                loginBtn.classList.remove('loading');
                loginBtn.disabled = false;
                return;
            }

            if (remember) {
                localStorage.setItem('jemlo_remember', 'true');
                localStorage.setItem('jemlo_user', email);
            }

            window.location.href = 'admin.html';

        } catch (error) {
            showError('Erreur de connexion au serveur');
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        }
    });

    function showError(message) {
        const errorMessage = loginError.querySelector('.error-message');
        errorMessage.textContent = message;
        loginError.style.display = 'flex';

        loginForm.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            loginForm.style.animation = '';
        }, 500);
    }

    // Pré-remplir si "remember me" est coché
    if (localStorage.getItem('jemlo_remember') === 'true') {
        const savedUser = localStorage.getItem('jemlo_user');
        if (savedUser) {
            document.getElementById('email').value = savedUser;
            document.getElementById('remember').checked = true;
        }
    }

    // Auto-focus email field
    document.getElementById('email').focus();

    document.querySelector('.forgot-password').addEventListener('click', function(e) {
        e.preventDefault();
        alert('Fonctionnalité de récupération de mot de passe à implémenter.\nContactez l\'administrateur système.');
    });

    // shake css
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);
});