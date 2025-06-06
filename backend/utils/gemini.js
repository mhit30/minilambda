const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents:
      "Summarize this article: https://en.wikipedia.org/wiki/Lee_Jae-myung",
  });
  console.log(response.text);
}

module.exports = { main };
