import "dotenv/config";
import Service from "./lib/service.js";
import config from "./config.js";

const service = new Service(config);

service.start().catch((error) => {
  console.error("Failed to start service:", error);
  process.exit(1);
});
