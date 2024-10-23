// Countdown Timer
let timeLeft = 60; // 60 seconds
const countdownElement = document.getElementById("countdown");
const validationMessage = document.getElementById("validationMessage");
const resendMessage = document.getElementById("resendMessage");
const timer = document.getElementById("timer");
const message = document.getElementById("message");

const countdownInterval = setInterval(() => {
  if (timeLeft <= 0) {
    clearInterval(countdownInterval);
    timer.style.display = "none";
    resendMessage.style.display = "block"; // Show resend message
  } else if (timeLeft <= 0 && message.textContent.length != 0) {
    clearInterval(countdownInterval);
    timer.style.display = "none";
    resendMessage.style.display = "block";
  } else {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    countdownElement.innerText = `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
    timeLeft--;
  }
}, 1000); // Set interval to 1 second

// Auto-focus on the next input field after entering a digit
const otpInputs = document.querySelectorAll(".otp-input");
otpInputs.forEach((input, index) => {
  input.addEventListener("input", () => {
    input.value = input.value.replace(/[^0-9]/g, ""); // Remove non-digit characters
    if (input.value.length === 1 && index < otpInputs.length - 1) {
      otpInputs[index + 1].focus();
    }
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Backspace" && index > 0 && input.value.length === 0) {
      otpInputs[index - 1].focus();
    }
  });
});

document.getElementById("otpForm").addEventListener("submit", (e) => {
  e.preventDefault(); // Prevent the default form submission

  const otpInputs = document.querySelectorAll(".otp-input");
  let otp = "";
  otpInputs.forEach((input) => {
    otp += input.value;
  });

  axios
    .post("/otpverification", { otp })
    .then((response) => {
      if (response.status === 200) {
        location.replace("/");
      }
    })
    .catch((error) => {
      const errordiv = document.getElementById("errormessage");

      errordiv.innerText = error.response.data.message;
      errordiv.classList.remove("d-none");
    });
});
