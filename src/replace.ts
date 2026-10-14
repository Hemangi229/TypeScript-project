export class MaxDepthExceededError extends Error {
  constructor(public readonly maxDepth: number) {
    super(`JSON nesting depth exceeds the maximum of ${maxDepth}`);
    this.name = "MaxDepthExceededError";
  }
}

export interface ReplacementResult {
  data: unknown;
  replacements: number;
}

export function replaceDogValues(
  input: unknown,
  maxReplacements: number,
  maxDepth = 100
): ReplacementResult {
  if (
    !Number.isSafeInteger(maxReplacements) ||
    maxReplacements < 0
  ) {
    throw new Error(
      "maxReplacements must be a non-negative integer"
    );
  }

  if (!Number.isSafeInteger(maxDepth) || maxDepth < 0) {
    throw new Error(
      "maxDepth must be a non-negative integer"
    );
  }

  let replacements = 0;

  function visit(value: unknown, depth = 0): unknown {
    // Reject excessive nesting before making another recursive call.
    if (depth > maxDepth) {
      throw new MaxDepthExceededError(maxDepth);
    }

    // Avoid unnecessary traversal and copying after the limit.
    if (replacements >= maxReplacements) {
      return value;
    }

    if (value === "dog") {
      replacements++;
      return "cat";
    }

    if (Array.isArray(value)) {
      return value.map((item) => visit(item, depth + 1));
    }

    if (value !== null && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(
          ([key, nestedValue]) => [
            key,
            visit(nestedValue, depth + 1)
          ]
        )
      );
    }

    return value;
  }

  return {
    data: visit(input),
    replacements
  };
}