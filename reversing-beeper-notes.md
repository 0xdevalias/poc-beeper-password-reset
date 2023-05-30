# Some notes on reversing aspects of Beeper

## `loginWithEmail` flow

```typescript
// Ref: https://chat.beeper.com/bundles/c119ff66b93d0b2b97a4/init.js

{
  name: 'beginUserLogin',
  code: async function() {
    return this.beeperCallWithoutAuth('/user/login', {
      method: 'POST'
    });
  }
}
```

```typescript
// Ref: https://chat.beeper.com/bundles/c119ff66b93d0b2b97a4/init.js

{
  name: 'requestLoginChallenge',
    code: async function (request, email) {
    return this.beeperCallWithoutAuth(`/user/login/email`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        request,
        email
      })
    });
  }
},
```

```typescript
// Ref: https://chat.beeper.com/bundles/c119ff66b93d0b2b97a4/init.js

{
  name: 'loginChallengeResponse',
  code: async function (request, challenge) {
    try {
      return await this.beeperCallWithoutAuth(`/user/login/response`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          request,
          response: challenge
        })
      });
    } catch (e) {
      if (e instanceof HTTPError && e.status === 403) {
        throw new Error("Incorrect Code.");
      }

      throw e;
    }
  }
}
```

```typescript
// Ref: https://chat.beeper.com/bundles/c119ff66b93d0b2b97a4/init.js

{
  name: 'beeperCallWithoutAuth',
  code: async function beeperCallWithoutAuth(url, init) {
    let resp = await this.beeperServices.fetchFromBeeperApiWithoutAuth(url, init);

    if (!resp.ok) {
      await throwErrorFromResponse(resp);
    }

    if (resp.headers.has("content-type") && resp.headers.get("content-type").startsWith("application/json")) return resp.json();
    return resp.text();
  }
}
```

```typescript
// Ref: https://chat.beeper.com/bundles/c119ff66b93d0b2b97a4/init.js

/**
 * Performs a fetch request and
 * prefixes the given URL with the configured API url.
 *
 * @param path path component with leading slash
 * @param init fetch options, you can override Authorization by specifying it
 * @returns promise of the fetch response
 */


fetchFromBeeperApiWithoutAuth(path, _ref = {}) {
  let {
    headers = {}
  } = _ref,
      additionalOptions = _babel_runtime_helpers_objectWithoutProperties__WEBPACK_IMPORTED_MODULE_0___default()(_ref, _excluded);

  return Object(matrix_js_sdk_src_bpFetch__WEBPACK_IMPORTED_MODULE_2__[/* bpFetch */ "a"])(`${this.apiUrl}${path}`, _objectSpread({
    headers: _objectSpread({
      Authorization: `Bearer BEEPER-PRIVATE-API-PLEASE-DONT-USE`
    }, headers)
  }, additionalOptions));
}
```
