const { Worker } = require("bullmq");
const IORedis = require("ioredis");
require("dotenv").config();

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

const jobHandlers = {
  "fetch-url": async (input) => {
    const res = await fetch(input.url);
    const data = await res.json();
    return data;
  },
  "prompt-ai": async (input) => {
    // Simple fake summarizer for now — later plug in OpenAI or Hugging Face
    // get the previous output
    const promptText = await resolveTemplate(input.prompt, input.dagId);
    return { output: `AI Summary of: ${promptText}` };
  },
};

async function resolveTemplate(templateStr, dagId) {
  // Match all expressions like {{stepId.output.key}}
  const regex = /\{\{(.+?)\}\}/g;

  // return in {{...}} and "..." format (elem 0 and 1 respectively)
  const matches = [...templateStr.matchAll(regex)];
  // if no matches, return as is
  if (!matches.length) return templateStr;

  // Resolve all replacements
  const resolvedPieces = await Promise.all(
    matches.map(async (match) => {
      const expr = match[1].trim(); // match[1] is "step1.output.text" match[0] is {{step1.output.text}}
      const [stepId, , field] = expr.split(".");
      // find where we saved our prev output!
      const raw = await connection.get(`dag:${dagId}:node:${stepId}:output`);
      // get that prev output and turn it into json object
      const parsed = JSON.parse(raw || "{}");
      // grab that json object's field value, i.e, .text, etc
      return parsed[field] || "";
    })
  );

  // after we have recieved all of those field values,
  // Build final string by replacing matches, the {{...}} with those values

  // E.g. matches = [[{{}}, ""], [{{}}, ""]] thus replace each {{...}} in tempStr with "..." in resolvedPieces,
  // indices already match as we output in order
  let result = templateStr;
  matches.forEach((match, index) => {
    result = result.replace(match[0], resolvedPieces[index]);
  });

  return result;
}

const worker = new Worker(
  "dagQueue",
  async (job) => {
    const { dagId, nodeId, input, type } = job.data;

    const handler = jobHandlers[type];
    if (!handler) throw new Error(`Unknown job type: ${type}`);

    // put dagId in input object for ease of access in later job handlers
    input.dagId = dagId;
    const output = await handler(input);

    console.log(`Node ${nodeId} for dag ${dagId} completed`);

    return output;
  },
  { connection }
);

// listen to worker
worker.on("active", (job) => {
  console.log(`Job ${job.id} started`);
});

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed.`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed: ${err}`);
});

worker.on("error", (err) => {
  console.error("Worker error: CHANGE TO SHOW");
});
