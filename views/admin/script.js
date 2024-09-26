document.addEventListener("DOMContentLoaded", function () {
  // Validation
  const form = document.getElementById("editProductForm");
  const productNoInput = form.elements["productNo"];
  const nameInput = form.elements["name"];
  const descriptionInput = form.elements["description"];
  const priceInput = form.elements["price"];
  const stockInput = form.elements["stock"];
  const categorySelect = form.elements["category"];

  function validateInput(input, errorElement) {
    if (!input.value) {
      errorElement.textContent = "This field is required.";
      return false;
    } else if (input.name === "price" || input.name === "stock") {
      if (input.value < 0) {
        errorElement.textContent = "Must be a positive number.";
        return false;
      }
    }
    errorElement.textContent = "";
    return true;
  }

  function validateForm() {
    const isProductNoValid = validateInput(
      productNoInput,
      document.getElementById("productNoError")
    );
    const isNameValid = validateInput(
      nameInput,
      document.getElementById("nameError")
    );
    const isDescriptionValid = validateInput(
      descriptionInput,
      document.getElementById("descriptionError")
    );
    const isPriceValid = validateInput(
      priceInput,
      document.getElementById("priceError")
    );
    const isStockValid = validateInput(
      stockInput,
      document.getElementById("stockError")
    );
    const isCategoryValid = validateInput(
      categorySelect,
      document.getElementById("categoryError")
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

  form.addEventListener("input", validateForm); // Validate on input
  form.addEventListener("submit", function (event) {
    if (!validateForm()) {
      event.preventDefault(); // Prevent form submission if invalid
    }
  });

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

    imageInput.addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          imagePreview.src = e.target.result;
          imagePreview.style.display = "block";
          cropButton.style.display = "inline-block";
          cropperContainer.innerHTML =
            '<img id="cropImage" src="' +
            e.target.result +
            '" style="max-width: 100%;">';
          cropperContainer.style.display = "block"; // Show cropper container

          // Initialize Cropper
          const cropImage = document.getElementById("cropImage");
          if (cropper) {
            cropper.destroy(); // Destroy previous cropper instance
          }
          cropper = new Cropper(cropImage, {
            aspectRatio: 1, // Adjust as needed
            viewMode: 1,
          });

          cropButton.onclick = function () {
            const canvas = cropper.getCroppedCanvas();
            canvas.toBlob(function (blob) {
              const reader = new FileReader();
              reader.onloadend = function () {
                // You can send the cropped image as base64 or handle it as needed
                console.log(reader.result); // For debugging
                // Use reader.result to send to server or store in a hidden input
              };
              reader.readAsDataURL(blob);
            });
          };
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Set up cropping for each image input
  setupCropping(
    "imageUpload1-edit-<%= product._id %>",
    "imagePreview1-edit-<%= product._id %>",
    "cropButton1-edit-<%= product._id %>",
    "cropperContainer1-edit-<%= product._id %>"
  );
  setupCropping(
    "imageUpload2-edit-<%= product._id %>",
    "imagePreview2-edit-<%= product._id %>",
    "cropButton2-edit-<%= product._id %>",
    "cropperContainer2-edit-<%= product._id %>"
  );
  setupCropping(
    "imageUpload3-edit-<%= product._id %>",
    "imagePreview3-edit-<%= product._id %>",
    "cropButton3-edit-<%= product._id %>",
    "cropperContainer3-edit-<%= product._id %>"
  );
});
