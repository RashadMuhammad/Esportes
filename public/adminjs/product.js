function handleEdit(productId) {
  
  let editCropper1, editCropper2, editCropper3;

  document
    .getElementById(`imageUpload1-edit-${productId}`)
    .addEventListener("change", function (event) {
      handleFileUpload(
        event,
        `imagePreview1-edit-${productId}`,
        `cropperContainer1-edit-${productId}`,
        editCropper1
      );
    });

  document
    .getElementById(`imageUpload2-edit-${productId}`)
    .addEventListener("change", function (event) {
      handleFileUpload(
        event,
        `imagePreview2-edit-${productId}`,
        `cropperContainer2-edit-${productId}`,
        editCropper2
      );
    });

  document
    .getElementById(`imageUpload3-edit-${productId}`)
    .addEventListener("change", function (event) {
      handleFileUpload(
        event,
        `imagePreview3-edit-${productId}`,
        `cropperContainer3-edit-${productId}`,
        editCropper3
      );
    });

  function handleFileUpload(event, previewId, hiddenFieldId, cropper) {
    const file = event.target.files[0];
    if (file) {
      const imgURL = URL.createObjectURL(file);
      const previewImage = document.getElementById(previewId);
      previewImage.src = imgURL;
      previewImage.style.display = "block";

      if (cropper) {
        cropper.destroy(); // Destroy previous cropper instance
      }

      cropper = new Cropper(previewImage, {
        aspectRatio: 1,
        viewMode: 2,
        ready() {
          // You can do something when the cropper is ready
        },
      });

      // Store cropper instance
      window[hiddenFieldId] = cropper;
    }
  }

  document
    .getElementById("addProductForm")
    .addEventListener("submit", function (event) {
      event.preventDefault(); // Prevent form submission

      // Get cropped images as blobs
      const formData = new FormData();
      formData.append("productNo", document.getElementById("productNo").value);
      formData.append("name", document.getElementById("name").value);
      formData.append(
        "description",
        document.getElementById("description").value
      );
      formData.append("category", document.getElementById("category").value);
      formData.append("stock", document.getElementById("stock").value);
      formData.append("price", document.getElementById("price").value);

      let imageUploadPromises = [];
      ["1", "2", "3"].forEach((i) => {
        const cropper = window[`croppedImage${i}`];
        if (cropper) {
          const promise = new Promise((resolve, reject) => {
            cropper.getCroppedCanvas().toBlob((blob) => {
              if (blob) {
                formData.append(`images`, blob, `image${i}.png`);
                resolve();
              } else {
                reject("Error cropping image");
              }
            });
          });
          imageUploadPromises.push(promise);
        }
      });

      Promise.all(imageUploadPromises)
        .then(() => {
          fetch("/admin/products/add", {
            method: "POST",
            body: formData,
          })
            .then((data) => {
              
              
              alert("Product added successfully!");
            })
            .catch((error) => {
              console.error(error);
              alert("An error occurred while uploading the product.");
            });
        })
        .catch((error) => {
          console.error(error);
          alert("Error processing images");
        });
    });

  document
    .getElementById("editProductForm")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      const formData = new FormData(e.target);
      formData.append("id", e.target.dataset.id);

      // Array to store promises for image cropping
      let imageUploadPromises = [];

      this.submit();
    });
}

// =======================================================================================

document.addEventListener("DOMContentLoaded", function () {
  // Form validation
  function validateInput(input, errorElement) {
    // Regular expression to check for special characters
    const specialCharRegex = /[^a-zA-Z0-9\s]/;

    // Trim the input to remove leading and trailing spaces
    if (!input.value.trim()) {
      errorElement.textContent =
        "This field is required and cannot contain only spaces.";
      errorElement.style.color = "red";
      errorElement.style.fontWeight = "100";
      errorElement.style.fontSize = "15px";
      return false;
    }
    // Check for special characters
    else if (specialCharRegex.test(input.value)) {
      errorElement.textContent = "Special characters are not allowed.";
      errorElement.style.color = "red";
      errorElement.style.fontWeight = "100";
      errorElement.style.fontSize = "15px";
      return false;
    }
    // Check for positive numbers in price and stock inputs
    else if (
      (input.name === "price" || input.name === "stock") &&
      input.value < 0
    ) {
      errorElement.textContent = "Must be a positive number.";
      errorElement.style.color = "red";
      errorElement.style.fontWeight = "100";
      errorElement.style.fontSize = "15px";
      return false;
    }

    // Clear any previous error messages
    errorElement.textContent = "";
    return true;
  }

  function validateForm(formId) {
    const form = document.getElementById(formId);
    const productNoInput = form.elements["productNo"];
    const nameInput = form.elements["name"];
    const descriptionInput = form.elements["description"];
    const priceInput = form.elements["price"];
    const stockInput = form.elements["stock"];
    const categorySelect = form.elements["category"];

    const isProductNoValid = validateInput(
      productNoInput,
      document.getElementById(`productNoError-${formId.split("-")[1]}`)
    );
    const isNameValid = validateInput(
      nameInput,
      document.getElementById(`nameError-${formId.split("-")[1]}`)
    );
    const isDescriptionValid = validateInput(
      descriptionInput,
      document.getElementById(`descriptionError-${formId.split("-")[1]}`)
    );
    const isPriceValid = validateInput(
      priceInput,
      document.getElementById(`priceError-${formId.split("-")[1]}`)
    );
    const isStockValid = validateInput(
      stockInput,
      document.getElementById(`stockError-${formId.split("-")[1]}`)
    );
    const isCategoryValid = validateInput(
      categorySelect,
      document.getElementById(`categoryError-${formId.split("-")[1]}`)
    );

    return (
      isProductNoValid &&
      isNameValid &&
      isDescriptionValid &&
      isPriceValid &&
      isStockValid &&
      isCategoryValid
    );
  }

  document
    .querySelectorAll('form[id^="editProductForm"]')
    .forEach(function (form) {
      form.addEventListener("input", function () {
        validateForm(form.id);
      });
      form.addEventListener("submit", function (event) {
        if (!validateForm(form.id)) {
          event.preventDefault();
        }
      });
    });

  // Cropping functionality
  function setupCropping(
    imageInputId,
    imagePreviewId,
    cropButtonId,
    cropperContainerId
  ) {
    const imageInput = document.getElementById(imageInputId);
    const imagePreview = document.getElementById(imagePreviewId);
    const cropButton = document.getElementById(cropButtonId);
    const cropperContainer = document.getElementById(cropperContainerId);

    let cropper;

    imageInput.addEventListener("change", function () {
      const file = imageInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          imagePreview.src = e.target.result;
          imagePreview.style.display = "block";
          cropButton.style.display = "inline-block";
          if (cropper) cropper.destroy();
          cropper = new Cropper(imagePreview, {
            aspectRatio: 1,
            viewMode: 2,
          });
        };
        reader.readAsDataURL(file);
      }
    });

    if (cropButton) {
      cropButton.addEventListener("click", function () {
        const canvas = cropper.getCroppedCanvas();
        canvas.toBlob(function (blob) {
          // Append blob to form for upload
          const formData = new FormData();
          formData.append("croppedImage", blob, "croppedImage.jpg");
          
          // Use fetch to upload blob to server
        });
      });
    }
  }

  // Initialize cropping for each image input
  document.querySelectorAll('input[type="file"]').forEach(function (input) {
    const inputId = input.id;
    const previewId = inputId.replace("imageUpload", "imagePreview");
    const cropButtonId = inputId.replace("imageUpload", "cropButton");
    const cropperContainerId = inputId.replace(
      "imageUpload",
      "cropperContainer"
    );
    setupCropping(inputId, previewId, cropButtonId, cropperContainerId);
  });
});

//   ===================================================================================

let cropper1, cropper2, cropper3;

document
  .getElementById("imageUpload1")
  .addEventListener("change", function (event) {
    handleFileUpload(event, "imagePreview1", "croppedImage1", cropper1);
    
  });

document
  .getElementById("imageUpload2")
  .addEventListener("change", function (event) {
    handleFileUpload(event, "imagePreview2", "croppedImage2", cropper2);
  });

document
  .getElementById("imageUpload3")
  .addEventListener("change", function (event) {
    handleFileUpload(event, "imagePreview3", "croppedImage3", cropper3);
  });

function handleFileUpload(event, previewId, hiddenFieldId, cropper) {
  const file = event.target.files[0];
  if (file) {
    const imgURL = URL.createObjectURL(file);
    const previewImage = document.getElementById(previewId);
    previewImage.src = imgURL;
    previewImage.style.display = "block";

    if (cropper) {
      cropper.destroy(); // Destroy previous cropper instance
    }

    cropper = new Cropper(previewImage, {
      aspectRatio: 1,
      viewMode: 2,
      ready() {
        // You can do something when the cropper is ready
      },
    });

    // Store cropper instance
    window[hiddenFieldId] = cropper;
  }
}

document
  .getElementById("addProductForm")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent form submission

    // Get cropped images as blobs
    const formData = new FormData();
    formData.append("productNo", document.getElementById("productNo").value);
    formData.append("name", document.getElementById("name").value);
    formData.append(
      "description",
      document.getElementById("description").value
    );
    formData.append("category", document.getElementById("category").value);
    formData.append("stock", document.getElementById("stock").value);
    formData.append("price", document.getElementById("price").value);

    let imageUploadPromises = [];
    ["1", "2", "3"].forEach((i) => {
      const cropper = window[`croppedImage${i}`];
      if (cropper) {
        const promise = new Promise((resolve, reject) => {
          cropper.getCroppedCanvas().toBlob((blob) => {
            if (blob) {
              formData.append(`images`, blob, `image${i}.png`);
              resolve();
            } else {
              reject("Error cropping image");
            }
          });
        });
        imageUploadPromises.push(promise);
      }
    });

Promise.all(imageUploadPromises)
  .then(() => {
    fetch("/admin/products/add", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (response.ok) {
          window.location.href = "/admin/Products";
        } else {
          return response.text().then((text) => {
            console.error("Error response:", text);
            alert("An error occurred while adding the product.");
          });
        }
      })
      .catch((error) => {
        console.error("Fetch error:", error);
        alert("An error occurred while uploading the product.");
      });
  })
  .catch((error) => {
    console.error("Image processing error:", error);
    alert("Error processing images.");
  });

  });

// ===============================================================================

document.addEventListener("DOMContentLoaded", () => {
  const productNo = document.getElementById("productNo");
  const name = document.getElementById("name");
  const description = document.getElementById("description");
  const category = document.getElementById("category");
  const stock = document.getElementById("stock");
  const price = document.getElementById("price");

  const imageUpload1 = document.getElementById("imageUpload1");
  const imageUpload2 = document.getElementById("imageUpload2");
  const imageUpload3 = document.getElementById("imageUpload3");
  const imagePreview1 = document.getElementById("imagePreview1");
  const imagePreview2 = document.getElementById("imagePreview2");
  const imagePreview3 = document.getElementById("imagePreview3");

  const addProductButton = document.getElementById("addProductButton");

  // Error messages
  const productNoError = document.getElementById("productNoError");
  const nameError = document.getElementById("nameError");
  const descriptionError = document.getElementById("descriptionError");
  const categoryError = document.getElementById("categoryError");
  const stockError = document.getElementById("stockError");
  const priceError = document.getElementById("priceError");
  const imageUpload1Error = document.getElementById("imageUpload1Error");
  const imageUpload2Error = document.getElementById("imageUpload2Error");
  const imageUpload3Error = document.getElementById("imageUpload3Error");

  // Regular expression to check for special characters (allows only alphanumeric characters and spaces)
  const specialCharRegex = /[^a-zA-Z0-9\s]/;

  // Real-time validation functions
  function validateProductNo() {
    if (productNo.value === "" || productNo.value <= 0) {
      productNoError.textContent =
        "Product No is required and must be greater than 0.";
      return false;
    } else {
      productNoError.textContent = "";
      return true;
    }
  }

  function validateName() {
    if (name.value.trim() === "") {
      nameError.textContent = "Product Name is required.";
      return false;
    } else if (name.value.trim().length < 3) {
      nameError.textContent =
        "Product Name must be at least 3 characters long.";
      return false;
    } else if (specialCharRegex.test(name.value.trim())) {
      nameError.textContent =
        "Special characters are not allowed in Product Name.";
      return false;
    } else {
      nameError.textContent = "";
      return true;
    }
  }

  function validateDescription() {
    if (description.value.trim() === "") {
      descriptionError.textContent = "Product Description is required.";
      return false;
    } else if (specialCharRegex.test(description.value.trim())) {
      descriptionError.textContent =
        "Special characters are not allowed in Product Description.";
      return false;
    } else {
      descriptionError.textContent = "";
      return true;
    }
  }

  function validateStock() {
    if (stock.value === "" || stock.value <= 0) {
      stockError.textContent = "Stock is required and must be greater than 0.";
      return false;
    } else {
      stockError.textContent = "";
      return true;
    }
  }

  function validatePrice() {
    if (price.value === "" || price.value <= 0) {
      priceError.textContent = "Price is required and must be greater than 0.";
      return false;
    } else {
      priceError.textContent = "";
      return true;
    }
  }

  function validateImage(input, preview, error) {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.startsWith("image/")) {
        error.textContent = "Please upload a valid image file.";
        return false;
      } else {
        error.textContent = "";
        const reader = new FileReader();
        reader.onload = function (e) {
          preview.src = e.target.result;
          preview.style.display = "block";
        };
        reader.readAsDataURL(file);
        return true;
      }
    } else {
      error.textContent = "Please upload an image.";
      return false;
    }
  }

  // Add event listeners for real-time validation
  productNo.addEventListener("input", validateProductNo);
  name.addEventListener("input", validateName);
  description.addEventListener("input", validateDescription);
  stock.addEventListener("input", validateStock);
  price.addEventListener("input", validatePrice);

  imageUpload1.addEventListener("change", () =>
    validateImage(imageUpload1, imagePreview1, imageUpload1Error)
  );
  imageUpload2.addEventListener("change", () =>
    validateImage(imageUpload2, imagePreview2, imageUpload2Error)
  );
  imageUpload3.addEventListener("change", () =>
    validateImage(imageUpload3, imagePreview3, imageUpload3Error)
  );

  // Final validation before form submission
  addProductButton.addEventListener("click", (event) => {
    const isValid =
      validateProductNo() &&
      validateName() &&
      validateDescription() &&
      validateStock() &&
      validatePrice() &&
      validateImage(imageUpload1, imagePreview1, imageUpload1Error) &&
      validateImage(imageUpload2, imagePreview2, imageUpload2Error) &&
      validateImage(imageUpload3, imagePreview3, imageUpload3Error);

    if (!isValid) {
      event.preventDefault();
    }
  });
});

//   =============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Check if there is an error in the URL
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("error")) {
    alert("There was an error editing the category.");
  }
});

// =============================================================================


setTimeout(function () {
  var alertElement = document.getElementById('alertMessage');
  if (alertElement) {
    alertElement.style.display = 'none'; 
  }
}, 5000);