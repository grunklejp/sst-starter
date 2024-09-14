import { auth } from "sst/aws/auth";
import { CodeAdapter } from "sst/auth/adapter/code";
// import { Adapter } from "sst/auth/adapter";
import { session } from "./session";
import { User } from "@[[APP_NAME]]/core/user/index";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { Resource } from "sst";

const ses = new SESv2Client({});

export const handler = auth.authorizer({
  providers: {
    email: CodeAdapter({
      onCodeInvalid: async (code, req) => {
        return new Response(
          `
          <html>
            <body>
              <h1>Invalid code</h1>
              <form action="callback">
                <input type="text" name="code" placeholder="Code" />
                <input type="submit" value="Verify" />
              </form>
            </body>
          </html>
        `,
          {
            headers: {
              "Content-Type": "text/html",
            },
          }
        );
      },
      onCodeRequest: async (code, claims, req) => {
        console.log("code reqested", {
          claims,
          code,
        });
        await ses.send(
          new SendEmailCommand({
            FromEmailAddress: "auth@" + Resource.ShortDomainEmail.sender,
            Destination: {
              ToAddresses: [claims.email],
            },
            Content: {
              Simple: {
                Subject: {
                  Data: "[[APP_NAME]] code: " + code,
                },
                Body: {
                  Text: {
                    Data: `Your code is: ${code}`,
                  },
                },
              },
            },
          })
        );
        return new Response(
          `
          <html>
            <body>
              <h1>Check your email for a code</h1>
                <form action="callback">
                  <input type="text" name="code" placeholder="Code" />
                  <input type="submit" value="Verify" />
                </form>
            </body>
          </html>
        `,
          {
            headers: {
              "Content-Type": "text/html",
            },
          }
        );
      },
    }),
  },
  session,
  callbacks: {
    auth: {
      async allowClient() {
        return true;
      },
      async success(ctx, input, req) {
        if (input.provider === "email") {
          const email = input.claims.email!;
          let userID = await User.fromEmail(email).then((x) => x?.id);
          if (!userID) {
            userID = await User.create({
              email,
            });
          }
          return ctx.session({
            type: "user",
            properties: {
              userID,
            },
          });
        }
        if (input.provider === "ssh") {
        }

        throw new Error("Unknown provider");
      },
    },
  },
});
