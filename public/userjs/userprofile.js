document.getElementById("availableCouponsButton").addEventListener("click", async () => {
    try {
        const response = await fetch('/availablecoupons');
        const coupons = await response.json();

        const couponContainer = document.getElementById("couponContainer");
        couponContainer.innerHTML = '';

        coupons.forEach(coupon => {
            const couponCard = document.createElement('div');
            couponCard.classList.add('col-md-4','mb-4');
            couponCard.innerHTML = `
             <div class="coupon-card">
             <h5>${coupon.code} <span class="badge bg-success">${coupon.discountType}</span></h5>
             <p>Discount Value : ${coupon.discountValue}${coupon.discountType === 'percentage' ? '%' : ''}</p>
             <p>Validity From : ${new Date(coupon.validFrom).toLocaleDateString()}</p>
             <p>Validity To : ${new Date(coupon.validUntil).toLocaleDateString()}</p>
             </div>`;
            couponContainer.appendChild(couponCard);
        });
    } catch (error) {
        console.error('Error fetching coupons:', error);
    }
});


  document.addEventListener("DOMContentLoaded", function () {
    const usernameInput = document.getElementById("username1");
    const usernameError = document.getElementById("usernameError");
    const phoneInput = document.getElementById("phone1");
    const phoneError = document.getElementById("phoneError");

    usernameInput.addEventListener("input", function () {
        const username = usernameInput.value.trim();
        const usernamePattern = /^[A-Za-z0-9]+$/;

        if (username.length < 5 || !usernamePattern.test(username)) {
            usernameError.textContent = "Username must be at least 5 characters long and contain no spaces or special characters.";
        } else {
            usernameError.textContent = ""; 
        }
    });

    phoneInput.addEventListener("input", function () {
        const phone = phoneInput.value.trim();
        const phonePattern = /^[0-9]{10}$/;

        if (phone && !phonePattern.test(phone)) {
            phoneError.textContent = "Please enter a valid 10-digit phone number.";
        } else {
            phoneError.textContent = "";
        }
    });

    document.getElementById("editProfileForm").addEventListener("submit", function (event) {
        const username = usernameInput.value.trim();
        const phone = phoneInput.value.trim();
        let isValid = true;

        if (username.length < 5 || !/^[A-Za-z0-9]+$/.test(username)) {
            usernameError.textContent = "Username must be at least 5 characters long and contain no spaces or special characters.";
            isValid = false;
        }

        if (phone && !/^[0-9]{10}$/.test(phone)) {
            phoneError.textContent = "Please enter a valid 10-digit phone number.";
            isValid = false;
        }

        if (!isValid) {
            event.preventDefault();
        }
    });
});


const changePasswordForm = document.getElementById('changePasswordForm');
const currentPassword = document.getElementById('currentPassword');
const newPassword = document.getElementById('newPassword');
const confirmNewPassword = document.getElementById('confirmNewPassword');
const currentPasswordFeedback = document.getElementById('currentPasswordFeedback');
const newPasswordFeedback = document.getElementById('newPasswordFeedback');
const passwordFeedback = document.getElementById('passwordFeedback');
const submitButton = document.getElementById('submitPasswordChange');

// Flag to track if form was submitted
let formSubmitted = false;

// Function to validate all password fields
function validatePasswords() {
    let isValid = true;

    // Only show validation feedback if form has been submitted at least once
    if (formSubmitted) {
        // Validate current password
        if (!currentPassword.value) {
            currentPassword.classList.add('is-invalid');
            currentPasswordFeedback.style.display = 'block';
            isValid = false;
        } else {
            currentPassword.classList.remove('is-invalid');
            currentPasswordFeedback.style.display = 'none';
        }

        // Validate new password
        const newPasswordValue = newPassword.value.trim();
        const passwordLengthValid = newPasswordValue.length >= 8; // Minimum length of 8 characters
        const noSpaces = !/\s/.test(newPasswordValue); // No spaces allowed
        const notOnlySpecialChars = /[a-zA-Z0-9]/.test(newPasswordValue); // At least one alphanumeric character

        if (!newPasswordValue) {
            newPassword.classList.add('is-invalid');
            newPasswordFeedback.textContent = "New password cannot be empty.";
            newPasswordFeedback.style.display = 'block';
            isValid = false;
        } else if (!passwordLengthValid) {
            newPassword.classList.add('is-invalid');
            newPasswordFeedback.textContent = "New password must be at least 8 characters long.";
            newPasswordFeedback.style.display = 'block';
            isValid = false;
        } else if (!noSpaces) {
            newPassword.classList.add('is-invalid');
            newPasswordFeedback.textContent = "New password cannot contain spaces.";
            newPasswordFeedback.style.display = 'block';
            isValid = false;
        } else if (!notOnlySpecialChars) {
            newPassword.classList.add('is-invalid');
            newPasswordFeedback.textContent = "New password must contain at least one letter or number.";
            newPasswordFeedback.style.display = 'block';
            isValid = false;
        } else if (currentPassword.value === newPasswordValue) {
            // Check if current password and new password are the same
            newPassword.classList.add('is-invalid');
            newPasswordFeedback.textContent = "New password cannot be the same as the current password.";
            newPasswordFeedback.style.display = 'block';
            isValid = false;
        } else {
            newPassword.classList.remove('is-invalid');
            newPasswordFeedback.style.display = 'none';
        }

        // Validate confirm password
        if (newPasswordValue !== confirmNewPassword.value) {
            confirmNewPassword.classList.add('is-invalid');
            passwordFeedback.style.display = 'block';
            isValid = false;
        } else {
            confirmNewPassword.classList.remove('is-invalid');
            passwordFeedback.style.display = 'none';
        }
    }

    // Enable/disable submit button based on validity
    submitButton.disabled = !isValid;
}

// Event listeners for real-time validation, only after the form has been submitted once
currentPassword.addEventListener('input', validatePasswords);
newPassword.addEventListener('input', validatePasswords);
confirmNewPassword.addEventListener('input', validatePasswords);

// Handle form submission
changePasswordForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the default form submission

    formSubmitted = true;

    validatePasswords();

    if (submitButton.disabled) return;

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    try {
        const response = await fetch('/changePassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentPassword,
                newPassword,
                confirmNewPassword
            })
        });

        const result = await response.json();

        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: result.message,
                confirmButtonText: 'Okay'
            }).then(() => {
                location.reload(); 
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: result.message,
                confirmButtonText: 'Try Again'
            });
        }
    } catch (error) {
        console.error('Error during fetch:', error);
    }
});


document.addEventListener("DOMContentLoaded", function () {
    const toggleCurrentPassword = document.getElementById('toggleCurrentPassword');
    const currentPasswordInput = document.getElementById('currentPassword');

    toggleCurrentPassword.addEventListener('click', () => {
        togglePasswordVisibility(currentPasswordInput, toggleCurrentPassword);
    });

    const toggleNewPassword = document.getElementById('toggleNewPassword');
    const newPasswordInput = document.getElementById('newPassword');

    toggleNewPassword.addEventListener('click', () => {
        togglePasswordVisibility(newPasswordInput, toggleNewPassword);
    });

    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const confirmNewPasswordInput = document.getElementById('confirmNewPassword');

    toggleConfirmPassword.addEventListener('click', () => {
        togglePasswordVisibility(confirmNewPasswordInput, toggleConfirmPassword);
    });

    function togglePasswordVisibility(inputField, toggleIcon) {
        const isPasswordVisible = inputField.type === 'text';

        if (isPasswordVisible) {
            inputField.type = 'password';
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
        } else {
            inputField.type = 'text';
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');

            setTimeout(() => {
                inputField.type = 'password';
                toggleIcon.classList.remove('fa-eye-slash');
                toggleIcon.classList.add('fa-eye');
            }, 5000);
        }
    }
});