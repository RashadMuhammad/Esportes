const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Real-time validation feedback
emailInput.addEventListener("input", function () {
  if (emailPattern.test(emailInput.value.trim())) {
    emailInput.classList.remove("is-invalid");
    emailInput.classList.add("is-valid");
  } else {
    emailInput.classList.remove("is-valid");
    emailInput.classList.add("is-invalid");
  }
});

passwordInput.addEventListener("input", function () {
  if (passwordInput.value.length >= 8) {
    passwordInput.classList.remove("is-invalid");
    passwordInput.classList.add("is-valid");
  } else {
    passwordInput.classList.remove("is-valid");
    passwordInput.classList.add("is-invalid");
  }
});

loginForm.addEventListener("submit", function (event) {
  let isValid = true;

  // Validate email
  if (!emailPattern.test(emailInput.value.trim())) {
    emailInput.classList.add("is-invalid");
    isValid = false;
  }

  // Validate password (at least 8 characters)
  if (passwordInput.value.length < 8) {
    passwordInput.classList.add("is-invalid");
    isValid = false;
  }

  // If form is not valid, prevent submission
  if (!isValid) {
    event.preventDefault();
  }
});


// ================================================================================



