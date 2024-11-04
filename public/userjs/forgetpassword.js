document.addEventListener("DOMContentLoaded", function () {
  const alertMessage = document.getElementById("alertMessage");

  if (alertMessage) {
    setTimeout(() => {
      alertMessage.style.display = "none";
    }, 5000);
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const emailInput = document.getElementById("emailInput");
  const emailFeedback = document.getElementById("emailFeedback");
  const submitButton = document.getElementById("submitButton");

  emailInput.addEventListener("input", function () {
    validateEmail();
  });

  function validateEmail() {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(emailInput.value)) {
      emailFeedback.style.display = "block";
      emailInput.classList.add("is-invalid");
      submitButton.disabled = true;
    } else {
      emailFeedback.style.display = "none";
      emailInput.classList.remove("is-invalid");
      submitButton.disabled = false;
    }
  }
});
