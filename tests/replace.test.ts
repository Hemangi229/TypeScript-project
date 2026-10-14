
import { replaceDogValues } from "../src/replace";

describe("replaceDogValues", () => {
  it("replaces exact string values in nested JSON", () => {
    const input = {
      pet: "dog",
      message: "My dog is friendly",
      animals: ["dog", "cat", "dog"],
      details: {
        favorite: "dog"
      }
    };

    expect(replaceDogValues(input, 100)).toEqual({
      data: {
        pet: "cat",
        message: "My dog is friendly",
        animals: ["cat", "cat", "cat"],
        details: {
          favorite: "cat"
        }
      },
      replacements: 4
    });
  });

  it("does not replace substrings or object keys", () => {
    const input = {
      dog: "hotdog",
      message: "My dog is friendly",
      exactMatch: "dog"
    };

    expect(replaceDogValues(input, 100)).toEqual({
      data: {
        dog: "hotdog",
        message: "My dog is friendly",
        exactMatch: "cat"
      },
      replacements: 1
    });
  });

  it("respects the maximum replacement count", () => {
    expect(
      replaceDogValues(["dog", "dog", "dog"], 2)
    ).toEqual({
      data: ["cat", "cat", "dog"],
      replacements: 2
    });
  });

  it("does not replace differently cased strings", () => {
    expect(
      replaceDogValues(["Dog", "DOG", "dog"], 10)
    ).toEqual({
      data: ["Dog", "DOG", "cat"],
      replacements: 1
    });
  });
});
