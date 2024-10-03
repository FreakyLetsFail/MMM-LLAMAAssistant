const fetch = require('node-fetch');

class Assistent {
  constructor(apiUrl, model) {
    this.apiUrl = apiUrl;
    this.model = model; // Das LLAMA-Modell, das du verwenden möchtest (z.B. "llama2")
    this.conversationHistory = []; // Halte den Verlauf der Konversation fest
  }

  // Methode zum Senden der Eingabe an die Ollama API und Abrufen der Antwort
  async sendPrompt(prompt) {
    // Füge das neue Prompt zum Konversationsverlauf hinzu
    this.conversationHistory.push({
      role: 'user',
      content: prompt
    });

    const requestBody = {
      model: this.model,
      messages: this.conversationHistory // Übergebe den gesamten Konversationsverlauf
    };

    try {
      const response = await fetch(`${this.apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Prüfen, ob die Antwort erfolgreich ist
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();

      // Überprüfen, ob die API eine Antwort zurückgibt
      if (data && data.completion) {
        // Füge die Antwort der KI zum Konversationsverlauf hinzu
        this.conversationHistory.push({
          role: 'assistant',
          content: data.completion
        });

        return data.completion; // Die Antwort des LLAMA-Modells
      } else {
        throw new Error('No completion returned from the API.');
      }
    } catch (error) {
      console.error(`Error in sendPrompt: ${error.message}`);
      throw error; // Fehler weitergeben, damit er in der Hauptanwendung geloggt wird
    }
  }

  // Methode zum Zurücksetzen des Konversationsverlaufs
  resetConversation() {
    this.conversationHistory = [];
  }
}

module.exports = Assistent;
