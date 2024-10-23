// Get elements from the DOM
const adminLoginForm = document.getElementById('adminLoginForm');
const adminEmailInput = document.getElementById('email');
const adminPasswordInput = document.getElementById('password');

// Email validation pattern
const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Real-time email validation
adminEmailInput.addEventListener('input', function () {
    if (emailPattern.test(adminEmailInput.value.trim())) {
        adminEmailInput.classList.remove('is-invalid');
        adminEmailInput.classList.add('is-valid');
    } else {
        adminEmailInput.classList.remove('is-valid');
        adminEmailInput.classList.add('is-invalid');
    }
});

// Real-time password validation
adminPasswordInput.addEventListener('input', function () {
    if (adminPasswordInput.value.length >= 8) {
        adminPasswordInput.classList.remove('is-invalid');
        adminPasswordInput.classList.add('is-valid');
    } else {
        adminPasswordInput.classList.remove('is-valid');
        adminPasswordInput.classList.add('is-invalid');
    }
});

// Form submission validation
adminLoginForm.addEventListener('submit', function (event) {
    let isValid = true;

    // Validate email
    if (!emailPattern.test(adminEmailInput.value.trim())) {
        adminEmailInput.classList.add('is-invalid');
        isValid = false;
    }

    // Validate password length
    if (adminPasswordInput.value.length < 8) {
        adminPasswordInput.classList.add('is-invalid');
        isValid = false;
    }

    // Prevent form submission if validation fails
    if (!isValid) {
        event.preventDefault();
    }
});
