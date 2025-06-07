const ai = require("../config/gemini");
const { Modality } = require("@google/genai");

async function generateImage(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-preview-image-generation",
    contents: prompt,
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });
  let buffer;
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const imageData = part.inlineData.data;
      buffer = Buffer.from(imageData, "base64");
    }
  }
  return buffer;
}

module.exports = { generateImage };
