let selectedOrderId = null;

function showCancelModal(orderId) {
  selectedOrderId = orderId;
  $("#cancelOrderModal").modal("show");
}

document
  .getElementById("confirmCancelBtn")
  .addEventListener("click", async function () {
    if (selectedOrderId) {
      try {
        const response = await fetch(`/admin/orders/${selectedOrderId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (response.ok) {
          window.location.reload();
        } else {
          alert("Error canceling order: " + result.error);
        }

        $("#cancelOrderModal").modal("hide");
      } catch (error) {
        alert("Error canceling order: " + error.message);
      }
    }
  });

document.addEventListener("DOMContentLoaded", function () {
  const selectElements = document.querySelectorAll(".order-status-select");

  const setTextColor = (select) => {
    const status = select.value;
    switch (status) {
      case "Pending":
        select.style.color = "orange";
        break;
      case "Completed":
        select.style.color = "green";
        break;
      case "Shipped":
        select.style.color = "blue";
        break;
      case "Canceled":
        select.style.color = "red";
        break;
      case "Returned":
        select.style.color = "blue";
        break;
      case "Return completed":
        select.style.color = "red";
        break;
      default:
        select.style.color = "";
    }
  };

  selectElements.forEach((select) => {
    setTextColor(select); 

    select.addEventListener("change", () => setTextColor(select));
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const selectElements = document.querySelectorAll(".order-status-select");

  selectElements.forEach((select) => {
    select.addEventListener("change", async function () {
      const orderId = this.getAttribute("data-order-id");
      const newStatus = this.value;
      try {
        const response = await fetch(`/admin/orders/status`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId, status: newStatus }),
        });

        const result = await response.json();
      } catch (error) {
        // alert('Error updating order status: ' + error.message);
      }
    });
  });
});
