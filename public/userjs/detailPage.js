const addToCartForm = document.getElementById('addToCartForm');
const productId = document.getElementById('productId').value;  
const productStock = document.getElementById('productStock').value; 

addToCartForm.addEventListener('submit', async function (event) {
    event.preventDefault(); 

    if (productStock <= 0) {
        Swal.fire({
            icon: 'error',
            title: 'Out of Stock',
            text: 'This product is currently unavailable.',
        });
    } else {
        await fetch('/add-to-cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId: productId })  
        })
            .then(response => response.json())
            .then(data => {
                
                const cartIcon = document.querySelector('.icon-header-item[data-notify]');
                window.cartProductCount = data.cartProductCount; 
                cartIcon.setAttribute('data-notify', window.cartProductCount);
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Added to Cart',
                        text: 'The product has been successfully added to your cart.',
                    });
                } else if (data.limitedStock) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Limited Stock',
                        text: 'Only a limited number of this product can be added to your cart.',
                    });
                }
            })
            .catch(error => {
                

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'There was a problem adding the product to the cart.',
                });
            });
    }
});


function showOutOfStockAlert() {
    Swal.fire({
        icon: 'warning',
        title: 'Out of Stock',
        text: 'Sorry, this product is currently out of stock!',
        confirmButtonText: 'OK'
    });
}