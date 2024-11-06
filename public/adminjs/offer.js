const errors = document.getElementById('errors')


function editOffer(offerId) {
  axios
    .get(`/admin/offers/${offerId}`)
    .then((response) => {
      const offer = response.data;

      document.getElementById("offerId").value = offer._id;
      document.getElementById("type").value = offer.type;
      document.getElementById("discountTyp").value = offer.discountType;
      document.getElementById("product").value = offer.product
        ? offer.product._id
        : "";
      document.getElementById("category").value = offer.category
        ? offer.category._id
        : "";
      document.getElementById("discount").value = offer.discountValue;
      document.getElementById("validF").value = new Date(offer.validFrom)
        .toISOString()
        .split("T")[0];
      document.getElementById("validU").value = new Date(offer.validUntil)
        .toISOString()
        .split("T")[0];
      document.getElementById("minProductPric").value = offer.minProductPrice;
      document.getElementById("maxDiscount").value = offer.maxDiscountValue;

      $("#editOfferModal").modal("show");
    })
    .catch((error) => {
      console.error("Error fetching the offer data:", error.response.data);
    });
}


document.getElementById("saveOfferBtn").addEventListener("click", function () {
  const offerId = document.getElementById("offerId").value;
  const type = document.getElementById("type").value;
  const discountType = document.getElementById("discountTyp").value;
  const product = document.getElementById("product").value;
  const category = document.getElementById("category").value;
  const discountValue = parseFloat(document.getElementById("discount").value);
  const maxDiscountValue = parseFloat(
    document.getElementById("maxDiscount").value
  );
  const minProductPrice = parseFloat(
    document.getElementById("minProductPric").value
  );
  const validFrom = new Date(document.getElementById("validF").value);
  const validUntil = new Date(document.getElementById("validU").value);
  const today = new Date();

  let isValid = true;
  let validationMessage = "";

  if (
    discountType === "percentage" &&
    (discountValue < 1 || discountValue > 80)
  ) {
    isValid = false;
    validationMessage +=
      "Discount Value must be between 1% and 80% for percentage discounts.\n";
  }

  if (
    type === "category" &&
    discountType === "fixed" &&
    maxDiscountValue >= minProductPrice
  ) {
    isValid = false;
    validationMessage +=
      "Max Discount Value must be less than Minimum Product Price for fixed discounts on category offers.\n";
  }

  if (type === "product") {
    if (!discountValue || !discountType) {
      isValid = false;
      validationMessage +=
        "For product offers, Discount Value and Discount Type are required.\n";
    }
  }

  if (type === "category") {
    if (
      !discountValue ||
      !discountType ||
      !minProductPrice ||
      !validFrom ||
      !validUntil
    ) {
      isValid = false;
      validationMessage += "For category offers, all fields are required.\n";
    }
  }

  if (isValid) {
    const updatedOffer = {
      type,
      discountType,
      product: product || undefined,
      category: category || undefined,
      discountValue,
      maxDiscountValue,
      minProductPrice,
      validFrom: validFrom.toISOString(),
      validUntil: validUntil.toISOString(),
    };

    axios
      .put(`/admin/offers/edit/${offerId}`, updatedOffer)
      .then(() => {
        $("#editOfferModal").modal("hide");
        location.reload();
      })
      .catch((error) => {
        console.error("Error updating the offer:", error.response.data);
      });
  } else {
    errors.innerHTML = validationMessage
    setTimeout(()=>{
      errors.innerHTML = ''
    },5000)
  }
});

document.getElementById("type").addEventListener("change", function () {
  const type = this.value;
  const productFields = document.getElementById("product").parentElement;
  const categoryFields = document.getElementById("category").parentElement;

  if (type === "product") {
    productFields.style.display = "block";
    categoryFields.style.display = "none";
  } else if (type === "category") {
    productFields.style.display = "none";
    categoryFields.style.display = "block";
  }
});

document.getElementById("discountType").addEventListener("change", function () {
  const discountType = this.value;
  const discountValueInput = document.getElementById("discount");

  if (discountType === "percentage") {
    discountValueInput.setAttribute("max", "80");
    discountValueInput.setAttribute("min", "1");
  } else {
    discountValueInput.removeAttribute("max");
    discountValueInput.removeAttribute("min");
  }
});

document.getElementById("type").dispatchEvent(new Event("change"));
document.getElementById("discountType").dispatchEvent(new Event("change"));

document
  .getElementById("offerType")
  .addEventListener("change", handleOfferTypeChange);

document
  .querySelectorAll("#discountValue, #maxDiscountValue, #minProductPrice")
  .forEach((input) => {
    input.addEventListener("input", validateDiscounts);
  });

document.getElementById("productName").addEventListener("input", function () {
  clearErrorMessage("productNameError");
  validateForm();
});

document.getElementById("categoryName").addEventListener("input", function () {
  clearErrorMessage("categoryNameError");
  validateForm();
});

document.getElementById("validFrom").addEventListener("input", function () {
  clearErrorMessage("validFromError");
  validateForm();
});

document.getElementById("validUntil").addEventListener("input", function () {
  clearErrorMessage("validUntilError");
  validateForm();
});


document.getElementById("discountType").addEventListener("change", function () {
  clearErrorMessage("discountTypeError");
  handleDiscountTypeChange(); 
  validateForm(); 
});















// add form
document
  .getElementById("addOfferForm")
  .addEventListener("submit", function (e) {
    const isValid = validateForm(); // Run validation for all fields
    if (!isValid) {
      e.preventDefault(); // Prevent form submission if validation fails
    }
  });

// Add a listener for input events to validate the form in real time
document.getElementById("addOfferForm").addEventListener("input", function () {
  const isValid = validateForm();
  updateOfferButtonState(isValid); // Update button state based on validation
});

// Handle offer type change
function handleOfferTypeChange() {
  const offerType = document.getElementById("offerType").value;
  const discountType = document.getElementById("discountType").value;

  // Show/hide fields based on offer type
  document.getElementById("productField").style.display =
    offerType === "product" ? "block" : "none";
  document.getElementById("categoryField").style.display =
    offerType === "category" ? "block" : "none";
  document.getElementById("referralFields").style.display =
    offerType === "referral" ? "block" : "none";

  // Show max discount value field only for category offer type with percentage discount type
  if (offerType === "category" && discountType === "percentage") {
    document.getElementById("maxDiscountValueField").style.display = "block";
  } else {
    document.getElementById("maxDiscountValueField").style.display = "none";
  }

  // Clear error messages
  clearErrorMessages([
    "offerTypeError",
    "productNameError",
    "categoryNameError",
    "minProductPriceError",
  ]);

  // Clear Product and Category inputs if they are not relevant
  if (offerType !== "product") {
    document.getElementById("productName").value = "";
  }
  if (offerType !== "category") {
    document.getElementById("categoryName").value = "";
  }

  // Show min product price field for category offer type
  document.getElementById("minProductPriceField").style.display =
    offerType === "category" ? "block" : "none";
}

// Handle discount type change
function handleDiscountTypeChange() {
  const offerType = document.getElementById("offerType").value;
  const discountType = document.getElementById("discountType").value;

  // Show max discount value field only for category offer type with percentage discount type
  if (offerType === "category" && discountType === "percentage") {
    document.getElementById("maxDiscountValueField").style.display = "block";
  } else {
    document.getElementById("maxDiscountValueField").style.display = "none";
  }

  validateDiscountValue(); // Call validation function when discount type changes
}

// Validate discount value based on discount type
function validateDiscountValue() {
  const discountType = document.getElementById("discountType").value;
  const discountValue =
    parseFloat(document.getElementById("discountValue").value) || 0;

  clearErrorMessage("discountValueError");

  // Validate discount based on type
  if (discountType === "percentage" && discountValue > 80) {
    showErrorMessage(
      "discountValueError",
      "Percentage discount cannot exceed 80%."
    );
  } else if (
    discountType === "fixedAmount" &&
    (isNaN(discountValue) || discountValue < 0)
  ) {
    showErrorMessage(
      "discountValueError",
      "Discount Value must be a positive number for fixed amount type."
    );
  }

  validateForm();
}

// Real-time discount validation
function validateDiscounts() {
  const discountValue =
    parseFloat(document.getElementById("discountValue").value) || 0;
  const minProductPrice =
    parseFloat(document.getElementById("minProductPrice").value) || 0;

  clearErrorMessages([
    "discountValueError",
    "maxDiscountValueError",
    "minProductPriceError",
  ]);

  const offerType = document.getElementById("offerType").value;
  const discountType = document.getElementById("discountType").value;

  // Additional validation for min product price if offer type is category
  if (offerType === "category") {
    if (discountType === "percentage") {
      if (discountValue > 80) {
        showErrorMessage(
          "discountValueError",
          "Discount Value cannot exceed 80% for percentage type."
        );
      }
    } else if (discountType === "fixedAmount") {
      if (discountValue >= minProductPrice) {
        showErrorMessage(
          "discountValueError",
          "Discount Value must be less than the Minimum Product Price."
        );
      }
    }

    if (discountValue >= minProductPrice) {
      showErrorMessage(
        "discountValueError",
        "Discount Value must be less than Minimum Product Price."
      );
    }
  }

  validateForm();
}

function validateForm() {
  let isValid = true;
  const today = new Date();
  const currentDate = today.toISOString().split("T")[0];

  isValid =
    validateRequiredField(
      "offerType",
      "offerTypeError",
      "Offer Type is required."
    ) && isValid;

  if (document.getElementById("offerType").value === "product") {
    isValid =
      validateRequiredField(
        "productName",
        "productNameError",
        "Product Name is required."
      ) && isValid;
  }

  if (document.getElementById("offerType").value === "category") {
    isValid =
      validateRequiredField(
        "categoryName",
        "categoryNameError",
        "Category Name is required."
      ) && isValid;
  }

  if (document.getElementById("offerType").value === "category") {
    const minProductPrice =
      parseFloat(document.getElementById("minProductPrice").value) || 0;
    isValid =
      validateRequiredField(
        "minProductPrice",
        "minProductPriceError",
        "Minimum Product Price is required."
      ) && isValid;
    if (minProductPrice <= 0) {
      showErrorMessage(
        "minProductPriceError",
        "Minimum Product Price must be greater than 0."
      );
      isValid = false;
    }

    const discountValue =
      parseFloat(document.getElementById("discountValue").value) || 0;
    if (discountValue >= minProductPrice) {
      showErrorMessage(
        "minProductPriceError",
        "Discount Value must be less than Minimum Product Price."
      );
      isValid = false;
    }
  }

  isValid =
    validateRequiredField(
      "discountType",
      "discountTypeError",
      "Discount Type is required."
    ) && isValid;

  const discountValue =
    parseFloat(document.getElementById("discountValue").value) || 0;
  const minProductPrice =
    parseFloat(document.getElementById("minProductPrice").value) || 0;

  if (document.getElementById("discountType").value === "fixedAmount") {
    if (discountValue >= minProductPrice) {
      showErrorMessage(
        "discountValueError",
        "Discount Value must be less than Minimum Product Price."
      );
      isValid = false;
    }
  } else if (document.getElementById("discountType").value === "percentage") {
    if (discountValue > 80) {
      showErrorMessage(
        "discountValueError",
        "Discount Value must be less than or equal to 80%."
      );
      isValid = false;
    }
  }

  const offerType = document.getElementById("offerType").value;
  const maxDiscountValue =
    parseFloat(document.getElementById("maxDiscountValue").value) || 0;

  if (
    offerType === "category" &&
    discountType === "percentage" &&
    maxDiscountValue <= 0
  ) {
    showErrorMessage(
      "maxDiscountValueError",
      "Max Discount Value is required for percentage type."
    );
    isValid = false;
  }

  isValid =
    validateDate(
      "validFrom",
      currentDate,
      "validFromError",
      "Valid From date cannot be in the past."
    ) && isValid;

  const validFrom = document.getElementById("validFrom").value;
  isValid =
    validateDate(
      "validUntil",
      validFrom,
      "validUntilError",
      "Valid Until date cannot be before Valid From date."
    ) && isValid;

  updateOfferButtonState(isValid);
  return isValid;
}

function validateRequiredField(fieldId, errorId, errorMessage) {
  const field = document.getElementById(fieldId).value.trim();
  if (!field) {
    showErrorMessage(errorId, errorMessage);
    return false;
  }
  return true;
}

function validateDate(fieldId, compareDate, errorId, errorMessage) {
  const dateValue = document.getElementById(fieldId).value;
  if (dateValue < compareDate) {
    showErrorMessage(errorId, errorMessage);
    return false;
  }
  return true;
}

function showErrorMessage(errorId, message) {
  const errorElement = document.getElementById(errorId);
  errorElement.innerText = message;
  errorElement.style.display = "block";
}

function clearErrorMessage(errorId) {
  const errorElement = document.getElementById(errorId);
  errorElement.innerText = "";
  errorElement.style.display = "none";
}

function clearErrorMessages(errorIds) {
  errorIds.forEach(clearErrorMessage);
}

function updateOfferButtonState(isValid) {
  const button = document.getElementById("addOfferButton");
  button.disabled = !isValid;
}

let currentOfferId = "";
let currentAction = "";

function openConfirmationModal(offerId, currentStatus) {
  currentOfferId = offerId;
  currentAction = currentStatus === "active" ? "unlist" : "List";

  document.getElementById("actionType").textContent = currentAction;

  const confirmationModal = new bootstrap.Modal(
    document.getElementById("confirmationModal")
  );
  confirmationModal.show();
}

document.getElementById("confirmButton").addEventListener("click", function () {
  toggleOfferStatus(currentOfferId, currentAction);
});

function toggleOfferStatus(offerId, action) {
  const newStatus = action === "unlist" ? "expired" : "active";

  axios
    .put(`/admin/offers/toggle-status/${offerId}`, { status: newStatus })
    .then(function (response) {
      location.reload();
    })
    .catch(function (error) {
      console.error("Error updating offer status:", error);
    });
}





//offer delete

let offerIdToDelete = null;

function showDeleteModal(offerId) {
  offerIdToDelete = offerId;
  $('#deleteOfferModal').modal('show');
}

document.getElementById('confirmDeleteBtn').addEventListener('click', function () {
  axios.delete(`/admin/offers/delete/${offerIdToDelete}`)
    .then(function (response) {
      $('#deleteOfferModal').modal('hide'); 
      location.reload(); 
    })
    .catch(function (error) {
      console.error('Error deleting the offer:', error);
    });
});