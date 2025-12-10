document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('loginError');
    const loginBtn = document.querySelector('.login-btn');

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

        //kept sending wierd stuff so i did this
        const email = document.getElementById('email').value.trim().replace(/^['"]|['"]$/g, '');
        const password = document.getElementById('password').value.trim().replace(/^['"]|['"]$/g, '');
        const remember = document.getElementById('remember').checked;

        // cacher erreur
        loginError.style.display = 'none';

        loginBtn.classList.add('loading');
        loginBtn.disabled = true;

        try {
            // Call FastAPI backend
            const response = await fetch('http://localhost:8000/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Email ou mot de passe incorrect');
            }

            const data = await response.json();
            const token = data.access_token;

            // ✅ Store token
            if (remember) {
                localStorage.setItem('jemlo_remember', 'true');
                localStorage.setItem('jemlo_user', email);
                localStorage.setItem('admin_token', token);
            } else {
                sessionStorage.setItem('admin_token', token);
            }

            // ✅ Redirect to admin dashboard
            window.location.href = 'admin.html';

        } catch (error) {
            console.error('Login error:', error);
            showError(error.message || 'Erreur de connexion au serveur');
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