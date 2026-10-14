# Dog-to-Cat JSON Replacement API

## Overview

A REST API built with Node.js, Express, and TypeScript. It accepts a JSON payload and replaces exact string values equal to `"dog"` with `"cat"`.

The implementation supports nested objects and arrays, a configurable maximum number of replacements per request, request validation, a 1 MB request-body limit, and a configurable nesting-depth limit.

## Requirements

- Node.js
- npm

## Getting Started

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```dotenv
PORT=3000
MAX_REPLACEMENTS=100
```

Start the development server:

```bash
npm run dev
```

By default, the server listens on `http://localhost:3000`.

To run tests and build the project:

```bash
npm test
npm run build
```

Do not commit `.env`. Add it to `.gitignore`; commit a `.env.example` with sample values if useful.

## Configuration

- `PORT` sets the HTTP server port and defaults to `3000`.
- `MAX_REPLACEMENTS` sets the maximum number of exact replacements per request and defaults to `100`. It must be a non-negative safe integer.
- The transformation's maximum nesting depth defaults to `100` if the application factory exposes the `maxDepth` option described below.
- The JSON request body limit is `1 MB`.

## API

### `POST /replace`

Send a request with `Content-Type: application/json`. The API returns the transformed JSON payload directly, without a wrapper object.

Example request:

```json
{
  "pet": "dog",
  "message": "My dog is friendly",
  "animals": ["dog", "cat", "dog"],
  "details": { "favorite": "dog" }
}
```

Example response when `MAX_REPLACEMENTS=100`:

```json
{
  "pet": "cat",
  "message": "My dog is friendly",
  "animals": ["cat", "cat", "cat"],
  "details": { "favorite": "cat" }
}
```

The example contains four exact `"dog"` values. The `message` value is unchanged because it is not exactly `"dog"`.

### Expected status codes

- `200 OK`: The JSON payload was transformed successfully.
- `400 Bad Request`: The JSON is malformed, the JSON request body is empty, or the nesting depth exceeds the configured maximum.
- `413 Payload Too Large`: The request body exceeds the 1 MB limit.
- `415 Unsupported Media Type`: The request's media type is not `application/json`.
- `500 Internal Server Error`: An unexpected server error occurs.


## Replacement Rules and Assumptions

- Matching is exact and case-sensitive: only the string value `"dog"` is replaced.
- Substrings are not replaced. `"hotdog"` and `"My dog is friendly"` remain unchanged.
- Object keys are not replaced.
- Values nested in arrays and objects are processed.
- The replacement limit is global to the request, not per object or array.
- Traversal follows array index order and JavaScript object property enumeration order. Once the replacement limit is reached, remaining values are left unchanged.
- A limit of `0` disables replacements.
- Valid JSON primitives such as strings, numbers, booleans, and `null`, as well as arrays and objects, should be handled without converting non-string values into strings.
- The transformation should not mutate the input object. New arrays and objects are produced for traversed portions of the payload.
- The response contains the transformed JSON value directly.

## Implementation Notes

- **Express** handles HTTP requests and JSON parsing.
- **TypeScript** provides static type checking.
- Replacement logic is separated from the HTTP route for easier testing.
- A shared counter enforces the maximum replacement count.
- A short-circuit after the limit is reached avoids traversing and copying remaining subtrees. As a consequence, a depth check performed only during transformation will not inspect unvisited subtrees after the limit has been reached. If every part of the input must be depth-validated regardless of the replacement limit, perform a separate validation pass.

## Tests

Run the automated test suite:

```bash
npm test
```

The test suite should include assertions for the following behaviors. Keep this list aligned with the actual test files in `tests/`:

### Replacement logic (`tests/replace.test.ts`)

- Exact matches in nested objects and arrays are replaced.
- Substrings such as `"hotdog"` and sentences containing `"dog"` remain unchanged.
- Object keys remain unchanged.
- Matching is case-sensitive.
- The global replacement limit is respected, including a limit of zero.
- Non-string values such as numbers, booleans, and `null` remain unchanged.
- The original input object and its nested arrays/objects are unchanged after transformation.
- The transformed nested arrays/objects are new references where the implementation traverses and copies them.
- The nesting-depth boundary is accepted and values deeper than the configured maximum are rejected, if depth limiting is implemented in the transformation function.

### HTTP endpoint (`tests/app.test.ts`)

- A valid JSON request returns the expected transformed payload.
- A request with a non-JSON content type returns `415`.
- An empty request body with `Content-Type: application/json` returns `400`.
- Malformed JSON returns `400`.
- A request body over 1 MB returns `413`.
- A payload exceeding the configured nesting depth returns `400`, if depth limiting is enabled in the application factory.

Only describe a case as covered after its assertion exists in the test suite. In particular, non-string handling and input immutability must have explicit tests rather than being inferred from other tests.

## Trade-offs and Limitations

- Recursive traversal is readable and easy to test, but very deeply nested values can exceed the JavaScript call stack unless depth is bounded.
- Copying arrays and objects uses additional memory. Short-circuiting after the replacement limit reduces unnecessary work, but subtrees after the limit may be returned by reference rather than copied.
- Processing is synchronous and in memory. CPU-intensive requests can delay other requests on the same Node.js event loop.
- The 1 MB body limit controls payload size but is not a substitute for load testing, rate limiting, or deployment-level resource controls.
- The configured depth limit applies to transformation only unless validation is also performed before or during JSON parsing.

## Possible Improvements

- Add load and stress tests for throughput, latency, and memory use.
- Add structured logging, metrics, and request tracing.
- Add rate limiting and deployment-level resource limits.
- Add CI checks for tests, linting, type checking, and builds.
- Consider iterative traversal if support for deeply nested JSON is required.
