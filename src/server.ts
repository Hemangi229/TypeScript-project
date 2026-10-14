
import "dotenv/config";
import { createApp } from "./app";

const port = Number(process.env.PORT ?? 3000);

function getMaxReplacements(): number {
  const value = process.env.MAX_REPLACEMENTS ?? "100";
  const limit = Number(value);

  if (!Number.isSafeInteger(limit) || limit < 0) {
    throw new Error(
      "MAX_REPLACEMENTS must be a non-negative integer"
    );
  }

  return limit;
}

const maxReplacements = getMaxReplacements();


const app = createApp(maxReplacements);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log(
    `Maximum replacements per request: ${maxReplacements}`
  );
});
