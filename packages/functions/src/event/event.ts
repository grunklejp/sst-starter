import { bus } from "sst/aws/bus";
import { User } from "@[[APP_NAME}}/core/user/index";

export const handler = bus.subscriber([User.Events.Updated], async (event) => {
  console.log(event.type, event.properties, event.metadata);
  switch (event.type) {
    case "user.updated": {
      console.log("User updated event received");
      // await Stripe.syncUser(event.properties.userID);
      break;
    }
  }
});
