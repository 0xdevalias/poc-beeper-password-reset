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

async function loginWithEmail(_email?: string) {
  const email =
    _email ??
    (
      await prompts({
        type: "text",
        name: "email",
        message: "Enter your email:",
      })
    ).email;

  if (!email) throw new Error("Email is required");

  const loginResponse = await fetch("https://api.beeper.com/user/login", {
    method: "POST",
    headers: {
      Authorization: "Bearer BEEPER-PRIVATE-API-PLEASE-DONT-USE",
    },
  });
  const { request } = await loginResponse.json();

  if (!request)
    throw new Error("JSON response object missing required 'request' key");

  await fetch("https://api.beeper.com/user/login/email", {
    method: "POST",
    headers: {
      Authorization: "Bearer BEEPER-PRIVATE-API-PLEASE-DONT-USE",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ request, email }),
  });

  const code = (
    await prompts({
      type: "text",
      name: "code",
      message: "Enter the challenge code sent to your email:",
    })
  ).code;

  if (!code) throw new Error("Code is required");

  const loginChallengeResponse = await fetch(
    "https://api.beeper.com/user/login/response",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer BEEPER-PRIVATE-API-PLEASE-DONT-USE",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ request, response: code }),
    }
  );
  const { token } = await loginChallengeResponse.json();

  console.log("Your JWT Token: ", token);
}

async function loginWithToken(_token?: string) {
  const token =
    _token ??
    (
      await prompts({
        type: "text",
        name: "token",
        message: "Enter your JWT token:",
      })
    ).token;

  if (!token) throw new Error("Token is required");

  const jwtLoginResponse = await fetch(
    "https://matrix.beeper.com/_matrix/client/v3/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "org.matrix.login.jwt", token: token }),
    }
  );

  const jwtLoginResponseData = await jwtLoginResponse.json();
  const {
    user_id: userId,
    access_token: accessToken,
    device_id: deviceId,
  } = jwtLoginResponseData;

  console.log(
    "JWT Login Response:",
    JSON.stringify(jwtLoginResponseData, null, 2)
  );

  console.log("User ID:", userId);
  console.log("Access Token:", accessToken);
  console.log("Device ID:", deviceId);
}

async function resetPassword(
  _accessToken?: string,
  _jwtToken?: string,
  _newPassword?: string
) {
  const accessToken =
    _accessToken ??
    (
      await prompts({
        type: "text",
        name: "access_token",
        message: "Enter your Access Token:",
      })
    ).access_token;

  if (!accessToken) throw new Error("Access token is required");

  const jwtToken =
    _jwtToken ??
    (
      await prompts({
        type: "text",
        name: "jwt_token",
        message: "Enter your JWT Token:",
      })
    ).jwt_token;

  if (!jwtToken) throw new Error("JWT token is required");

  const newPassword =
    _newPassword ??
    (
      await prompts({
        type: "password",
        name: "new_password",
        message: "Enter your new password:",
      })
    ).new_password;

  if (!newPassword) throw new Error("New password is required");

  const userInteractiveAuthenticationFlowsResponse = await fetch(
    "https://matrix.beeper.com/_matrix/client/v3/account/password",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    }
  );

  const { session, flows } =
    await userInteractiveAuthenticationFlowsResponse.json();

  const hasJwtFlow = flows.find((f) =>
    f.stages.includes("org.matrix.login.jwt")
  );

  if (!hasJwtFlow)
    throw new Error("Matrix server doesn't seem to support JWT flow");

  await fetch("https://matrix.beeper.com/_matrix/client/v3/account/password", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth: {
        type: "org.matrix.login.jwt",
        token: jwtToken,
        session: session,
      },
      new_password: newPassword,
      logout_devices: false,
    }),
  });

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
