const resolveTemplate = require("../utils/resolveTemplate");
const { basicPrompt } = require("./promptAi");
const { generateImage } = require("./generateImage");
const { uploadBuffer } = require("../utils/s3/uploadBuffer");
const getSignedFileUrl = require("../utils/s3/getSignedFileUrl");

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
    let outputText;
    if (deps.length === 0) {
      ({ buffer: outputBuffer, text: outputText } = await generateImage(
        input.prompt
      ));
    } else {
      output = await resolveTemplate(dagId, input.prompt);
      ({ buffer: outputBuffer, text: outputText } = await generateImage(
        output
      ));
    }
    const key = await uploadBuffer(dagId, nodeId, outputBuffer);
    const signedUrl = await getSignedFileUrl(key);
    return { signedUrl: signedUrl, text: outputText };
  },
};

module.exports = jobRegistry;
