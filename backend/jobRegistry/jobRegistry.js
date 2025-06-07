const { basicPrompt } = require("./promptAi");

const jobRegistry = {
  "prompt-step": async (input) => {
    const promptOutput = await basicPrompt(input.prompt);
    return { output: `AI Output: ${promptOutput}` };
  },
};

// Prompt AI for Summary of Wikipedia URL, Generate a PDF, Send the PDF to me
module.exports = jobRegistry;
