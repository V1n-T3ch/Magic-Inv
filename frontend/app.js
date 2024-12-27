document.addEventListener('DOMContentLoaded', () => {
    const registerFormContainer = document.getElementById('registerFormContainer');
    const loginFormContainer = document.getElementById('loginFormContainer');
    
    const toLoginLink = document.getElementById('toLoginLink');
    const toRegisterLink = document.getElementById('toRegisterLink');
    
    // Switch to Register form
    toRegisterLink.addEventListener('click', () => {
        loginFormContainer.classList.remove('active');
        registerFormContainer.classList.add('active');
    });
    
    // Switch to Login form
    toLoginLink.addEventListener('click', () => {
        registerFormContainer.classList.remove('active');
        loginFormContainer.classList.add('active');
    });

    // Register Form Submission
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            ref_by: formData.get('ref_by'),
        };

        const response = await fetch('http://localhost:5000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        alert(result.message);
    });

    // Login Form Submission
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const data = {
            email: formData.get('email'),
            password: formData.get('password'),
        };

        const response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        if (result.message) {
            alert(result.message);
            localStorage.setItem('user', JSON.stringify(result.user));
            window.location.href = 'dashboard.html'; // Redirect to dashboard or another page
        }
    });
});
