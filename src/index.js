import { createRequire } from "module";
import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import myResolvers from "./resolvers/resolvers.js";
const mySchema = importAsString("./schema/schema.graphql");
const require = createRequire(import.meta.url);
const pkg = require("../package.json");
import orderValueStartup from "./orderValueStartup.js";

async function register(app) {
  await app.registerPlugin({
    label: pkg.label,
    name: pkg.name,
    version: pkg.version,
    collections: {
      RiderOrder: {
        name: "RiderOrder",
        updatedAt: { type: Date, default: Date.now },
        createdAt: { type: Date, default: Date.now },
      },
      CronJobs: {
        name: "CronJobs",
        updatedAt: { type: Date, default: Date.now },
        createdAt: { type: Date, default: Date.now },
      },
      RiderOrderHistory: {
        name: "RiderOrderHistory",
        updatedAt: { type: Date, default: Date.now },
        createdAt: { type: Date, default: Date.now },
      },
      transferOrder: {
        name: "transferOrder",
        updatedAt: { type: Date, default: Date.now },
        createdAt: { type: Date, default: Date.now },
      },
    },
    graphQL: {
      schemas: [mySchema],
      resolvers: myResolvers,
    },
    functionsByType: {
      startup: [orderValueStartup],
    },
  });
}
export default register;
