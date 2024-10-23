// <!-- JavaScript for real-time validation and password visibility -->
    document.getElementById("name").addEventListener("input", validateName);
    document.getElementById("email").addEventListener("input", validateEmail);
    document.getElementById("password").addEventListener("input", validatePassword);
    document.getElementById("confirmPassword").addEventListener("input", validateConfirmPassword);

    // Real-time validation functions
    function validateName() {
        const name = document.getElementById("name").value;
        const nameError = document.getElementById("nameError");
        nameError.textContent = name.length < 4 ? "Name must be at least 4 characters long." : "";
    }

    function validateEmail() {
        const email = document.getElementById("email").value;
        const emailError = document.getElementById("emailError");
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        emailError.textContent = !emailPattern.test(email) ? "Please enter a valid email address." : "";
    }

    function validatePassword() {
        const password = document.getElementById("password").value;
        const passwordError = document.getElementById("passwordError");
        passwordError.textContent = password.length < 8 ? "Password must be at least 8 characters long." : "";
    }

    function validateConfirmPassword() {
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const confirmPasswordError = document.getElementById("confirmPasswordError");
        confirmPasswordError.textContent = password !== confirmPassword ? "Passwords do not match." : "";
    }

    document.getElementById("signupForm").addEventListener("submit", function (event) {
        // Check if all fields are valid before submission
        validateName();
        validateEmail();
        validatePassword();
        validateConfirmPassword();

        if (document.querySelectorAll(".text-danger:empty").length < 4) {
            event.preventDefault(); // Prevent form submission if there are validation errors
        }
    });

    // Toggle password visibility
    const togglePassword = document.getElementById("togglePassword");
    const passwordInput = document.getElementById("password");
    togglePassword.addEventListener("click", function () {
        const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
        passwordInput.setAttribute("type", type);
        this.classList.toggle("fa-eye-slash");
    });

    const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    toggleConfirmPassword.addEventListener("click", function () {
        const type = confirmPasswordInput.getAttribute("type") === "password" ? "text" : "password";
        confirmPasswordInput.setAttribute("type", type);
        this.classList.toggle("fa-eye-slash");
    });