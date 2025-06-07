require("dotenv").config();

const appConfig = {
  PORT: process.env.PORT || 3001,
  REDIS_URL: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/minilambda",
};
module.exports = appConfig;
