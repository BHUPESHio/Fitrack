document.addEventListener('DOMContentLoaded', () => {
  // -------------------- Auth & Modal --------------------
  const authModal = document.getElementById('auth-modal');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const authButton = document.querySelector('.auth-button');
  const profileMenu = document.querySelector('.profile-menu');
  const profileIcon = document.querySelector('.profile-icon');
  const profileDropdown = document.querySelector('.profile-dropdown');
  const logoutLink = document.getElementById('logout-link');
  const closeModalBtn = document.querySelector('.close-modal');
  const goSignup = document.getElementById('go-signup');
  const goLogin = document.getElementById('go-login');
  const modalTitle = document.getElementById('modal-title');

  function switchAuthTab(tab) {
    if (tab === 'login') {
      loginForm.classList.remove('hidden');
      signupForm.classList.add('hidden');
      modalTitle.textContent = "Login";
    } else {
      loginForm.classList.add('hidden');
      signupForm.classList.remove('hidden');
      modalTitle.textContent = "Sign Up";
    }
  }

  if (authButton && authModal) {
    authButton.addEventListener('click', () => {
      authModal.classList.remove('hidden');
      switchAuthTab('login');
    });
  }

  closeModalBtn?.addEventListener('click', () => authModal.classList.add('hidden'));
  goSignup?.addEventListener('click', () => switchAuthTab('signup'));
  goLogin?.addEventListener('click', () => switchAuthTab('login'));

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.querySelector('input[type="email"]').value;
    const password = loginForm.querySelector('input[type="password"]').value;

    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const result = await res.json();
    if (result.success) {
      alert("Logged in successfully!");
      authModal.classList.add('hidden');
      authButton?.classList.add('hidden');
      profileMenu?.classList.remove('hidden');
    } else {
      alert(result.message || "Login failed");
      if (result.message?.toLowerCase().includes("verify your email")) {
        document.getElementById("resend-verification-msg")?.classList.remove("hidden");
      }
    }
  });

  signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputs = signupForm.querySelectorAll('input');
    const name = inputs[0].value;
    const email = inputs[1].value;
    const password = inputs[2].value;

    const res = await fetch('/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const result = await res.json();
    if (result.success) {
      alert("OTP sent to your email. Please verify.");
      document.getElementById('signup-email').value = email;
      document.getElementById('otp-section').style.display = 'block';
    } else {
      alert(result.message || "Signup failed");
    }
  });

  profileIcon?.addEventListener('click', () => {
    profileDropdown?.classList.toggle('hidden');
  });

  logoutLink?.addEventListener('click', async () => {
    const res = await fetch('/logout');
    const result = await res.json();
    if (result.success) {
      alert("Logged out!");
      window.location.href = '/';
    }
  });

  // -------------------- BMI --------------------
  const bmiForm = document.getElementById('bmi-form');
  if (bmiForm) {
    const ageInput = document.getElementById('age');
    const genderGroup = document.querySelector('.child-only');
    const resultDiv = document.getElementById('bmi-result');
    const unitRadios = document.getElementsByName('units');
    const weightInput = document.getElementById('weight');
    const heightInput = document.getElementById('height');
    const bmiChartCanvas = document.getElementById('bmiChart');
    let bmiChart;

    const resetForm = () => {
      resultDiv.classList.add('hidden');
      resultDiv.textContent = '';
      weightInput.value = '';
      heightInput.value = '';
      ageInput.value = '';
      genderGroup.classList.add('hidden');
      if (bmiChart) bmiChart.destroy();
    };

    const updatePlaceholders = () => {
      const units = document.querySelector('input[name="units"]:checked').value;
      weightInput.placeholder = units === 'metric' ? 'Weight in kg' : 'Weight in lbs';
      heightInput.placeholder = units === 'metric' ? 'Height in cm' : 'Height in inches';
    };

    unitRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        resetForm();
        updatePlaceholders();
      });
    });

    updatePlaceholders();

    ageInput.addEventListener('input', () => {
      const age = parseInt(ageInput.value);
      genderGroup.classList.toggle('hidden', age >= 19 || age < 2);
    });

    bmiForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const age = parseInt(ageInput.value);
      const weight = parseFloat(weightInput.value);
      const height = parseFloat(heightInput.value);
      const units = document.querySelector('input[name="units"]:checked').value;

      if (!weight || !height || !age || age < 2) return;

      const response = await fetch('/api/calculate_bmi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age, weight, height, units })
      });

      const result = await response.json();
      resultDiv.classList.remove('hidden');
      if (bmiChart) bmiChart.destroy();

      if (result.type === 'child') {
        resultDiv.textContent = `Your BMI: ${result.bmi} | Percentile: ${result.percentile} | Category: ${result.category}`;
        renderChart(childBmiJson, 'Child BMI Percentiles');
      } else {
        resultDiv.textContent = `Your BMI: ${result.bmi} | Category: ${result.category}`;
        renderChart(adultBmiJson, 'Adult BMI Ranges');
      }
    });

    function renderChart(chartData, title) {
      bmiChart = new Chart(bmiChartCanvas, {
        type: 'bar',
        data: {
          labels: chartData.labels,
          datasets: [{
            label: title,
            data: chartData.values,
            backgroundColor: ['#42a5f5', '#66bb6a', '#ffa726', '#ef5350']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.label} → Up to ${ctx.raw}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'BMI Value' }
            }
          }
        }
      });
    }

    window.adultBmiJson = {
      labels: ["Underweight", "Normal", "Overweight", "Obese"],
      values: [18.4, 24.9, 29.9, 40],
    };

    window.childBmiJson = {
      labels: ["< 5th", "5th–85th", "85th–95th", "> 95th"],
      values: [14, 18, 20, 23],
    };
  }

  // -------------------- Calorie --------------------
  const calorieForm = document.getElementById('calorie-form');
  if (calorieForm) {
    calorieForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const age = document.getElementById('cal-age').value;
      const gender = document.getElementById('cal-gender').value;
      const weight = document.getElementById('cal-weight').value;
      const height = document.getElementById('cal-height').value;
      const activity = document.getElementById('cal-activity').value;
      const units = document.querySelector('input[name="cal-units"]:checked').value;

      const res = await fetch('/api/calculate_calories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age, gender, weight, height, activity_level: activity, units })
      });

      const data = await res.json();
      const resultDiv = document.getElementById('calorie-result');
      resultDiv.classList.remove('hidden');
      resultDiv.textContent = data.success
        ? `Recommended Daily Calories: ${data.daily_calories} kcal`
        : `Error: ${data.error}`;
    });
  }

  // -------------------- Prediction Chart --------------------
  const predictForm = document.getElementById('predict-form');
  const predictResult = document.getElementById('predict-result');
  const predictionChartCanvas = document.getElementById('predictionChart');
  let predictChart;

  if (predictForm && predictResult && predictionChartCanvas) {
    predictForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const age = parseInt(document.getElementById('age').value);
      const bmi = parseFloat(document.getElementById('bmi').value);

      const res = await fetch('/api/predict_bmi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age, bmi })
      });

      const data = await res.json();
      if (data.success) {
        predictResult.innerHTML = `
          <p><strong>Predicted BMI (6 months later):</strong> ${data.predicted_bmi}</p>
          <p><strong>Suggestion:</strong> ${data.suggestions}</p>
        `;
        predictResult.classList.remove("hidden");

        if (predictChart) predictChart.destroy();
        predictChart = new Chart(predictionChartCanvas, {
          type: 'bar',
          data: {
            labels: data.prediction_timeline.map(p => p.date),
            datasets: [{
              label: 'BMI Prediction',
              data: data.prediction_timeline.map(p => p.bmi),
              borderColor: '#9c27b0',
              backgroundColor: '#9c27b0',
              tension: 0.3
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: { beginAtZero: true },
              x: { title: { display: true, text: 'Month' } }
            }
          }
        });
      } else {
        predictResult.innerHTML = `<p style="color:red;">${data.error || 'Prediction failed'}</p>`;
        predictResult.classList.remove("hidden");
      }
    });
  }
});

// ✅ Global OTP verify
function verifyOtp() {
  const email = document.getElementById('signup-email').value;
  const otp = document.getElementById('otp-input').value;
  const otpMessage = document.getElementById('otp-message');

  fetch('/verify_otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        otpMessage.textContent = "✅ Account verified successfully!";
        otpMessage.style.color = "green";
        document.getElementById('otp-section').style.display = 'none';
        alert("You can now log in!");
        switchToLogin();
      } else {
        otpMessage.textContent = data.message || "Invalid OTP.";
        otpMessage.style.color = "red";
      }
    })
    .catch(err => {
      console.error(err);
      otpMessage.textContent = "Something went wrong.";
      otpMessage.style.color = "red";
    });
}

function switchToLogin() {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const modalTitle = document.getElementById('modal-title');

  loginForm.classList.remove('hidden');
  signupForm.classList.add('hidden');
  modalTitle.textContent = "Login";
}

function resendOtp() {
  const email = document.getElementById('signup-email').value;
  if (!email) return alert("Please enter your email first.");

  fetch('/resend_otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || "OTP resent");
      document.getElementById('otp-message').textContent = data.message || "OTP resent";
      document.getElementById('otp-message').style.color = data.success ? "green" : "red";
    })
    .catch(() => {
      alert("Something went wrong.");
    });
}
