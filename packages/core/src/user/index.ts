import { eq, and, getTableColumns, isNull } from "drizzle-orm";
import { db } from "../drizzle";
import { userFingerprintTable, userTable } from "./user.sql";
import { z } from "zod";
import { fn } from "../util/fn";
import { stripe } from "../stripe";
import { createID } from "../util/id";
import {
  createTransaction,
  afterTx,
  useTransaction,
} from "../drizzle/transaction";
import { useUserID } from "../actor";
import { defineEvent } from "../event";
import { bus } from "sst/aws/bus";
import { Resource } from "sst";

export module User {
  export const Info = z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
  });

  export const Events = {
    Created: defineEvent(
      "user.created",
      z.object({
        userID: Info.shape.id,
      })
    ),
    Updated: defineEvent(
      "user.updated",
      z.object({
        userID: Info.shape.id,
      })
    ),
  };

  export const create = fn(
    z.object({
      fingerprint: Info.shape.fingerprint.optional(),
      email: z.string().optional(),
      name: z.string().optional(),
    }),
    async (input) => {
      const id = createID("user");
      await createTransaction(async (tx) => {
        await tx.insert(userTable).values({
          id,
          email: input.email,
          name: input.name,
        });
        await afterTx(() =>
          bus.publish(Resource.Bus, Events.Created, { userID: id })
        );
      });
      return id;
    }
  );

  export const update = fn(
    Info.pick({ name: true, email: true, id: true }).partial({
      name: true,
      email: true,
    }),
    (input) =>
      useTransaction(async (tx) => {
        await afterTx(() =>
          bus.publish(Resource.Bus, Events.Updated, {
            userID: input.id,
          })
        );
        await tx
          .update(userTable)
          .set({
            name: input.name,
            email: input.email,
          })
          .where(eq(userTable.id, input.id));
      })
  );

  export const fromID = fn(Info.shape.id, async (id) =>
    useTransaction((tx) =>
      tx
        .select()
        .from(userTable)
        .where(eq(userTable.id, id))
        .then((rows) => rows.map(serialize).at(0))
    )
  );

  export const fromEmail = fn(z.string(), async (email) =>
    useTransaction(async (tx) =>
      tx
        .select()
        .from(userTable)
        .where(and(eq(userTable.email, email), isNull(userTable.timeDeleted)))
        .then((rows) => rows.map(serialize).at(0))
    )
  );

  function serialize(
    input: typeof userTable.$inferSelect
  ): z.infer<typeof Info> {
    return {
      id: input.id,
      name: input.name,
      email: input.email,
    };
  }
}
