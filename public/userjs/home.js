$(".js-select2").each(function () {
  $(this).select2({
    minimumResultsForSearch: 20,
    dropdownParent: $(this).next(".dropDownSelect2"),
  });
});

// ==============================================================================

$(".parallax100").parallax100();

// ==============================================================================

$(".gallery-lb").each(function () {
  // the containers for all your galleries
  $(this).magnificPopup({
    delegate: "a", // the selector for gallery item
    type: "image",
    gallery: {
      enabled: true,
    },
    mainClass: "mfp-fade",
  });
});

// =================================================================================

window.onload = function () {
  // Prevent back navigation by manipulating history
  history.pushState(null, null, location.href);
  window.onpopstate = function () {
    history.go(1); // When back button is pressed, go forward instead
  };
};

// =================================================================================

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

// document.getElementById("sizeSelect").addEventListener("change", function () {
//   let selectedSize = this.value; // Get the selected size
//    // Use this value accordingly
// });

// =================================================================================

$(".js-addwish-b2").on("click", function (e) {
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

// =========================================================================================

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
