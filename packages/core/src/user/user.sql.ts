import { json, mysqlTable, primaryKey, varchar } from "drizzle-orm/mysql-core";
import { id, ulid, timestamps } from "../drizzle/types";
import { z } from "zod";

export const UserFlags = z.object({
  // Set custom authorization flags here
});
export type UserFlags = z.infer<typeof UserFlags>;

export const userTable = mysqlTable("user", {
  ...id,
  ...timestamps,
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  flags: json("flags").$type<UserFlags>().default({}),
});
