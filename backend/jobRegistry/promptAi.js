const ai = require("../config/gemini");

async function basicPrompt(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: "Only give the needed information: " + prompt,
    config: { temperature: 0 },
  });
  return response.text;
}

module.exports = { basicPrompt };
