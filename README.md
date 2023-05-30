# Beeper - Password Reset (JWT)

Proof of Concept (PoC) script implementing JWT / email-code based password reset flow for Beeper / Matrix.

## Warning

**WARNING:** Use this at your own risk, there might be bugs; if the flows aren't implemented correctly you may end up logging out all of your existing devices, and if you haven't backed up your encryption keys you may lose access to your encrypted messages. You use this tool at your own risk.

## Usage

First you will need to run:

```shell
npm install
```

Then you can use the script as follows:

```shell
./beeper-password-reset --help

./beeper-password-reset --version 

./beeper-password-reset login-email --email user@example.com

./beeper-password-reset login-token --token jwtToken123

./beeper-password-reset reset-password --access_token accessToken123 --jwt_token jwtToken123 --new_password newPassword123
```

Output from `./beeper-password-reset --help`:

```shell
⇒ ./beeper-password-reset.ts --help
beeper-password-reset.ts <command>

Commands:
  beeper-password-reset.ts login-email     Login with email
  beeper-password-reset.ts login-token     Login with JWT token
  beeper-password-reset.ts reset-password  Reset password

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

## Announcement Posts

- https://twitter.com/_devalias/status/1663515884575657993
- https://www.linkedin.com/posts/glenn-devalias-grant_opensource-beeper-matrix-activity-7069282362525675520-VlCb
- https://www.reddit.com/r/beeper/comments/13vol68/i_built_a_beeper_password_reset_tool_for_login/
- https://news.ycombinator.com/item?id=36123896

## Background Context

### Summarised Notes / Process (and ChatGPT Prompts)

The following are my notes (formatted as a ChatGPT prompt) on implementing a JWT-based password reset flow, using Beeper's new 'email login' flow.

```markdown
Write me a basic typescript CLI app that implements 3 seperate flows/commands. The code should be neat/DRY, easy to understand, and easily maintainable/extensible.

--

The first flow allows logging in with an email address and code sent to the email:

- ask the user for their email address (if not already read from CLI params)
- send a POST to https://api.beeper.com/user/login with an empty body and `Authorization: "Bearer BEEPER-PRIVATE-API-PLEASE-DONT-USE"` header
- extract the `request` param from that response and display it to the user
- send a POST to https://api.beeper.com/user/login/email with the extracted request + email in the body `{"request":"REDACTED","email":"REDACTED"}` + `Authorization: "Bearer BEEPER-PRIVATE-API-PLEASE-DONT-USE"` header
- ask the user for the code sent to their email address
- send a POST to https://api.beeper.com/user/login/response with the request + code from email: `{"request":"REDACTED","response":"REDACTED-code-from-email"}` + `Authorization: "Bearer BEEPER-PRIVATE-API-PLEASE-DONT-USE"` header
- extract the JWT `token` from the response and display it to the user

--

The second flow show allow the user to login with a JWT token:

- ask the user for their JWT token (if not already read from CLI params)
- send a POST request to https://matrix.beeper.com/_matrix/client/v3/login with the JWT token: { "type": "org.matrix.login.jwt", "token": "REDACTED" }
- extract the access_token, device_id and user_id from the response + display the entire response json pretty formatted

--

The third flow allows the user to reset their password using an access token and JWT:

- ask the user for their access token, JWT, and new password (if not already read from CLI params)
- send a POST to https://matrix.beeper.com/_matrix/client/v3/account/password with the access token in the Authorization Bearer REDACTED-ACCESS-TOKEN header, and no json body
- extract the `session` from the response, and ensure that the `flows` contains an entry with a `stages` array that contains `"org.matrix.login.jwt"`, if not, throw an error
- send a POST to https://matrix.beeper.com/_matrix/client/v3/account/password with the access token in the Authorization Bearer REDACTED-ACCESS-TOKEN header, and previously extracted `session` and `jwt` in the JSON body:
{
    "auth": {
        "type": "org.matrix.login.jwt",
        "token": "REDACTED.JWT.TOKEN",
        "session": "REDACTED-FROM-PREV-RESPONSE"
    },
    "new_password": "REDACTED-NEW-PASSWORD",
    "logout_devices": false
}
- If that response is a 200 success, tell the user their password was changed successfully

--

See also:

- Synapse JWT Support
  - Issue: https://github.com/matrix-org/synapse/issues/1504
  - PR: https://github.com/matrix-org/synapse/pull/671
  - Docs: https://github.com/matrix-org/synapse/pull/7776
- Beeper JWT Support
  - https://github.com/beeper/synapse/commit/906fa572163a94fccaaf451577bf8dbd32c1af44
- Matrix Spec
  - https://spec.matrix.org/latest/client-server-api/#using-access-tokens
  - https://spec.matrix.org/latest/client-server-api/#login
  - https://spec.matrix.org/latest/client-server-api/#user-interactive-api-in-the-rest-api
  - https://spec.matrix.org/latest/client-server-api/#post_matrixclientv3accountpassword
- Synapse Docs
  - https://matrix-org.github.io/synapse/latest/jwt.html
```

Followup ChatGPT prompts:

```
Can you use fetch instead of axios?
```

```
Modify yargs so it shows the help text when no command provided
```
