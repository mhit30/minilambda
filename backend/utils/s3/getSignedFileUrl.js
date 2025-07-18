const { s3, BUCKET } = require("../../config/s3");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

async function getSignedFileUrl(fileName) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: fileName });
  return await getSignedUrl(s3, command, { expiresIn: 3600 });
}

module.exports = getSignedFileUrl;
