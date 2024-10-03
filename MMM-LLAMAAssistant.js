/* MMM-LLAMAAssistant.js */

Module.register("MMM-LLAMAAssistant", {
    defaults: {
      apiUrl: "http://192.168.178.41:11434", // LLAMA3.2 API URL
      triggerKey: "Shift", // Taste, um die Spracherkennung zu starten (optional)
    },
  
    start: function () {
      Log.info("Starting module: " + this.name);
      this.isListening = false;
      this.recognition = null;
      this.synth = window.speechSynthesis;
      this.setupRecognition();
    },
  
    getDom: function () {
      const wrapper = document.createElement("div");
      wrapper.className = "LLAMAAssistant";
  
      const micIcon = document.createElement("span");
      micIcon.className = "mic-icon fas fa-microphone";
  
      wrapper.appendChild(micIcon);
  
      // Klick-Event zum Starten der Spracherkennung
      wrapper.addEventListener("click", () => {
        this.toggleListening();
      });
  
      return wrapper;
    },
  
    setupRecognition: function () {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.lang = "de-DE"; // Sprache auf Deutsch setzen
  
        this.recognition.onstart = () => {
          this.isListening = true;
          this.updateMicIcon();
        };
  
        this.recognition.onend = () => {
          this.isListening = false;
          this.updateMicIcon();
        };
  
        this.recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          console.log("Recognized speech:", transcript);
          this.sendQueryToLLAMA(transcript);
        };
  
        // Optional: Tastendruck zum Starten der Spracherkennung
        if (this.config.triggerKey) {
          window.addEventListener("keydown", (e) => {
            if (e.key === this.config.triggerKey) {
              this.startListening();
            }
          });
        }
      } catch (e) {
        console.error("Speech Recognition not supported", e);
      }
    },
  
    startListening: function () {
      if (this.recognition && !this.isListening) {
        this.recognition.start();
      }
    },
  
    stopListening: function () {
      if (this.recognition && this.isListening) {
        this.recognition.stop();
      }
    },
  
    toggleListening: function () {
      if (this.isListening) {
        this.stopListening();
      } else {
        this.startListening();
      }
    },
  
    updateMicIcon: function () {
      const micIcon = document.querySelector(".LLAMAAssistant .mic-icon");
      if (this.isListening) {
        micIcon.classList.add("listening");
      } else {
        micIcon.classList.remove("listening");
      }
    },
  
    sendQueryToLLAMA: function (text) {
      const payload = {
        prompt: text,
      };
  
      fetch(this.config.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("LLAMA response:", data);
          this.speakResponse(data.response || data);
        })
        .catch((error) => {
          console.error("Error communicating with LLAMA API:", error);
        });
    },
  
    speakResponse: function (text) {
      if (this.synth) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "de-DE"; // Sprache auf Deutsch setzen
        this.synth.speak(utterance);
      } else {
        console.error("Speech Synthesis not supported");
      }
    },
  });
  