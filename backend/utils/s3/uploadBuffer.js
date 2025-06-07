const { s3, BUCKET } = require("../../config/s3");
const { PutObjectCommand } = require("@aws-sdk/client-s3");

async function uploadBuffer(dagId, nodeId, imageBuffer) {
  const uploadParams = {
    Bucket: BUCKET,
    Key: `images/${Date.now()}-${dagId}-${nodeId}.png`,
    Body: imageBuffer,
    ContentType: "image/png",
  };

  try {
    await s3.send(new PutObjectCommand(uploadParams));
    console.log("Upload to S3 successful!");
  } catch (err) {
    console.error("Upload to S3 error:", err);
  }
}

module.exports = { uploadBuffer };
