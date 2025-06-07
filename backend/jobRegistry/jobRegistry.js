const resolveTemplate = require("../utils/resolveTemplate");
const { basicPrompt } = require("./promptAi");

const jobRegistry = {
  "prompt-step": async (dagId, input, deps) => {
    let output;
    if (deps.length === 0) {
      output = await basicPrompt(input.prompt);
    } else {
      resolver = await resolveTemplate(dagId, input.prompt);
      output = await basicPrompt(resolver);
    }
    return output;
  },
};

// Prompt AI for Summary of Wikipedia URL, Generate a PDF, Send the PDF to me
module.exports = jobRegistry;
