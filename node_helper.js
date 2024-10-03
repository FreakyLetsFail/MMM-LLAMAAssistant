const NodeHelper = require("node_helper");
const Ollama = require("ollama");

module.exports = NodeHelper.create({
  start: function () {
    console.log("[\x1b[35mMMM-LLAMAAssistant\x1b[0m]] helper started...");
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "LLAMA_QUERY") {
      this.handleLLAMAQuery(payload.prompt);
    }
  },

  handleLLAMAQuery: async function (prompt) {
    try {
      const ollamaClient = new Ollama.Client();
      const query = {
        model: "llama2",
        prompt: prompt,
      };

      const response = await ollamaClient.generate(query);
      console.log("LLAMA response:", response.text || response);

      // Sende die Antwort zurück an das Frontend
      this.sendSocketNotification("LLAMA_RESPONSE", response.text || response);
    } catch (error) {
      console.error("Error communicating with LLAMA API:", error);
    }
  }
});
