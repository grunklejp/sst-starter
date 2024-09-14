import { database } from "./database";
import { bus } from "./bus";
import { email } from "./email";

const auth = new sst.aws.Auth("Auth", {
  authenticator: {
    url: true,
    link: [bus, database, email],
    permissions: [
      {
        actions: ["ses:SendEmail"],
        resources: ["*"],
      },
    ],
    handler: "./packages/functions/src/auth.handler",
  },
});

const api = new sst.aws.Function("OpenApi", {
  handler: "./packages/functions/src/api/index.handler",
  streaming: !$dev,
  link: [bus, auth, database],
  url: true,
});

export const outputs = {
  auth: auth.url,
  openapi: api.url,
};
