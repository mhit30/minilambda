const ai = require("../config/gemini");

async function basicPrompt(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });
  return response.text;
}

module.exports = { basicPrompt };
