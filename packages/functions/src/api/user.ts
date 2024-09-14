import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { Result } from "./common";
import { User } from "@[[APP_NAME}}/core/user/index";
import { useUserID } from "@[[APP_NAME}}/core/actor";

export module UserApi {
  export const UserSchema = z.object(User.Info.shape).openapi("User");

  export const route = new OpenAPIHono()
    .openapi(
      createRoute({
        method: "get",
        path: "/me",
        responses: {
          404: {
            content: {
              "application/json": {
                schema: z.object({ error: z.string() }),
              },
            },
            description: "User not found",
          },
          200: {
            content: {
              "application/json": {
                schema: Result(UserSchema),
              },
            },
            description: "Returns user",
          },
        },
      }),
      async (c) => {
        const result = await User.fromID(useUserID());
        if (!result) {
          return c.json({ error: "User not found" }, 404);
        }
        return c.json({ result }, 200);
      }
    )
    .openapi(
      createRoute({
        method: "put",
        path: "/me",
        request: {
          body: {
            content: {
              "application/json": {
                schema: User.update.schema,
              },
            },
          },
        },
        responses: {
          404: {
            content: {
              "application/json": {
                schema: z.object({ error: z.string() }),
              },
            },
            description: "User not found",
          },
          200: {
            content: {
              "application/json": {
                schema: Result(UserSchema),
              },
            },
            description: "Returns user",
          },
        },
      }),
      async (c) => {
        await User.update(c.req.valid("json"));
        const user = await User.fromID(useUserID());
        if (!user) return c.json({ error: "User not found" }, 404);
        return c.json({ result: user }, 200);
      }
    );
}
