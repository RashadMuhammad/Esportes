document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.pay-again-btn').forEach(button => {
        button.addEventListener('click', async function () {
            const orderId = this.getAttribute('data-id');
            

            payAgain(orderId);
        });
    });
});


async function payAgain(orderId) {
    try {
        const response = await fetch(`/get-order/${orderId}`);
        const order = await response.json();

        if (!order || !order.paymentTotal) {
            console.error('Order details could not be retrieved.');
            return;
        }

        
        

        const razorpayOptions = {
            key: 'rzp_test_jQwdUt0mQkB6AR', 
            amount: order.paymentTotal * 100, 
            currency: 'INR',
            name: 'Esportes',
            description: 'Purchase Products',
            order_id: order.razorpayOrderId, 

            handler: async function (response) {
                const updateOrderData = {
                    razorpay_payment_id: response.razorpay_payment_id || null,
                    status: response.razorpay_payment_id ? "Pending" : "Payment Failure"
                };

                await fetch(`/update-order/${orderId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updateOrderData),
                });

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

    } catch (error) {
        console.error('Error initializing Razorpay:', error);
    }
}



