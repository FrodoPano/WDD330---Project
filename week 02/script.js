// Get references to the elements
const countdownDisplay = document.getElementById('countdown');
const startButton = document.getElementById('startButton');

// Set the starting time
let timeLeft = 10;
let countdownInterval;

// Function to update the countdown display
function updateCountdown() {
    countdownDisplay.textContent = timeLeft;
    timeLeft--;

    if (timeLeft < 0) {
        clearInterval(countdownInterval);
        countdownDisplay.textContent = "Time's up!";
        startButton.disabled = false;
    }
}

// Add event listener to the button
startButton.addEventListener('click', function() {
    // Reset the time if needed
    timeLeft = 10;
    countdownDisplay.textContent = timeLeft;

    // Disable the button during countdown
    startButton.disabled = true;

    // Start the countdown
    countdownInterval = setInterval(updateCountdown, 1000);
});