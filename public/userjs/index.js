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
                Swal.fire({
                    icon: 'success',
                    title: 'Added to Wishlist!',
                    text: 'The product has been added to your wishlist.'
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: result.message || 'Something went wrong!',
                });
            }
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Failed to add',
                text: 'Product is already exists in wishlist.',
            });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'An error occurred while adding the product to the wishlist.',
        });
    }
}m