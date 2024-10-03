const Assistent = require('./assistent'); // Importiere den Custom Client

Module.register("MMM-LLAMAAssistant", {
  defaults: {
    apiUrl: "http://192.168.178.41:11434/api/generate", // LLAMA3.2 API URL
    triggerKey: "", // Optional: Taste, um die Spracherkennung manuell zu starten (nicht notwendig für kontinuierliches Zuhören)
    logLevel: "debug", // Log-Level für detaillierte Informationen (info, debug, error),
    soundFile: "sounds/startup.mp3" // Pfad zur Audiodatei, die abgespielt werden soll
  },

  getScripts: function() {
    return [
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css"
    ];
  },

  start: function () {
    Log.info("Starting module: " + this.name);
    this.isListening = false;
    this.recognition = null;
    this.synth = window.speechSynthesis;
    this.assistantClient = new Assistent(this.config.apiUrl, "llama2"); // Assistent-Client instanziieren
    this.setupRecognition();
    this.startContinuousListening();
    this.playStartupSound(); // Sound abspielen, sobald der Assistent gestartet wurde
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
        this.startContinuousListening();
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.logToTerminal(`Recognized speech: ${transcript}`, "debug");
        this.sendQueryToLLAMA(transcript); // Sende den erkannten Text an die API
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

  // Verwende den Assistent-Client, um die Anfrage an LLAMA zu senden
  sendQueryToLLAMA: async function (text) {
    try {
      const response = await this.assistantClient.sendPrompt(text); // Verwende die Methode aus dem Assistent-Client
      this.logToTerminal(`LLAMA response: ${response}`, "info");
      this.speakResponse(response);
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

  // Sound abspielen beim Start
  playStartupSound: function () {
    const audio = new Audio(this.file(this.config.soundFile));
    audio.play()
      .then(() => {
        this.logToTerminal("Startup sound played", "info");
      })
      .catch((error) => {
        this.logToTerminal(`Error playing startup sound: ${error}`, "error");
      });
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
