  // const loginForm = document.getElementById("loginForm");
  // const emailInput = document.getElementById("emailInput");

  // loginForm.addEventListener("submit", function (event) {
  //   event.preventDefault();

  //   const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  //   emailInput.classList.remove("is-invalid");

  //   if (!emailPattern.test(emailInput.value.trim())) {
  //     emailInput.classList.add("is-invalid");
  //     return;
  //   }

  //   // Prepare the form data as JSON
  //   const formData = {
  //     email: emailInput.value.trim(),
  //   };

  //   // Send OTP request to the server
  //   fetch("/send-otp", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json", // Indicating that we're sending JSON
  //     },
  //     body: JSON.stringify(formData), // Sending the email in JSON format
  //   })
  //   .then((response) => response.json())
  //   .then((data) => {
  //     if (data.message === "OTP sent successfully") {
  //       // Redirect to OTP verification page if successful
  //       window.location.href = "/forgetotppage";
  //     } else if (data.message === "Email not found") {
  //       alert("Email not found. Please check and try again.");
  //     } else {
  //       alert("Failed to send OTP. Please try again.");
  //     }
  //   })
  //   .catch((error) => {
  //     console.error("Error:", error);
  //     alert("An error occurred while sending OTP.");
  //   });
  // });