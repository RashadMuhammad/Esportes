//To Delete an Address

let addressIdToDelete;

function setDeleteAddressId(addressId) {
  addressIdToDelete = addressId;
}

document
  .getElementById("confirmDeleteButton")
  .addEventListener("click", async () => {
    console.log(addressIdToDelete);

    if (addressIdToDelete) {
      try {
        const response = await fetch(`/addresses/delete/${addressIdToDelete}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          location.reload();
        } else {
          const data = await response.json();
          alert(data.message || "Failed to delete the address");
        }
      } catch (error) {
        console.error("Error deleting address:", error);
        alert("An error occurred while deleting the address");
      }
    }
  });

// ==============================================================================================


function confirmDelete(addressId) {
  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`/addresses/delete/${addressId}`, {
        method: "DELETE",
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.message === "Address deleted successfully") {
            Swal.fire(
              "Deleted!",
              "The address has been deleted.",
              "success"
            ).then(() => {
              window.location.reload();
            });
          } else {
            Swal.fire("Error", data.message, "error");
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          Swal.fire("Error", "Something went wrong!", "error");
        });
    }
  });
}

// ========================================================================================================

//Add new address

const addAddressForm = document.getElementById("addAddressForm");
const newName = document.getElementById("newName");
const newHousename = document.getElementById("newHousename");
const newLocation = document.getElementById("newLocation");
const newCity = document.getElementById("newCity");
const newState = document.getElementById("newState");
const newZip = document.getElementById("newZip");
const newAddressType = document.getElementById("newAddressType");
const customNameFieldAdd = document.getElementById("customNameFieldAdd");
const newCustomName = document.getElementById("newCustomName");

function validateField(field) {
  const value = field.value.trim();
  const isValid =
    value.length >= 3 && !/\s/.test(value) && /^[A-Za-z0-9]*$/.test(value); // At least 3 characters, no spaces or special characters

  if (!isValid) {
    field.classList.add("is-invalid");
  } else {
    field.classList.remove("is-invalid");
  }
}

newName.addEventListener("input", () => validateField(newName));
newHousename.addEventListener("input", () => validateField(newHousename));
newLocation.addEventListener("input", () => validateField(newLocation));
newCity.addEventListener("input", () => validateField(newCity));
newState.addEventListener("input", () => validateField(newState));
newZip.addEventListener("input", () => {
  if (newZip.value.match(/^\d{6}$/)) {
    newZip.classList.remove("is-invalid");
  } else {
    newZip.classList.add("is-invalid");
  }
});

newAddressType.addEventListener("change", () => {
  if (newAddressType.value === "custom") {
    customNameFieldAdd.style.display = "block";
    newCustomName.setAttribute("required", "required");
  } else {
    customNameFieldAdd.style.display = "none";
    newCustomName.removeAttribute("required");
    newCustomName.classList.remove("is-invalid");
  }
});

newCustomName.addEventListener("input", () => validateField(newCustomName));

addAddressForm.addEventListener("submit", (event) => {
  let isValid = true;

  [newName, newHousename, newLocation, newCity, newState, newZip].forEach(
    (field) => {
      validateField(field);
      if (field.classList.contains("is-invalid")) {
        isValid = false;
      }
    }
  );

  if (newAddressType.value === "custom") {
    validateField(newCustomName);
    if (newCustomName.classList.contains("is-invalid")) {
      isValid = false;
    }
  }

  if (!isValid) {
    event.preventDefault();
  }
});

// ============================================================================================

//To populate existing data
function populateModal(addressData) {
  const address = JSON.parse(addressData);

  document.getElementById("editAddressId").value = address._id;
  document.getElementById("editName").value = address.name;
  document.getElementById("editHousename").value = address.housename;
  document.getElementById("editLocation").value = address.location;
  document.getElementById("editCity").value = address.city;
  document.getElementById("editState").value = address.state;
  document.getElementById("editZip").value = address.zip;
  document.getElementById("editLandmark").value = address.landmark || "";
  document.getElementById("editAddressType").value = address.addressType;
  document.getElementById("editCustomName").value = address.customName || "";

  const customNameField = document.getElementById("customNameField");
  if (address.addressType === "custom") {
    customNameField.style.display = "block";
  } else {
    customNameField.style.display = "none";
  }
}

document
  .getElementById("editAddressType")
  .addEventListener("change", function () {
    const customNameField = document.getElementById("customNameField");
    if (this.value === "custom") {
      customNameField.style.display = "block";
    } else {
      customNameField.style.display = "none";
    }
  });

// =========================================================================================================

document
  .getElementById("newAddressType")
  .addEventListener("change", function () {
    const customNameFieldAdd = document.getElementById("customNameFieldAdd");
    if (this.value === "custom") {
      customNameFieldAdd.style.display = "block";
    } else {
      customNameFieldAdd.style.display = "none";
    }
  });

// =========================================================================================================


//To validate Editaddress modal
const editAddressForm = document.getElementById("editAddressForm");
const editName = document.getElementById("editName");
const editHousename = document.getElementById("editHousename");
const editLocation = document.getElementById("editLocation");
const editCity = document.getElementById("editCity");
const editState = document.getElementById("editState");
const editZip = document.getElementById("editZip");
const editAddressType = document.getElementById("editAddressType");
const customNameFieldEdit = document.getElementById("customNameField");
const editCustomName = document.getElementById("editCustomName");

function validateField(field) {
  const value = field.value.trim();
  const isValid = value.length >= 3 && /^[A-Za-z0-9\s]*$/.test(value); // At least 3 characters, no special characters

  if (!isValid) {
    field.classList.add("is-invalid");
  } else {
    field.classList.remove("is-invalid");
  }
}

editName.addEventListener("input", () => validateField(editName));
editHousename.addEventListener("input", () => validateField(editHousename));
editLocation.addEventListener("input", () => validateField(editLocation));
editCity.addEventListener("input", () => validateField(editCity));
editState.addEventListener("input", () => validateField(editState));
editZip.addEventListener("input", () => {
  const isValid = editZip.value.match(/^\d{6}$/);
  if (isValid) {
    editZip.classList.remove("is-invalid");
  } else {
    editZip.classList.add("is-invalid");
  }
});

editAddressType.addEventListener("change", () => {
  if (editAddressType.value === "custom") {
    customNameFieldEdit.style.display = "block";
    editCustomName.setAttribute("required", "required");
  } else {
    customNameFieldEdit.style.display = "none";
    editCustomName.removeAttribute("required");
    editCustomName.classList.remove("is-invalid");
  }
});

editCustomName.addEventListener("input", () => validateField(editCustomName));

editAddressForm.addEventListener("submit", (event) => {
  let isValid = true;

  [editName, editHousename, editLocation, editCity, editState, editZip].forEach(
    (field) => {
      validateField(field);
      if (field.classList.contains("is-invalid")) {
        isValid = false;
      }
    }
  );

  if (editAddressType.value === "custom") {
    validateField(editCustomName);
    if (editCustomName.classList.contains("is-invalid")) {
      isValid = false;
    }
  }

  if (!isValid) {
    event.preventDefault();
  }
});


// ========================================================================================================


