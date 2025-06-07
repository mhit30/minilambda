const resolveTemplate = require("../utils/resolveTemplate");
const { basicPrompt } = require("./promptAi");
const { generateImage } = require("./generateImage");
const { uploadBuffer } = require("../utils/s3/uploadBuffer");

const jobRegistry = {
  "prompt-step": async (dagId, nodeId, input, deps) => {
    let output;
    if (deps.length === 0) {
      output = await basicPrompt(input.prompt);
    } else {
      resolver = await resolveTemplate(dagId, input.prompt);
      output = await basicPrompt(resolver);
    }
    return output;
  },
  "generate-image": async (dagId, nodeId, input, deps) => {
    let outputBuffer;
    if (deps.length === 0) {
      outputBuffer = await generateImage(input.prompt);
    } else {
      output = await resolveTemplate(dagId, input.prompt);
      outputBuffer = await generateImage(output);
    }
    await uploadBuffer(dagId, nodeId, outputBuffer);
  },
};

module.exports = jobRegistry;
