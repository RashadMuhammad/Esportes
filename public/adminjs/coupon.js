document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("addCouponForm");
  const discountType = document.getElementById("discountType");
  const discountValue = document.getElementById("discountValue");
  const minCartValue = document.getElementById("minCartValue");
  const maxDiscountValue = document.getElementById("maxDiscountValue");
  const couponCode = document.getElementById("couponCode");
  const validFrom = document.getElementById("validFrom");
  const validUntil = document.getElementById("validUntil");

  const showError = (element, message) => {
    const errorSpan = document.createElement("span");
    errorSpan.classList.add("text-danger");
    errorSpan.innerHTML = message;
    element.parentElement.appendChild(errorSpan);
  };

  const clearError = (element) => {
    const errorSpan = element.parentElement.querySelector(".text-danger");
    if (errorSpan) {
      errorSpan.remove();
    }
  };

  const isDateValid = (inputDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to 00:00:00 for comparison
    return new Date(inputDate) >= today;
  };

  form.addEventListener("input", (event) => {
    const target = event.target;

    clearError(target);

    if (target === discountValue) {
      if (
        discountType.value === "percentage" &&
        (discountValue.value <= 0 || discountValue.value > 80)
      ) {
        showError(
          discountValue,
          "Percentage discount must be between 1 and 80."
        );
      } else if (
        discountType.value === "fixed" &&
        discountValue.value >= minCartValue.value
      ) {
        showError(
          discountValue,
          "Fixed discount value must be less than the minimum cart value."
        );
      } else if (discountType.value === "fixed" && discountValue.value <= 0) {
        showError(discountValue, "Fixed discount value must be positive.");
      }
    }

    if (
      target === maxDiscountValue &&
      discountType.value === "percentage" &&
      maxDiscountValue.value <= 0
    ) {
      showError(
        maxDiscountValue,
        "Maximum discount value must be a positive number."
      );
    }
  });

  form.addEventListener("submit", (event) => {
    let isValid = true;

    document.querySelectorAll(".text-danger").forEach((el) => el.remove());

    // Coupon code validation
    if (couponCode.value.trim() === "") {
      showError(couponCode, "Coupon code cannot be empty.");
      isValid = false;
    }

    // Valid From date validation
    if (!isDateValid(validFrom.value)) {
      showError(validFrom, "Valid From date must be today or a future date.");
      isValid = false;
    }

    // Valid Until date validation
    if (validUntil.value && new Date(validUntil.value) <= new Date(validFrom.value)) {
      showError(validUntil, "Valid Until date must be after Valid From date.");
      isValid = false;
    }

    // Discount validations
    if (
      discountType.value === "percentage" &&
      (discountValue.value <= 0 || discountValue.value > 80)
    ) {
      showError(discountValue, "Percentage discount must be between 1 and 80.");
      isValid = false;
    }

    if (discountType.value === "fixed" && discountValue.value <= 0) {
      showError(discountValue, "Fixed discount value must be positive.");
      isValid = false;
    }

    if (
      discountType.value === "fixed" &&
      discountValue.value >= minCartValue.value
    ) {
      showError(
        discountValue,
        "Fixed discount value must be less than the minimum cart value."
      );
      isValid = false;
    }

    if (!isValid) {
      event.preventDefault();
    }
  });
});













document.addEventListener("DOMContentLoaded", function () {
  // Select all forms for validation
  const forms = document.querySelectorAll('[id^="editCouponForm_"]');

  forms.forEach((form) => {
    const couponId = form.getAttribute("id").split("_")[1];

    // Coupon Code validation
    const couponCodeInput = document.getElementById(`couponCode_${couponId}`);
    couponCodeInput.addEventListener("input", function () {
      if (couponCodeInput.value.trim() === "") {
        couponCodeInput.classList.add("is-invalid");
        couponCodeInput.setCustomValidity("Coupon code is required.");
      } else {
        couponCodeInput.classList.remove("is-invalid");
        couponCodeInput.setCustomValidity("");
      }
    });

    // Discount Value validation
    const discountValueInput = document.getElementById(
      `discountValue_${couponId}`
    );
    discountValueInput.addEventListener("input", function () {
      if (discountValueInput.value <= 0) {
        discountValueInput.classList.add("is-invalid");
        discountValueInput.setCustomValidity(
          "Discount value must be greater than 0."
        );
      } else {
        discountValueInput.classList.remove("is-invalid");
        discountValueInput.setCustomValidity("");
      }
    });

    // Minimum Cart Value validation
    const minCartValueInput = document.getElementById(
      `minCartValue_${couponId}`
    );
    minCartValueInput.addEventListener("input", function () {
      if (minCartValueInput.value < 0) {
        minCartValueInput.classList.add("is-invalid");
        minCartValueInput.setCustomValidity(
          "Minimum cart value cannot be negative."
        );
      } else {
        minCartValueInput.classList.remove("is-invalid");
        minCartValueInput.setCustomValidity("");
      }
    });

    const maxDiscountValueInput = document.getElementById(
      `maxDiscountValue_${couponId}`
    );
    maxDiscountValueInput.addEventListener("input", function () {
      if (maxDiscountValueInput.value <= 0) {
        maxDiscountValueInput.classList.add("is-invalid");
        maxDiscountValueInput.setCustomValidity(
          "Maximum discount value must be greater than 0."
        );
      } else {
        maxDiscountValueInput.classList.remove("is-invalid");
        maxDiscountValueInput.setCustomValidity("");
      }
    });

    const validFromInput = document.getElementById(`validFrom_${couponId}`);
    const validUntilInput = document.getElementById(`validUntil_${couponId}`);

    const validateDateRange = () => {
      if (
        validFromInput.value &&
        validUntilInput.value &&
        validFromInput.value > validUntilInput.value
      ) {
        validUntilInput.classList.add("is-invalid");
        validUntilInput.setCustomValidity(
          "Valid Until date must be after Valid From date."
        );
      } else {
        validUntilInput.classList.remove("is-invalid");
        validUntilInput.setCustomValidity("");
      }
    };

    validFromInput.addEventListener("change", validateDateRange);
    validUntilInput.addEventListener("change", validateDateRange);

    form.addEventListener("submit", function (event) {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add("was-validated");
    });
  });
});
