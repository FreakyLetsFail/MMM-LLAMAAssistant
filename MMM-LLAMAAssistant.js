const Ollama = require('ollama'); // Importiere das Ollama-Paket

Module.register("MMM-LLAMAAssistant", {
  defaults: {
    apiUrl: "http://192.168.178.41:11434", // LLAMA3.2 API URL
    triggerKey: "Shift", // Optional: Taste, um die Spracherkennung manuell zu starten (nicht notwendig für kontinuierliches Zuhören)
    logLevel: "debug", // Log-Level für detaillierte Informationen (info, debug, error)
  },

  start: function () {
    Log.info("Starting module: " + this.name);
    this.isListening = false;
    this.recognition = null;
    this.synth = window.speechSynthesis;
    this.setupRecognition();
    this.ollamaClient = new Ollama.Client(); // Erstellt einen Ollama API-Client
    this.startContinuousListening();
  },

  getDom: function () {
    const wrapper = document.createElement("div");
    wrapper.className = "LLAMAAssistant";

    const micIcon = document.createElement("span");
    micIcon.className = "mic-icon fas fa-microphone";

    wrapper.appendChild(micIcon);

    return wrapper;
  },

  setupRecognition: function () {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.lang = "de-DE"; // Sprache auf Deutsch setzen
      this.recognition.continuous = true; // Kontinuierliches Zuhören

      this.recognition.onstart = () => {
        this.logToTerminal("Recognition started", "info");
        this.isListening = true;
        this.updateMicIcon();
      };

      this.recognition.onend = () => {
        this.logToTerminal("Recognition ended. Restarting...", "debug");
        this.isListening = false;
        this.updateMicIcon();
        // Restart the recognition automatically to keep listening
        this.startContinuousListening();
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.logToTerminal(`Recognized speech: ${transcript}`, "debug");
        this.sendQueryToLLAMA(transcript);
      };

    } catch (e) {
      this.logToTerminal("Speech Recognition not supported", "error");
    }
  },

  startContinuousListening: function () {
    if (this.recognition && !this.isListening) {
      this.recognition.start();
      this.logToTerminal("Continuous listening started", "info");
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

  sendQueryToLLAMA: async function (text) {
    const query = {
      model: "llama2", // Das Modell, das auf der API verwendet wird
      prompt: text,
    };

    try {
      const response = await this.ollamaClient.generate(query); // Verwende Ollama API zur Abfrage
      this.logToTerminal(`LLAMA response: ${response.text || response}`, "info");
      this.speakResponse(response.text || response);
    } catch (error) {
      this.logToTerminal(`Error communicating with LLAMA API: ${error}`, "error");
    }
  },

  speakResponse: function (text) {
    if (this.synth) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "de-DE"; // Sprache auf Deutsch setzen
      this.synth.speak(utterance);
      this.logToTerminal(`Speaking response: ${text}`, "info");
    } else {
      this.logToTerminal("Speech Synthesis not supported", "error");
    }
  },

  // Helper-Funktion: Übergibt Infos ans Terminal und liest Parameter ein
  logToTerminal: function (message, level = "info") {
    switch (level) {
      case "debug":
        if (this.config.logLevel === "debug") {
          console.log(`[DEBUG] ${message}`);
        }
        break;
      case "error":
        console.error(`[ERROR] ${message}`);
        break;
      default:
        console.log(`[INFO] ${message}`);
    }
  }
});
