const API_URL = 'https://antraders-live.onrender.com/api';

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('form-' + tab).classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorMsg = document.getElementById('error-msg');
            
            try {
                const response = await fetch(`${API_URL}/admin/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        'username': username,
                        'password': password
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('admin_token', data.access_token);
                    window.location.href = 'admin.html';
                } else {
                    errorMsg.style.display = 'flex';
                    errorMsg.innerText = 'Invalid username or password';
                }
            } catch (error) {
                console.error('Login error:', error);
                errorMsg.style.display = 'flex';
                errorMsg.innerText = 'Server error. Please try again.';
            }
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('reg-username').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;
            const errorMsg = document.getElementById('reg-error-msg');
            const errorText = document.getElementById('reg-error-text');
            const successMsg = document.getElementById('reg-success-msg');
            
            errorMsg.style.display = 'none';
            successMsg.style.display = 'none';
            
            if (password !== confirmPassword) {
                errorText.innerText = 'Passwords do not match';
                errorMsg.style.display = 'flex';
                return;
            }
            
            try {
                const response = await fetch(`${API_URL}/admin/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                });
                
                if (response.ok) {
                    successMsg.style.display = 'flex';
                    setTimeout(() => switchTab('login'), 2000);
                } else {
                    const data = await response.json();
                    errorText.innerText = data.detail || 'Registration failed';
                    errorMsg.style.display = 'flex';
                }
            } catch (error) {
                console.error('Register error:', error);
                errorText.innerText = 'Server error. Please try again.';
                errorMsg.style.display = 'flex';
            }
        });
    }
});
