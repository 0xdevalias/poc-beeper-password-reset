#!/usr/bin/env node_modules/.bin/tsx

import { default as originalFetch } from "node-fetch";
import yargs from "yargs";
import prompts from "prompts";

const DEBUG = ["1", "true"].includes(process.env.DEBUG) ?? false;

async function debugFetch(url: string, options: any) {
  console.debug("[fetch]", url, options);

  const response = await originalFetch(url, options);

  console.debug("[fetch] Response status:", response.status);
  console.debug("[fetch] Response headers:", response.headers.raw());
  console.debug("[fetch] Response body:", await response.clone().text());

  return response;
}

const fetch = DEBUG ? debugFetch : originalFetch;

async function loginWithEmail(email?: string) {
  email =
    email ||
    (
      await prompts({
        type: "text",
        name: "email",
        message: "Enter your email:",
      })
    ).email;

  let resp = await fetch("https://api.beeper.com/user/login", {
    method: "POST",
    body: JSON.stringify({}),
  });
  let data = await resp.json();
  let request = data.request;

  resp = await fetch("https://api.beeper.com/user/login/email", {
    method: "POST",
    body: JSON.stringify({ request: request, email: email }),
  });

  const code = (
    await prompts({
      type: "text",
      name: "code",
      message: "Enter the code sent to your email:",
    })
  ).code;

  resp = await fetch("https://api.beeper.com/user/login/response", {
    method: "POST",
    body: JSON.stringify({ request: request, response: code }),
  });

  data = await resp.json();
  const token = data.token;
  console.log("Your JWT Token: ", token);
}

async function loginWithToken(token?: string) {
  token =
    token ||
    (
      await prompts({
        type: "text",
        name: "token",
        message: "Enter your JWT token:",
      })
    ).token;

  const resp = await fetch(
    "https://matrix.beeper.com/_matrix/client/v3/login",
    {
      method: "POST",
      body: JSON.stringify({ type: "org.matrix.login.jwt", token: token }),
    }
  );

  const data = await resp.json();
  const { access_token, device_id, user_id } = data;
  console.log("Your Response: ", JSON.stringify(data, null, 2));
}

async function resetPassword(
  access_token?: string,
  jwt_token?: string,
  new_password?: string
) {
  access_token =
    access_token ||
    (
      await prompts({
        type: "text",
        name: "access_token",
        message: "Enter your Access Token:",
      })
    ).access_token;

  jwt_token =
    jwt_token ||
    (
      await prompts({
        type: "text",
        name: "jwt_token",
        message: "Enter your JWT Token:",
      })
    ).jwt_token;

  new_password =
    new_password ||
    (
      await prompts({
        type: "password",
        name: "new_password",
        message: "Enter your new password:",
      })
    ).new_password;

  let resp = await fetch(
    "https://matrix.beeper.com/_matrix/client/v3/account/password",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${access_token}` },
      body: JSON.stringify({}),
    }
  );

  let data = await resp.json();
  const session = data.session;
  const flow = data.flows.find((f: any) =>
    f.stages.includes("org.matrix.login.jwt")
  );
  if (!flow) throw new Error("Invalid flow");

  resp = await fetch(
    "https://matrix.beeper.com/_matrix/client/v3/account/password",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${access_token}` },
      body: JSON.stringify({
        auth: {
          type: "org.matrix.login.jwt",
          token: jwt_token,
          session: session,
        },
        new_password: new_password,
        logout_devices: false,
      }),
    }
  );

  console.log("Password reset successfully");
}

yargs
  .command(
    "login-email",
    "Login with email",
    (yargs) => {
      return yargs.option("email", {
        describe: "Email address",
        type: "string",
      });
    },
    (argv) => {
      loginWithEmail(argv.email as string | undefined);
    }
  )
  .command(
    "login-token",
    "Login with JWT token",
    (yargs) => {
      return yargs.option("token", { describe: "JWT token", type: "string" });
    },
    (argv) => {
      loginWithToken(argv.token as string | undefined);
    }
  )
  .command(
    "reset-password",
    "Reset password",
    (yargs) => {
      return yargs
        .option("access_token", { describe: "Access token", type: "string" })
        .option("jwt_token", { describe: "JWT token", type: "string" })
        .option("new_password", { describe: "New password", type: "string" });
    },
    (argv) => {
      resetPassword(
        argv.access_token as string | undefined,
        argv.jwt_token as string | undefined,
        argv.new_password as string | undefined
      );
    }
  )
  .demandCommand(1, "") // Require at least 1 command, show no error message
  .help().argv;
