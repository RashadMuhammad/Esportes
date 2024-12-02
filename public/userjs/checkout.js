async function fetchAndShowCoupons() {
    try {
        const response = await fetch('/availablecoupons');
        const coupons = await response.json();
        const couponBadge = document.getElementById('couponBadge');
        const couponContainer = document.getElementById('couponContainer');

        couponContainer.innerHTML = ""; 

        if (coupons.length === 0) {
            // No coupons available
            couponBadge.classList.remove('badge-success');
            couponBadge.classList.add('badge-danger');
            couponBadge.textContent = "NO COUPONS AVAILABLE";
            couponBadge.onclick = null; 

        } else {
            // Coupons available
            couponBadge.classList.remove('badge-danger');
            couponBadge.classList.add('badge-success');
            couponBadge.textContent = "AVAILABLE COUPONS";
            couponBadge.onclick = fetchAndShowCoupons; 

            coupons.forEach(coupon => {
                const card = document.createElement('div');
                card.className = 'card m-2';
                card.style.width = '18rem';

                card.innerHTML = `
                <div class="card-body">
                <h5 class="card-title">Code: ${coupon.code}</h5>
                <p class="card-text">Discount: ${coupon.discountType} - ${coupon.discountValue}</p>
                <p class="card-text">Valid From: ${new Date(coupon.validFrom).toLocaleDateString()}</p>
                <p class="card-text">Valid Until: ${new Date(coupon.validUntil).toLocaleDateString()}</p>
                <p class="card-text">${coupon.description}</p>
                </div>
                `;
                couponContainer.appendChild(card);
            });

            // Show the modal
            $('#couponModal').modal('show');
        }
    } catch (error) {
        console.error('Error fetching coupons:', error);
    }
}


// ===================================================================


let discountAmount = 0;
				let totalAfterCoupon = 0
				const couponCodeInput = document.getElementById('couponCode');



				document.addEventListener('DOMContentLoaded', function () {
					const applyCouponButton = document.getElementById('applyCoupon');
					const couponCodeInput = document.getElementById('couponCode');
					const totalAfterDiscount = document.getElementById('totalAfterDiscount');

					let appliedCouponCode = null;
					let subtotal = Number(totalAfterDiscount.textContent.slice(1));


					if (applyCouponButton) {
						applyCouponButton.addEventListener('click', async function (event) {
							event.preventDefault();

							const couponCode = couponCodeInput.value.trim();

							if (appliedCouponCode) {
								const removeResponse = await fetch('/remove-coupon', {
									method: 'POST',
									headers: {
										'Content-Type': 'application/json',
									},
									body: JSON.stringify({ couponCode: appliedCouponCode })
								});

								const removeData = await removeResponse.json();

								if (removeData.success) {
									Swal.fire({
										icon: 'success',
										title: 'Coupon Removed',
										text: 'The coupon has been removed successfully.',
										confirmButtonText: 'Okay'
									});

									// Reset the UI
									appliedCouponCode = null;
									couponCodeInput.value = '';
									couponCodeInput.readOnly = false;
									applyCouponButton.textContent = 'Apply Coupon';
									totalAfterDiscount.textContent = `₹${subtotal.toFixed(2)}`;
								} else {
									Swal.fire({
										icon: 'error',
										title: 'Error',
										text: removeData.message || 'An error occurred while removing the coupon.',
										confirmButtonText: 'Okay'
									});
								}
								return;
							}


							if (!couponCode) {
								Swal.fire({
									icon: 'error',
									title: 'Invalid Coupon',
									text: 'Please enter a valid coupon code.',
									confirmButtonText: 'Okay'
								});
								return;
							}

							const cartItemElements = document.querySelectorAll('.table_row');
							const cartItems = [...cartItemElements].map(item => {
								const quantityInput = item.querySelector('.quantity-input');
								const quantity = parseInt(quantityInput.value, 10) || 0;
								return {
									productId: item.dataset.productId,
									quantity: quantity
								};
							}).filter(item => item.quantity > 0);

							if (cartItems.length === 0) {
								Swal.fire({
									icon: 'error',
									title: 'Empty Cart',
									text: 'Please add items to your cart before applying a coupon.',
									confirmButtonText: 'Okay'
								});
								return;
							}

							let products = [];
							try {
								const productIds = cartItems.map(item => item.productId);
								const response = await fetch('/fetch-products', {
									method: 'POST',
									headers: {
										'Content-Type': 'application/json',
									},
									body: JSON.stringify({ productIds: productIds })
								});
								products = await response.json();
							} catch (error) {
								console.error('Error fetching product details:', error);
								Swal.fire({
									icon: 'error',
									title: 'Error',
									text: 'An error occurred while fetching product details.',
									confirmButtonText: 'Okay'
								});
								return;
							}

							try {
								const couponResponse = await fetch('/validate-coupon', {
									method: 'POST',
									headers: {
										'Content-Type': 'application/json',
									},
									body: JSON.stringify({ couponCode: couponCode })
								});
								const couponData = await couponResponse.json();

								if (!couponData.isValid) {
									let alertTitle = 'Invalid Coupon';
									let alertText = couponData.message || 'The coupon code is invalid or expired.';
									Swal.fire({
										icon: 'error',
										title: alertTitle,
										text: alertText,
										confirmButtonText: 'Okay'
									});
									return;
								}

								if (subtotal < couponData.minCartValue) {
									Swal.fire({
										icon: 'error',
										title: 'Minimum Cart Value Not Met',
										text: `Your cart needs a minimum value of ₹${couponData.minCartValue} to apply this coupon.`,
										confirmButtonText: 'Okay'
									});
									return;
								}

								


								if (couponData.discountType === 'percentage') {
									discountAmount = (subtotal * couponData.discountValue) / 100;
									if (couponData.maxDiscountValue && discountAmount > couponData.maxDiscountValue) {
										discountAmount = couponData.maxDiscountValue;
									}
								} else if (couponData.discountType === 'fixed') {
									discountAmount = couponData.discountValue;
								}

								


								totalAfterCoupon = subtotal - discountAmount;

								Swal.fire({
									icon: 'success',
									title: 'Coupon Applied',
									text: `Discount of ₹${discountAmount.toFixed(2)} applied! New total: ₹${totalAfterCoupon.toFixed(2)}`,
									confirmButtonText: 'Great'
								});


								totalAfterDiscount.textContent = `₹${totalAfterCoupon.toFixed(2)}`;
								appliedCouponCode = couponCode;
								couponCodeInput.readOnly = true;
								applyCouponButton.textContent = 'Remove Coupon';

							} catch (error) {
								console.error('Error validating coupon:', error);
								Swal.fire({
									icon: 'error',
									title: 'Error',
									text: 'An error occurred while applying the coupon.',
									confirmButtonText: 'Okay'
								});
							}
						});
					}
				});




				document.addEventListener('DOMContentLoaded', function () {
					const placeOrderButton = document.getElementById('proceedToPayment');

					if (placeOrderButton) {
						placeOrderButton.addEventListener('click', async function (event) {
							event.preventDefault();

							const cartItemElements = document.querySelectorAll('.table_row');
							const cartItems = [...cartItemElements].map(item => {
								const quantityInput = item.querySelector('.quantity-input');
								const quantity = parseInt(quantityInput.value, 10) || 0;
								return {
									productId: item.dataset.productId,
									quantity: quantity
								};
							}).filter(item => item.quantity > 0);

							const selectedAddress = {
								name: document.getElementById('name').value.trim(),
								housename: document.getElementById('housename').value.trim(),
								location: document.getElementById('location').value.trim(),
								city: document.getElementById('city').value.trim(),
								state: document.getElementById('state').value.trim(),
								zip: document.getElementById('zip').value.trim(),
								addressType: document.getElementById('addressType').value
							};

							const selectedPaymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
							const paymentMethodValue = selectedPaymentMethod ? selectedPaymentMethod.value : null;

							const isAddressValid = selectedAddress.name && selectedAddress.housename && selectedAddress.location && selectedAddress.city && selectedAddress.state && selectedAddress.zip.length === 6 && selectedAddress.addressType;

							if (!isAddressValid) {
								Swal.fire({
									icon: 'error',
									title: 'Oops...',
									text: 'Please fill in all the address fields!',
									confirmButtonText: 'Okay'
								});
								return;
							}

							let products = [];

							try {
								const productIds = cartItems.map(item => item.productId);
								const response = await fetch('/fetch-products', {
									method: 'POST',
									headers: {
										'Content-Type': 'application/json',
									},
									body: JSON.stringify({ productIds: productIds })
								});
								products = await response.json(); 
							} catch (error) {
								console.error('Error fetching product details:', error);
								return;
							}

							if (cartItems.length > 0) {
								

								if (paymentMethodValue === 'OnlinePayment' && isAddressValid) {

									const productIds = cartItems.map(item => item.productId);
									let products = [];

									try {
										const response = await fetch('/fetch-products', {
											method: 'POST',
											headers: {
												'Content-Type': 'application/json',
											},
											body: JSON.stringify({ productIds: productIds })
										});
										products = await response.json();
									} catch (error) {
										console.error('Error fetching product details:', error);
										return;
									}

									const total = cartItems.reduce((acc, item) => {
										const product = products.find(p => p._id.toString() === item.productId);
										return acc + (product ? product.price * item.quantity : 0);
									}, 0);

									const couponCode = couponCodeInput.value.trim();


									const subtotalText = document.getElementById('subtotal').textContent.trim();
									const subtotal = parseFloat(subtotalText.replace(/[^0-9.]/g, '')); console.log(`subtotal : ${subtotal}`)

									const totalAfterDiscount = Math.floor(parseFloat(document.getElementById('totalAfterDiscount').textContent.replace(/₹|,/g, '')));


									if (subtotal > 0 && totalAfterDiscount >= 0) {
										try {
											const orderDataToSend = {
												items: cartItems,
												paymentMethod: paymentMethodValue,
												address: selectedAddress,
												subtotal: subtotal,
												couponCode: couponCode,
												total: total,
												discountAmount,
												status: "Payment Failure"
											};



											const placeOrderResponse = await fetch('/place-order', {
												method: 'POST',
												headers: {
													'Content-Type': 'application/json',
												},
												body: JSON.stringify(orderDataToSend),
											});

											const orderPlacementData = await placeOrderResponse.json();

											if (orderPlacementData.orderId) {
												const orderId = orderPlacementData.orderId;

												const orderResponse = await fetch('/create-razorpay-order', {
													method: 'POST',
													headers: {
														'Content-Type': 'application/json',
													},
													body: JSON.stringify({
														amount: totalAfterDiscount * 100,
														currency: 'INR'
													}),
												});

												const orderData = await orderResponse.json();

											

												const razorpayOptions = {
													key: 'rzp_test_jQwdUt0mQkB6AR',
													amount: orderData.amount * 100,
													currency: 'INR',
													name: 'Esportes',
													description: 'Purchase Products',
													order_id: orderData.razorpayOrderId,
													handler: async function (response) {
														const updateOrderData = {
															razorpay_payment_id: response.razorpay_payment_id || null,
															status: response.razorpay_payment_id ? "Pending" : "Payment Failure"
														};

														const verifyResponse = await fetch(`/update-order/${orderId}`, {
															method: 'POST',
															headers: {
																'Content-Type': 'application/json',
															},
															body: JSON.stringify(updateOrderData),
														});

														const updateResponseData = await verifyResponse.json();

														window.location.href = `/order-confirmation/${orderId}`;
													},

													modal: {
														ondismiss: async function () {
															await fetch(`/update-order/${orderId}`, {
																method: 'POST',
																headers: {
																	'Content-Type': 'application/json',
																},
																body: JSON.stringify({ status: "Payment Failure" }),
															});

															window.location.href = `/order-confirmation/${orderId}`;
														}
													},

													prefill: {
														name: 'Esportes',
														email: 'ecommerceesportes@gmail.com',
														contact: '9656801830'
													},
													theme: {
														color: '#F37254'
													}
												};

												const razorpay = new Razorpay(razorpayOptions);
												razorpay.open();
											}
										} catch (error) {
											
										}

									}

								} else if (paymentMethodValue === 'CashOnDelivery' && isAddressValid) {
									const couponCode = couponCodeInput.value.trim();
									const subtotalText = document.getElementById('subtotal').textContent.trim();
									const subtotal = parseFloat(subtotalText.replace(/[^0-9.]/g, '')); console.log(`subtotal : ${subtotal}`)


									if (subtotal > 1000) {
										Swal.fire({
											icon: 'error',
											title: 'Order Limit Exceeded',
											text: 'Total amount after discount cannot exceed ₹1000 for Cash on Delivery.',
											confirmButtonText: 'Okay'
										});
										return;
									}

									try {
										const orderResponse = await fetch('/place-order', {
											method: 'POST',
											headers: {
												'Content-Type': 'application/json',
											},
											body: JSON.stringify({
												items: cartItems,
												paymentMethod: paymentMethodValue,
												address: selectedAddress,
												subtotal: subtotal,
												couponCode: couponCode,
												total: cartItems.reduce((acc, item) => {
													const product = products.find(p => p._id.toString() === item.productId);
													return acc + (product ? product.price * item.quantity : 0);
												}, 0),
												discountAmount,
												totalAfterDiscount: cartItems.reduce((acc, item) => {
													const product = products.find(p => p._id.toString() === item.productId);
													return acc + (product ? product.price * item.quantity : 0);
												}, 0),
												razorpay_payment_id: null,
												razorpay_order_id: null,
												razorpay_signature: null,
											}),
										});

										const orderPlacementData = await orderResponse.json();

										
										


										if (orderPlacementData.message === 'Order placed successfully') {
											window.location.href = `/order-confirmation/${orderPlacementData.orderId}`;
										} else {
											

										}
									} catch (error) {
										

									}
								}
								else if (paymentMethodValue === 'walletPayment' && isAddressValid) {


									const couponCode = couponCodeInput.value.trim();
									const subtotalText = document.getElementById('subtotal').textContent.trim();
									const subtotal = parseFloat(subtotalText.replace(/[^0-9.]/g, ''));

									try {
										const orderResponse = await fetch('/place-order', {
											method: 'POST',
											headers: {
												'Content-Type': 'application/json',
											},
											body: JSON.stringify({
												items: cartItems,
												paymentMethod: paymentMethodValue,
												address: selectedAddress,
												subtotal: subtotal,
												couponCode: couponCode,
												total: cartItems.reduce((acc, item) => {
													const product = products.find(p => p._id.toString() === item.productId);
													return acc + (product ? product.price * item.quantity : 0);
												}, 0),
												discountAmount,
												totalAfterDiscount: cartItems.reduce((acc, item) => {
													const product = products.find(p => p._id.toString() === item.productId);
													return acc + (product ? product.price * item.quantity : 0);
												}, 0),
											}),
										});

										const orderPlacementData = await orderResponse.json();
										

										if (orderPlacementData.message === 'Order placed successfully') {
											window.location.href = `/order-confirmation/${orderPlacementData.orderId}`;
										} else {
											Swal.fire({
												icon: 'error',
												title: 'Insufficient Wallet Balance',
												text: `${orderPlacementData.message}`,
												confirmButtonText: 'Okay'
											});

											// 
											return;
										}
									} catch (error) {
										
									}
								} else {
									Swal.fire({
										icon: 'error',
										title: 'Invalid Payment Method',
										text: 'Please select a valid payment method.',
										confirmButtonText: 'Okay'
									});
								}
							} else {
								Swal.fire({
									icon: 'error',
									title: 'Invalid Payment Method',
									text: 'Please select a valid payment method.',
									confirmButtonText: 'Okay'
								});
							}
						}
						)
					};
				});


// ================================================================================


document.addEventListener('DOMContentLoaded', function () {
    const nameInput = document.getElementById('name');
    const housenameInput = document.getElementById('housename');
    const locationInput = document.getElementById('location');
    const cityInput = document.getElementById('city');
    const stateInput = document.getElementById('state');
    const zipInput = document.getElementById('zip');
    const addressTypeInput = document.getElementById('addressType');


    const nameError = document.getElementById('nameError');
    const housenameError = document.getElementById('housenameError');
    const locationError = document.getElementById('locationError');
    const cityError = document.getElementById('cityError');
    const stateError = document.getElementById('stateError');
    const zipError = document.getElementById('zipError');
    const addressTypeError = document.getElementById('addressTypeError');

    function validateField(input, errorElement, minLength = 3) {
        const value = input.value.trim();
        if (value.length < minLength) {
            errorElement.textContent = `This field must have at least ${minLength} characters.`;
            input.classList.add('is-invalid');
        } else {
            errorElement.textContent = '';
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
        }
    }

    function validateZip(input, errorElement) {
        const value = input.value.trim();
        const zipPattern = /^\d{6,}$/;
        if (!zipPattern.test(value)) {
            errorElement.textContent = "ZIP Code must be digits only and at least 6 characters long.";
            input.classList.add('is-invalid');
        } else {
            errorElement.textContent = '';
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
        }
    }

    nameInput.addEventListener('input', () => validateField(nameInput, nameError));
    housenameInput.addEventListener('input', () => validateField(housenameInput, housenameError));
    locationInput.addEventListener('input', () => validateField(locationInput, locationError));
    cityInput.addEventListener('input', () => validateField(cityInput, cityError));
    stateInput.addEventListener('input', () => validateField(stateInput, stateError));
    zipInput.addEventListener('input', () => validateZip(zipInput, zipError));
    addressTypeInput.addEventListener('input', () => validateField(addressTypeInput, addressTypeError));
});


// ====================================================================================


function selectAddress(card) {
    const addressCard = card;

    const cardText = addressCard.querySelector('.card-text');

    if (cardText) {
        const details = cardText.innerHTML;

        const addressNameMatch = details.match(/<strong>Name:<\/strong>\s*([^<]+)<br>/);
        const addressHousenameMatch = details.match(/<strong>House Name:<\/strong>\s*([^<]+)<br>/);
        const addressLocationMatch = details.match(/<strong>Location:<\/strong>\s*([^<]+)<br>/);
        const addressCityMatch = details.match(/<strong>City:<\/strong>\s*([^<]+)<br>/);
        const addressStateMatch = details.match(/<strong>State:<\/strong>\s*([^<]+)<br>/);
        const addressZipMatch = details.match(/<strong>ZIP Code:<\/strong>\s*([^<]+)<br>/);
        const addressTypeMatch = details.match(/<strong>Address Type:<\/strong>\s*([^<]+)/);

        const addressName = addressNameMatch ? addressNameMatch[1].trim() : '';
        const addressHousename = addressHousenameMatch ? addressHousenameMatch[1].trim() : '';
        const addressLocation = addressLocationMatch ? addressLocationMatch[1].trim() : '';
        const addressCity = addressCityMatch ? addressCityMatch[1].trim() : '';
        const addressState = addressStateMatch ? addressStateMatch[1].trim() : '';
        const addressZip = addressZipMatch ? addressZipMatch[1].trim() : '';
        const addressType = addressTypeMatch ? addressTypeMatch[1].trim() : '';

        const countryElement = addressCard.querySelector('.card-text').nextElementSibling; // Adjusted
        const addressCountry = countryElement ? countryElement.innerText.trim() : ''; // Get country

        document.getElementById('name').value = addressName;
        document.getElementById('housename').value = addressHousename;
        document.getElementById('location').value = addressLocation;
        document.getElementById('city').value = addressCity;
        document.getElementById('state').value = addressState;
        document.getElementById('zip').value = addressZip;
        document.getElementById('addressType').value = addressType;

        const message = document.getElementById('addressSelectionMessage');
        if (message) {
            message.innerText = `Selected Location: ${addressLocation}`;
            message.classList.remove('text-warning');
            message.classList.add('text-success');
        }
    } else {
        console.error('Card text not found.');
    }
}


// ====================================================================================


document.addEventListener('DOMContentLoaded', () => {
    const proceedToPaymentBtn = document.getElementById('proceedToPayment');
    const form = document.getElementById('addressForm');

    // Validation function for each field
    const validateName = () => {
        const nameInput = document.getElementById('name').value.trim();
        if (nameInput === '') {
            return false;
        }
        return true;
    };

    const validateHousename = () => {
        const housenameInput = document.getElementById('housename').value.trim();
        if (housenameInput === '') {
            return false;
        }
        return true;
    };

    const validateLocation = () => {
        const locationInput = document.getElementById('location').value.trim();
        if (locationInput === '') {
            return false;
        }
        return true;
    };

    const validateCity = () => {
        const cityInput = document.getElementById('city').value.trim();
        if (cityInput === '') {
            return false;
        }
        return true;
    };

    const validateState = () => {
        const stateInput = document.getElementById('state').value.trim();
        if (stateInput === '') {
            return false;
        }
        return true;
    };

    const validateZip = () => {
        const zipInput = document.getElementById('zip').value.trim();
        const zipRegex = /^\d{6}$/;
        if (!zipRegex.test(zipInput)) {
            return false;
        }
        return true;
    };

    const validateAddressType = () => {
        const addressType = document.getElementById('addressType').value;
        if (addressType === '') {
            return false;
        }
        return true;
    };

    proceedToPaymentBtn.addEventListener('click', (e) => {
        e.preventDefault();

        if (!validateName()) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Please fill  the Name!',
            });
            return;
        }

        if (!validateHousename()) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Please fill  Housename!',
            });
            return;
        }

        if (!validateLocation()) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Please fill in the location!',
            });
            return;
        }

        if (!validateCity()) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Please fill in the city!',
            });
            return;
        }

        if (!validateState()) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Please fill in the state!',
            });
            return;
        }

        if (!validateZip()) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Please enter a valid 6-digit ZIP code!',
            });
            return;
        }

        if (!validateAddressType()) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Please select an address type!',
            });
            return;
        }

        form.submit();
    });
});


// ==================================================================================


