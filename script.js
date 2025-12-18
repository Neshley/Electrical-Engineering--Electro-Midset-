let numButtonClicks = 0;
function buttonClicked() {
    numButtonClicks = numButtonClicks + 1;
    document.getElementById("mainDiv").textContent =
        "Button Clicked times: " + numButtonClicks;
}

function calculateOhm() {
    const v = document.getElementById('voltage').value;
    const i = document.getElementById('current').value;
    const resultDisplay = document.getElementById('result');


    if (v > 0 && i > 0) {
        const r = v / i;
        resultDisplay.innerHTML = `Result: <strong>${r.toFixed(2)} Ω (Ohms)</strong>`;
        resultDisplay.style.color = "#2ecc71"; // Green for success
    } else {
        resultDisplay.innerHTML = "Please enter valid Voltage and Current!";
        resultDisplay.style.color = "#e74c3c"; // Red for error
    }
}
