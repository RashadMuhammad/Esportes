$(".js-select2").each(function () {
  $(this).select2({
    minimumResultsForSearch: 20,
    dropdownParent: $(this).next(".dropDownSelect2"),
  });
});

// ====================================================

$(".js-pscroll").each(function () {
  $(this).css("position", "relative");
  $(this).css("overflow", "hidden");
  var ps = new PerfectScrollbar(this, {
    wheelSpeed: 1,
    scrollingThreshold: 1000,
    wheelPropagation: false,
  });

  $(window).on("resize", function () {
    ps.update();
  });
});

$(document).on("click", ".js-show-modal1", function (e) {
  e.preventDefault();

  const productId = $(this).data("id");

  $.ajax({
    url: `/product/${productId}`,
    method: "GET",
    success: function (product) {
      // Populate the modal with product details
      $("#productId").text(product._id);
      $("#productName").text(product.name);
      $("#productDescription").text(product.description);
      $("#productPrice").text(`₹ ${product.price}`);
      $("#mainImage").attr("src", `/uploads/${product.images[0]}`);

      // Handle sizes (if you have size options in your product schema)
      const sizeSelect = $("#sizeSelect");
      sizeSelect.empty();
      // Add sizes dynamically if sizes are stored in the product model
      // Example: product.sizes.forEach(size => sizeSelect.append(new Option(size, size)));

      // Show the modal
      $("#quickViewModal").modal("show");
    },
    error: function () {
      alert("Error fetching product details.");
    },
  });
});

// =========================================================

const zoomedView = document.getElementById("zoomedView");

document.querySelectorAll(".zoom-img").forEach((image) => {
  image.addEventListener("mousemove", (e) => {
    const imgRect = image.getBoundingClientRect();
    const offsetX = e.clientX - imgRect.left; // Mouse X position relative to the image
    const offsetY = e.clientY - imgRect.top; // Mouse Y position relative to the image

    const zoomLevel = 2; // Zoom level (e.g., 2 for 200%, 3 for 300%)

    // Calculate the percentage of the mouse position relative to the image
    const bgPosX = (offsetX / imgRect.width) * 100;
    const bgPosY = (offsetY / imgRect.height) * 100;

    // Show the zoomed view and set its background image and zoomed size
    zoomedView.style.display = "block";
    zoomedView.style.backgroundImage = `url(${image.getAttribute(
      "data-image"
    )})`;
    zoomedView.style.backgroundSize = `${imgRect.width * zoomLevel}px ${
      imgRect.height * zoomLevel
    }px`; // 200% size

    // Adjust background position to focus on the exact mouse point
    const zoomedBgPosX = (offsetX / imgRect.width) * 100 * zoomLevel + 300;
    const zoomedBgPosY = (offsetY / imgRect.height) * 100 * zoomLevel + 300;

    zoomedView.style.backgroundPosition = `${zoomedBgPosX}% ${zoomedBgPosY}%`;

    // Position the zoomed view near the mouse pointer
    zoomedView.style.left = `${e.pageX - 300}px`; // Offset to the right of the mouse pointer
    zoomedView.style.top = `${e.pageY - 300}px`; // Slightly above/below the pointer
  });

  image.addEventListener("mouseleave", () => {
    zoomedView.style.display = "none"; // Hide zoomed view when mouse leaves the image
  });
});

// ===========================================================

$(".js-addwish-b2, .js-addwish-detail").on("click", function (e) {
  e.preventDefault();
});

$(".js-addwish-b2").each(function () {
  var nameProduct = $(this).parent().parent().find(".js-name-b2").html();
  $(this).on("click", function () {
    swal(nameProduct, "is added to wishlist !", "success");

    $(this).addClass("js-addedwish-b2");
    $(this).off("click");
  });
});

$(".js-addwish-detail").each(function () {
  var nameProduct = $(this)
    .parent()
    .parent()
    .parent()
    .find(".js-name-detail")
    .html();

  $(this).on("click", function () {
    swal(nameProduct, "is added to wishlist !", "success");

    $(this).addClass("js-addedwish-detail");
    $(this).off("click");
  });
});

/*---------------------------------------------*/

$(".js-addcart-detail").each(function () {
  var nameProduct = $(this)
    .parent()
    .parent()
    .parent()
    .parent()
    .find(".js-name-detail")
    .html();
  $(this).on("click", function () {
    swal(nameProduct, "is added to cart !", "success");
  });
});

// =================================================================

function setSize(size) {
  document.getElementById('sizeDropdown').textContent = size;  
  document.getElementById('sizeSelect').value = size;  
}

// ===================================================================

$('.gallery-lb').each(function () { 
  $(this).magnificPopup({
    delegate: 'a', 
    type: 'image',
    gallery: {
      enabled: true
    },
    mainClass: 'mfp-fade'
  });
});

