function removeFromWishlist(productId) {
                        

    fetch(`/wishlist/${productId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    })
        .then(response => response.json())
        .then(response => {
            const wishlistIcon = document.querySelector('.icon-header-cart[data-notify]');
            window.wishlistCount = response.wishlistCount
            wishlistIcon.setAttribute('data-notify', window.wishlistCount);


            if (response.message === "Product removed from wishlist") {
                Swal.fire({
                    icon: 'success',
                    title: 'Removed!',
                    text: 'Product has been removed from your wishlist.',
                }).then(() => {
                });

                const productElement = document.querySelector(`[data-product-id="${productId}"]`).closest('.isotope-item');
                productElement.remove();
            } else {
                // Handle error response
                Swal.fire({
                    icon: 'error',
                    title: 'Oops!',
                    text: 'Something went wrong. Please try again.',
                });
            }
        })
        .catch(error => {
            console.error('Error removing from wishlist:', error);
        });
}