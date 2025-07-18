const { GoogleGenAI } = require("@google/genai");
require("dotenv").config({ path: "../.env" });

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

module.exports = ai;
