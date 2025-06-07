const { S3Client } = require("@aws-sdk/client-s3");
require("dotenv").config({ path: "../.env" });

BUCKET = process.env.AWS_S3_BUCKET_NAME;
const s3 = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_SECRET_KEY,
  },
});

module.exports = { s3, BUCKET };
