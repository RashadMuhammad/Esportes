document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search-product");
    const filterButtons = document.querySelectorAll(".filter-button");
    const sortLinks = document.querySelectorAll(".filter-link");
    const productsDataElement = document.getElementById("products-data");
    const productContainer = document.getElementById("product-container");

    let allProducts = JSON.parse(productsDataElement.getAttribute("data-products"));
    let displayedProducts = [...allProducts];
    let currentSort = "default";

    // Category filter event listener
    filterButtons.forEach(button => {
        button.addEventListener("click", function (e) {
            e.preventDefault();
            const categoryId = this.getAttribute("data-filter");
            const categoryName = this.getAttribute("data-name");

            // Remove underline from previously selected button
            filterButtons.forEach(btn => btn.classList.remove("underline-active"));
            // Add underline to the clicked button
            this.classList.add("underline-active");

            fetch(`/product/${categoryName}/${categoryId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            })
                .then(response => response.json())
                .then(data => {
                    allProducts = data.products;
                    applyFilters();
                })
                .catch(error => console.error("Error:", error));
        });
    });

    // Search input listener
    searchInput.addEventListener("input", function () {
        applyFilters();
    });

    // Sort link event listener
    sortLinks.forEach(link => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            currentSort = this.getAttribute("data-sort");
            applyFilters();
        });
    });

    // Apply filters based on search term, category, and sort
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        displayedProducts = allProducts.filter(product => {
            return product.name.toLowerCase().includes(searchTerm);
        });

        // Apply sorting
        displayedProducts = sortProducts(displayedProducts, currentSort);
        updateProductList(displayedProducts);
    }

    // Sort products based on the selected sorting option
    function sortProducts(products, sortOption) {
        switch (sortOption) {
            case "popularity":
                return products.sort((a, b) => b.popularity - a.popularity);
            case "priceLowToHigh":
                return products.sort((a, b) => a.price - b.price);
            case "priceHighToLow":
                return products.sort((a, b) => b.price - a.price);
            case "averageRating":
                return products.sort((a, b) => b.rating - a.rating);
            case "newness":
                return products.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
            case "aToZ":
                return products.sort((a, b) => a.name.localeCompare(b.name));
            case "zToA":
                return products.sort((a, b) => b.name.localeCompare(a.name));
            default:
                return products;
        }
    }

    function updateProductList(products) {
        productContainer.innerHTML = "";

        products.forEach(product => {
            const productElement = `
            <div class="col-sm-6 col-md-4 col-lg-3 p-b-35 isotope-item category-${product.category._id}">
                <div class="block2">
                    <div class="block2-pic hov-img0 ${product.stock <= 0 ? 'out-of-stock-shade' : ''}">
                        <img src="/uploads/${product.images && product.images.length > 0 ? product.images[0] : 'path/to/default-image.jpg'}" alt="IMG-PRODUCT">
                        <a href="/product-detail/${product._id}" class="block2-btn flex-c-m stext-103 cl2 size-102 bg0 bor2 hov-btn1 p-lr-15 trans-04" data-id="${product._id}">
                            View Details
                        </a>
                    </div>
                    <div class="block2-txt flex-w flex-t p-t-14">
                        ${product.stock <= 0 ? '<span class="stext-105 cl3 out-of-stock">Out of Stock</span>' : ''}
                        <div class="block2-txt-child1 flex-col-l">
                            <a href="/product-detail/${product._id}" class="stext-104 cl4 hov-cl1 trans-04 js-name-b2 p-b-6 card-title">${product.name}</a>
                            <span class="stext-105 cl3">
                                ₹ ${product.discountedPrice || product.price}
                                ${product.discountedPrice && product.discountedPrice !== product.price ? `<span class="original-price" style="text-decoration: line-through; color: red;">₹ ${product.price}</span>` : ''}
                            </span>
                            <button class="align-items-center wishlist-btn flex-c-m stext-103 cl2 py-2 bg0 bor2 trans-04" data-product-id="${product._id}" onclick="addToWishlist('${product._id}')">
                                <i class="fa fa-heart" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            `;
            productContainer.insertAdjacentHTML("beforeend", productElement);
        });
    }

    updateProductList(allProducts);
});



async function addToWishlist(productId) {
    try {
        const response = await fetch('/wishlist/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productId })
        });

        if (response.ok) {
            const result = await response.json();
            const wishlistIcon = document.querySelector('.icon-header-cart[data-notify]');
            window.wishlistCount = result.wishlistCount;
            wishlistIcon.setAttribute('data-notify', window.wishlistCount);

            if (result.success) {
                // SweetAlert for success
                Swal.fire({
                    icon: 'success',
                    title: 'Added to Wishlist!',
                    text: 'The product has been added to your wishlist.',
                });
            } else {
                // SweetAlert for error
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: result.message || 'Something went wrong!',
                });
            }
        } else {
            // SweetAlert for request failure
            Swal.fire({
                icon: 'error',
                title: 'Failed to add',
                text: 'Product is already exists in wishlist.',
            });
        }
    } catch (error) {
        console.error('Error:', error);
        // SweetAlert for catching unexpected errors
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'An error occurred while adding the product to the wishlist.',
        });
    }
}
