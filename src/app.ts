
import express, {
  Request,
  Response,
  NextFunction
} from "express";
import {
  MaxDepthExceededError,
  replaceDogValues
} from "./replace";

export function createApp(
  maxReplacements = 100,
  maxDepth = 100
) {
  if (
    !Number.isSafeInteger(maxReplacements) ||
    maxReplacements < 0
  ) {
    throw new Error(
      "maxReplacements must be a non-negative integer"
    );
  }

  const app = express();

  app.use(
    express.json({
      limit: "1mb",
      strict: false
    })
  );

  app.post("/replace", (req: Request, res: Response) => {
    const contentType = req
      .get("content-type")
      ?.split(";")[0]
      .trim()
      .toLowerCase();

    // Reject requests that are not JSON.
    if (contentType !== "application/json") {
      return res.status(415).json({
        error: "Content-Type must be application/json"
      });
    }

    // Reject an empty request body.
    if (
    req.body === undefined ||
    req.body === null ||
    (typeof req.body === "object" &&
      !Array.isArray(req.body) &&
      Object.keys(req.body).length === 0)
    ) {
      return res.status(400).json({
        error: "Request body must not be empty",
      });
    }

    const result = replaceDogValues(
      req.body,
      maxReplacements,
      maxDepth
    );

    return res.status(200).json(result.data);
  });


  // Handle malformed JSON and oversized requests.
  app.use(
    (
      err: Error & { status?: number },
      _req: Request,
      res: Response,
      _next: NextFunction
    ) => {
      if (err.status === 413) {
        return res.status(413).json({
          error: "Request body exceeds the 1 MB limit"
        });
      }

      if (err.status === 400) {
        return res.status(400).json({
          error: "Invalid JSON request body"
        });
      }

      if (err instanceof MaxDepthExceededError) {
        return res.status(400).json({
          error: err.message
        });
      }

      return res.status(500).json({
        error: "Internal server error"
      });
    }
  );

  return app;
}