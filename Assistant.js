const fetch = require('node-fetch');

class Assistent {
  constructor(apiUrl = "http://localhost:11434/api/generate", model = "llama3.2") {
    this.apiUrl = apiUrl;
    this.model = model;
  }

  // Methode zum Senden eines Prompts an die API
  async sendPrompt(prompt) {
    const body = {
      model: this.model, // Llama-Modell, das verwendet wird
      prompt: prompt // Text, der an das Modell geschickt wird
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const result = await response.json();
      return result.text || "No response from AI";
      
    } catch (error) {
      console.error("Error with LLAMA API request:", error);
      throw error;
    }
  }
}

module.exports = Assistent;
