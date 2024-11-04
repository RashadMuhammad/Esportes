function unlistCategory(categoryId) {
      // Check if function is triggered

    fetch(`/admin/unlist-category/${categoryId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          

          // Change the Unlist button to List with a green color
          const button = document.getElementById(`unlistButton${categoryId}`);
          button.classList.remove('badge-warning');
          button.classList.add('badge-success');
          button.innerHTML = 'Listed';
          button.disabled = true;  // Optionally disable the button

          // Close the modal
          $(`#unlistModal${categoryId}`).modal('hide');
        } else {
          console.error('Error unlisting the category');
        }
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }

//   =================================================================================


document.addEventListener('DOMContentLoaded', () => {
    const addCategoryForm = document.getElementById('addCategoryForm');

    // Real-time validation for category name
    const nameInput = document.getElementById('name');
    const descriptionInput = document.getElementById('description');
    const imageInput = document.getElementById('image');

    nameInput.addEventListener('input', async () => {
      const name = nameInput.value;
      const response = await fetch(`/admin/Categories/checkName?name=${encodeURIComponent(name)}`);
      const result = await response.json();
      const nameError = document.getElementById('nameError');

      if (result.exists) {
        nameError.textContent = 'Category name already exists. Please choose a different name.';
      } else {
        nameError.textContent = '';
      }
    });

    descriptionInput.addEventListener('input', () => {
      const descriptionError = document.getElementById('descriptionError');
      if (descriptionInput.value.trim().length < 5) { // Use trim() to remove spaces
        descriptionError.textContent = 'Description must be at least 5 characters long and cannot contain only spaces.';
      } else {
        descriptionError.textContent = '';
      }
    });

    imageInput.addEventListener('change', () => {
      const imageError = document.getElementById('imageError');
      const file = imageInput.files[0];

      if (file && !file.type.startsWith('image/')) {
        imageError.textContent = 'Please upload a valid image file.';
      } else {
        imageError.textContent = '';
      }
    });
  });

//   ======================================================================================

// Get references to the input fields and error messages
const nameInput = document.getElementById('name');
const descriptionInput = document.getElementById('description');
const imageInput = document.getElementById('image');
const nameError = document.getElementById('nameError');
const descriptionError = document.getElementById('descriptionError');
const imageError = document.getElementById('imageError');
const form = document.getElementById('addCategoryForm');

// Regular expression to check for special characters
const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;

// Function to validate fields
function validateFields() {
    let isValid = true; // Track if the form is valid

    // Clear all error messages initially
    nameError.textContent = '';
    descriptionError.textContent = '';
    imageError.textContent = '';

    // Validate Category Name
    if (nameInput.value.trim() === '') {
        nameError.textContent = 'Category name is required.';
        isValid = false;
    } else if (nameInput.value.length < 3) {
        nameError.textContent = 'Category name must be at least 3 characters long.';
        isValid = false;
    } else if (specialCharRegex.test(nameInput.value)) {
        nameError.textContent = 'Category name should not contain special characters.';
        isValid = false;
    }

    // Validate Category Description
    if (descriptionInput.value.trim() === '') {
        descriptionError.textContent = 'Category description is required.';
        isValid = false;
    } else if (descriptionInput.value.length < 5) {
        descriptionError.textContent = 'Description must be at least 5 characters long.';
        isValid = false;
    } else if (specialCharRegex.test(descriptionInput.value)) {
        descriptionError.textContent = 'Category description should not contain special characters.';
        isValid = false;
    }

    // Validate Image
    if (imageInput.files.length === 0) {
        imageError.textContent = 'Category image is required.';
        isValid = false;
    }

    return isValid; // Return whether the form is valid
}

// Add event listener for real-time validation
nameInput.addEventListener('input', validateFields);
descriptionInput.addEventListener('input', validateFields);
imageInput.addEventListener('change', validateFields); // Validate image on change

// Add event listener for form submission
form.addEventListener('submit', function (event) {
    if (!validateFields()) { // Validate fields on submit
        event.preventDefault(); // Prevent form submission if invalid
        // Optionally scroll to the first error
        const firstError = document.querySelector('.text-danger');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth' });
        }
    }
});

//  ===============================================================================

document.addEventListener("DOMContentLoaded", function () {
  const forms = document.querySelectorAll('[id^="editCategoryForm_"]'); // Select all edit category forms

  forms.forEach((form) => {
      const categoryId = form.id.split('_')[1]; // Extract category ID from the form ID

      const categoryNameInput = document.getElementById(`categoryName_${categoryId}`);
      const categoryDescriptionInput = document.getElementById(`categoryDescription_${categoryId}`);
      const categoryImageInput = document.getElementById(`categoryImage_${categoryId}`);
      const editCategoryForm = document.getElementById(form.id);

      // Regular expression to check for special characters
      const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;

      // Function to validate category name
      function validateCategoryName() {
          const errorMessageElement = document.getElementById(`categoryNameError_${categoryId}`);
          if (categoryNameInput.value.trim() === "") {
              errorMessageElement.textContent = "Category name is required.";
              return false;
          } else if (specialCharRegex.test(categoryNameInput.value)) {
              errorMessageElement.textContent = "Category name should not contain special characters.";
              return false;
          } else {
              errorMessageElement.textContent = "";
              return true;
          }
      }

      // Function to validate category description
      function validateCategoryDescription() {
          const errorMessageElement = document.getElementById(`categoryDescriptionError_${categoryId}`);
          if (categoryDescriptionInput.value.trim() === "") {
              errorMessageElement.textContent = "Category description is required.";
              return false;
          } else if (specialCharRegex.test(categoryDescriptionInput.value)) {
              errorMessageElement.textContent = "Category description should not contain special characters.";
              return false;
          } else {
              errorMessageElement.textContent = "";
              return true;
          }
      }

      // Function to validate category image
      function validateCategoryImage() {
          const errorMessageElement = document.getElementById(`categoryImageError_${categoryId}`);
          const file = categoryImageInput.files[0];

          // Optional validation (e.g., check file type)
          if (file && !file.type.startsWith("image/")) {
              errorMessageElement.textContent = "Please upload a valid image file.";
              return false;
          } else {
              errorMessageElement.textContent = "";
              return true;
          }
      }

      // Validate on input
      categoryNameInput.addEventListener("input", validateCategoryName);
      categoryDescriptionInput.addEventListener("input", validateCategoryDescription);
      categoryImageInput.addEventListener("change", validateCategoryImage);

      // Validate all fields before form submission
      editCategoryForm.addEventListener("submit", function (event) {
          const isNameValid = validateCategoryName();
          const isDescriptionValid = validateCategoryDescription();
          const isImageValid = validateCategoryImage();

          if (!isNameValid || !isDescriptionValid || !isImageValid) {
              event.preventDefault(); // Prevent form submission if validation fails
          }
      });
  });
});

  
//   ======================================================================================

document.addEventListener("DOMContentLoaded", function () {
  // Select all forms that have the ID starting with "editCategoryForm_"
  const forms = document.querySelectorAll('[id^="editCategoryForm_"]'); // Multiple form handling

  forms.forEach((form) => {
      const categoryId = form.id.split('_')[1]; // Extract category ID from the form ID

      const categoryNameInput = document.getElementById(`categoryName_${categoryId}`);
      const categoryDescriptionInput = document.getElementById(`categoryDescription_${categoryId}`);
      const categoryImageInput = document.getElementById(`categoryImage_${categoryId}`);
      const editCategoryForm = document.getElementById(form.id);

      // Regular expression for special characters
      const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/; // Adjust this regex as needed

      // Function to validate category name
      function validateCategoryName() {
          const errorMessageElement = document.getElementById(`categoryNameError_${categoryId}`);
          if (categoryNameInput.value.trim() === "") {
              errorMessageElement.textContent = "Category name is required.";
              return false;
          } else if (specialCharRegex.test(categoryNameInput.value)) {
              errorMessageElement.textContent = "Category name should not contain special characters.";
              return false;
          } else {
              errorMessageElement.textContent = "";
              return true;
          }
      }

      // Function to validate category description
      function validateCategoryDescription() {
          const errorMessageElement = document.getElementById(`categoryDescriptionError_${categoryId}`);
          if (categoryDescriptionInput.value.trim() === "") {
              errorMessageElement.textContent = "Category description is required.";
              return false;
          } else if (specialCharRegex.test(categoryDescriptionInput.value)) {
              errorMessageElement.textContent = "Category description should not contain special characters.";
              return false;
          } else {
              errorMessageElement.textContent = "";
              return true;
          }
      }

      // Function to validate category image
      function validateCategoryImage() {
          const errorMessageElement = document.getElementById(`categoryImageError_${categoryId}`);
          const file = categoryImageInput.files[0];

          // Optional validation (e.g., check file type)
          if (file && !file.type.startsWith("image/")) {
              errorMessageElement.textContent = "Please upload a valid image file.";
              return false;
          } else {
              errorMessageElement.textContent = "";
              return true;
          }
      }

      // Validate on input (Real-time validation as user types or selects)
      categoryNameInput.addEventListener("input", validateCategoryName);
      categoryDescriptionInput.addEventListener("input", validateCategoryDescription);
      categoryImageInput.addEventListener("change", validateCategoryImage);

      // Validate all fields before form submission
      editCategoryForm.addEventListener("submit", function (event) {
          const isNameValid = validateCategoryName();
          const isDescriptionValid = validateCategoryDescription();
          const isImageValid = validateCategoryImage();

          if (!isNameValid || !isDescriptionValid || !isImageValid) {
              event.preventDefault(); // Prevent form submission if validation fails
          }
      });
  });
});

//   =================================================================================


setTimeout(function () {
    var alertElement = document.getElementById('alertMessage');
    if (alertElement) {
      alertElement.style.display = 'none'; 
    }
  }, 3000);