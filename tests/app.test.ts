
import request from "supertest";
import { createApp } from "../src/app";

describe("POST /replace", () => {
  it("replaces exact dog values in nested JSON", async () => {
    const app = createApp(100, 100);

    const response = await request(app)
      .post("/replace")
      .send({
        pet: "dog",
        message: "My dog is friendly",
        animals: ["dog", "cat", "dog"],
        details: {
          favorite: "dog"
        }
      });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      pet: "cat",
      message: "My dog is friendly",
      animals: ["cat", "cat", "cat"],
      details: {
        favorite: "cat"
      }
    });
  });

  it("does not replace substrings or object keys", async () => {
    const app = createApp(100);

    const response = await request(app)
      .post("/replace")
      .send({
        dog: "hotdog",
        message: "My dog is friendly",
        exactMatch: "dog"
      });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      dog: "hotdog",
      message: "My dog is friendly",
      exactMatch: "cat"
    });
  });

  it("respects the maximum replacement count", async () => {
    const app = createApp(2, 100);

    const response = await request(app)
      .post("/replace")
      .send({
        first: "dog",
        second: ["dog", "dog"]
      });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      first: "cat",
      second: ["cat", "dog"]
    });
  });

  it("does not replace differently cased strings", async () => {
    const app = createApp(100, 100);

    const response = await request(app)
      .post("/replace")
      .send({
        first: "Dog",
        second: "DOG",
        third: "dog"
      });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      first: "Dog",
      second: "DOG",
      third: "cat"
    });
  });

  it("supports a maximum of zero replacements", async () => {
    const app = createApp(0, 100);

    const response = await request(app)
      .post("/replace")
      .send({
        pet: "dog",
        message: "My dog is friendly"
      });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      pet: "dog",
      message: "My dog is friendly"
    });
  });

  it("accepts a primitive JSON string", async () => {
    const app = createApp(10, 100);

    const response = await request(app)
      .post("/replace")
      .set("Content-Type", "application/json")
      .send('"dog"');

    expect(response.status).toBe(200);
    expect(response.text).toBe('"cat"');
  });

  it("returns 400 for malformed JSON", async () => {
    const app = createApp(10, 100);

    const response = await request(app)
      .post("/replace")
      .set("Content-Type", "application/json")
      .send('{"pet":');

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      error: "Invalid JSON request body"
    });
  });

  it("returns 413 for oversized requests", async () => {
    const app = createApp(10, 100);

    const response = await request(app)
      .post("/replace")
      .send({
        message: "x".repeat(1_100_000)
      });

    expect(response.status).toBe(413);
  });

  it("accepts JSON at the maximum nesting depth", async () => {
    const app = createApp(100, 3);
    
    const response = await request(app)
    .post("/replace")
    .send([[["dog"]]]);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([[["cat"]]]);
  });

  it("returns 400 when JSON exceeds the nesting depth limit", async () => {
    const app = createApp(100, 3);

    const response = await request(app)
      .post("/replace")
      .set("Content-Type", "application/json")
      .send('[[[["dog"]]]]');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "JSON nesting depth exceeds the maximum of 3"
    });
  });

  it("returns 400 for extremely deeply nested JSON", async () => {
    const app = createApp(100, 100);
    const depth = 20_000;

    const deeplyNestedJson =
      "[".repeat(depth) +
      '"safe"' +
      "]".repeat(depth);

    const response = await request(app)
      .post("/replace")
      .set("Content-Type", "application/json")
      .send(deeplyNestedJson);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "JSON nesting depth exceeds the maximum of 100"
    });
  });

  it("returns 415 for a text/plain request", async () => {
    const app = createApp(100);

    const response = await request(app)
      .post("/replace")
      .set("Content-Type", "text/plain")
      .send('{"pet":"dog"}');

    expect(response.status).toBe(415);
    expect(response.body).toEqual({
      error: "Content-Type must be application/json"
    });
  });

  it("returns 400 for an empty JSON request body", async () => {
    const app = createApp(100);

    const response = await request(app)
      .post("/replace")
      .set("Content-Type", "application/json")
      .send("");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Request body must not be empty"
    });
  });
});
