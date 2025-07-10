document.getElementById("chat-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const msgInput = document.getElementById("message");
  const msg = msgInput.value.trim();
  const image = document.getElementById("image").files[0];
  const chatBox = document.getElementById("chat-box");

  if (!msg) return;

  // Show user message
  chatBox.innerHTML += `<div class="user-msg">${msg}</div>`;
  scrollChatToBottom();

  // Show loading animation
  const loadingId = `load-${Date.now()}`;
  chatBox.innerHTML += `<div id="${loadingId}" class="bot-msg loading">🤖 Typing...</div>`;
  scrollChatToBottom();

  let formData = new FormData();
  formData.append("message", msg);
  if (image) formData.append("image", image);

  try {
    const res = await fetch("/api/chatbot", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    const botMsg = `<div class="bot-msg">${data.response}</div>`;
    if (data.pdf_url) {
      const link = `<a href="${data.pdf_url}" target="_blank">📄 Download PDF</a>`;
      chatBox.innerHTML += botMsg + link;
    } else {
      chatBox.innerHTML += botMsg;
    }
    chatBox.innerHTML += `<div class="bot-msg">${data.response}</div>`;
    speakText(data.response); // 👈 Speak response
  } catch (error) {
    chatBox.innerHTML += `<div class="bot-msg error">❌ Error connecting to chatbot.</div>`;
  } finally {
    // Remove loading animation
    const loadingElem = document.getElementById(loadingId);
    if (loadingElem) loadingElem.remove();
    msgInput.value = "";
    scrollChatToBottom();
  }
});

// 🔁 Smooth scroll function
function scrollChatToBottom() {
  const chatBox = document.getElementById("chat-box");
  chatBox.scrollTop = chatBox.scrollHeight;
}

// 🎤 Audio Input via SpeechRecognition API
const micBtn = document.getElementById("mic-btn");
if (micBtn) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    micBtn.addEventListener("click", () => {
      recognition.start();
      micBtn.innerText = "🎙️ Listening...";
    });

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      document.getElementById("message").value = transcript;
      micBtn.innerText = "🎤";
    };

    recognition.onerror = () => {
      micBtn.innerText = "🎤";
    };

    recognition.onend = () => {
      micBtn.innerText = "🎤";
    };
  } else {
    micBtn.style.display = "none"; // Hide if unsupported
  }
}
function speakText(text) {
  if ('speechSynthesis' in window) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    window.speechSynthesis.speak(utter);
  }
}
