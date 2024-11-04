const urlParams = new URLSearchParams(window.location.search);
const message = urlParams.get('message');

if (message) {
    const errorMessageElement = document.getElementById('errormessage');
    errorMessageElement.textContent = message;
    errorMessageElement.classList.remove('d-none'); 
}

const otpInputs = document.querySelectorAll('.otp-input');
let countdown = sessionStorage.getItem('otpCountdown') || 60;
const timerElement = document.getElementById('timer');

const handleInputMovement = (input, index) => {
    if (input.value.length === 1 && !isNaN(input.value)) {
        if (index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }
    }
};

const otpForm = document.getElementById('otpForm');

otpForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get OTP value
    const enteredOtp = Array.from(otpInputs).map(input => input.value).join('');

    fetch('/forgetverify-otp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            otp1: otpInputs[0].value,
            otp2: otpInputs[1].value,
            otp3: otpInputs[2].value,
            otp4: otpInputs[3].value,
            otp5: otpInputs[4].value,
            otp6: otpInputs[5].value
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                sessionStorage.removeItem('otpCountdown');
                
                window.location.href = '/newpasswordPage';
            } else {
                document.getElementById('errormessage').textContent = data.message;
                document.getElementById('errormessage').classList.remove('d-none');
            }
        })
        .catch(error => {
            console.error('Error during OTP verification:', error);
        });
});

otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
        handleInputMovement(input, index);
        if (isNaN(e.target.value) || e.target.value.length > 1) {
            e.target.value = ''; 
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && index > 0 && input.value === '') {
            otpInputs[index - 1].focus();
        }
    });
});

// Set initial timer display
timerElement.textContent = `Time remaining: 00:${String(countdown).padStart(2, '0')}`;

// Countdown logic
const interval = setInterval(() => {
    countdown--;
    timerElement.textContent = `Time remaining: 00:${String(countdown).padStart(2, '0')}`;
    sessionStorage.setItem('otpCountdown', countdown);

    if (countdown <= 0) {
        clearInterval(interval);
        sessionStorage.removeItem('otpCountdown');
        timerElement.textContent = `Time remaining: 00:00`;
        document.getElementById('resendMessage').style.display = 'block'; 
        document.getElementById('resendOtpButton').style.display = 'block'; 
    }
}, 1000);

// Clear countdown if it has already expired
if (countdown <= 0) {
    sessionStorage.removeItem('otpCountdown');
    timerElement.textContent = `Time remaining: 00:00`; 
    document.getElementById('resendMessage').style.display = 'block'; 
}