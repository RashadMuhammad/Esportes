document.querySelectorAll('.delete-button').forEach(button => {
    button.addEventListener('click', function (event) {
        event.preventDefault(); 

        const form = this.closest('.delete-form'); 

        Swal.fire({
            title: 'Are you sure?',
            text: 'This item will be removed from your cart.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Remove it!'
        }).then((result) => {
            if (result.isConfirmed) {
                form.submit(); 
            }
        });
    });
});


document.addEventListener('DOMContentLoaded', function () {
    var quantityInputs = document.querySelectorAll('.quantity-input');
    var plusButtons = document.querySelectorAll('.plus-btn');
    var minusButtons = document.querySelectorAll('.minus-btn');
    var totalPriceElements = document.querySelectorAll('.totalPrice');
    var subtotalElement = document.getElementById('subtotal');
    var discountElement = document.getElementById('discountAmount');
    var totalElement = document.getElementById('totalAfterDiscount');

    function updateCart(productId, quantity) {
        return fetch('/update-cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId, quantity })
        })
            .then(response => response.json())
            .catch(error => console.error('Error updating cart:', error));
    }

    function updateTotalCartPrices() {
        let subtotal = 0;
        totalPriceElements.forEach(function (totalPriceElement, index) {
            let price = parseFloat(totalPriceElement.closest('tr').querySelector('input[name="productPrice"]').value);
            let quantity = parseInt(quantityInputs[index].value);
            let total = price * quantity;
            totalPriceElement.textContent = total.toFixed(2);
            subtotal += total;
        });

        let discount = subtotal * 0.03;
        let totalAfterDiscount = subtotal + discount;

        subtotalElement.textContent = `₹${subtotal.toFixed(2)}`;
        discountElement.textContent = `₹${discount.toFixed(2)}`;
        totalElement.textContent = `₹${totalAfterDiscount.toFixed(2)}`;
    }

    quantityInputs.forEach(function (inputField, index) {
        var plusButton = plusButtons[index];
        var minusButton = minusButtons[index];
        var productId = inputField.closest('form').querySelector('input[name="productId"]').value;
        var stock = parseInt(inputField.closest('form').querySelector('input[name="productStock"]').value);  

        inputField.setAttribute('readonly', true);

        function updateButtons(quantity) {
            if (quantity >= 5 || quantity >= stock) {
                plusButton.classList.add('disabled');
                plusButton.style.pointerEvents = 'none';
            } else {
                plusButton.classList.remove('disabled');
                plusButton.style.pointerEvents = 'auto';
            }

            if (quantity <= 1) {
                minusButton.classList.add('disabled');
                minusButton.style.pointerEvents = 'none';
            } else {
                minusButton.classList.remove('disabled');
                minusButton.style.pointerEvents = 'auto';
            }
        }

        plusButton.addEventListener('click', function () {
            var currentValue = parseInt(inputField.value, 10);
            if (currentValue < stock) {
                inputField.value = currentValue;
                updateCart(productId, inputField.value).then(() => {
                    updateTotalCartPrices();
                });
            }
            updateButtons(inputField.value);
        });

        minusButton.addEventListener('click', function () {
            var currentValue = parseInt(inputField.value, 10);
            if (currentValue >= 1) {
                inputField.value = currentValue;
                updateCart(productId, inputField.value).then(() => {
                    updateTotalCartPrices();
                });
            }
            updateButtons(inputField.value);
        });

        var initialQuantity = parseInt(inputField.value, 10);
        updateButtons(initialQuantity);
    });

    updateTotalCartPrices();
});