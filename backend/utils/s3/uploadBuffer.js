const { s3, BUCKET } = require("../../config/s3");
const { Upload } = require("@aws-sdk/lib-storage");

async function uploadBuffer(dagId, nodeId, imageBuffer) {
  const key = `images/${Date.now()}-${dagId}-${nodeId}.png`;
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: BUCKET,
      Key: key,
      Body: imageBuffer,
      ContentType: "image/png",
    },
  });

  try {
    await upload.done();
    console.log("Upload to S3 successful!");
    return key;
  } catch (err) {
    console.error("Upload to S3 error:", err);
  }
}

module.exports = { uploadBuffer };
