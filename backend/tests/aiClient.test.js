const assert = require("node:assert/strict");
const http = require("node:http");
const { test } = require("node:test");

const {
  AIServiceError,
  requestAI,
} = require("../src/services/aiClient.service");
const {
  getVisibleDocumentFilter,
  toStoredSources,
} = require("../src/services/chat.service");

test("AI client and authorization helpers", async (t) => {
  const server = http.createServer((req, res) => {
    if (req.url === "/ok") {
      let body = "";
      req.on("data", (chunk) => { body += chunk; });
      req.on("end", () => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          ok: true,
          method: req.method,
          payload: body ? JSON.parse(body) : null,
        }));
      });
      return;
    }

    if (req.url === "/fail") {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ detail: "AI gateway unavailable" }));
      return;
    }

    if (req.url === "/slow") {
      const timer = setTimeout(() => {
        if (!res.destroyed) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true }));
        }
      }, 100);
      res.on("close", () => clearTimeout(timer));
      return;
    }

    res.writeHead(404);
    res.end();
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const oldUrl = process.env.AI_SERVICE_URL;
  process.env.AI_SERVICE_URL = `http://127.0.0.1:${server.address().port}`;

  try {
    await t.test("posts JSON and parses AI responses", async () => {
      const result = await requestAI("/ok", {
        body: { message: "hello" },
        timeoutMs: 1000,
      });
      assert.equal(result.ok, true);
      assert.equal(result.method, "POST");
      assert.deepEqual(result.payload, { message: "hello" });
    });

    await t.test("maps upstream failures to a gateway error", async () => {
      await assert.rejects(
        requestAI("/fail", { timeoutMs: 1000 }),
        (error) => {
          assert.ok(error instanceof AIServiceError);
          assert.equal(error.statusCode, 503);
          assert.match(error.message, /AI gateway unavailable/);
          return true;
        },
      );
    });

    await t.test("times out slow AI requests", async () => {
      await assert.rejects(
        requestAI("/slow", { timeoutMs: 10 }),
        (error) => {
          assert.ok(error instanceof AIServiceError);
          assert.equal(error.statusCode, 504);
          return true;
        },
      );
    });

    await t.test("students can retrieve only public documents", () => {
      assert.deepEqual(getVisibleDocumentFilter({ role: "student" }), {
        isActive: { $ne: false },
        visibility: "PUBLIC",
      });
    });

    await t.test("teachers can retrieve public and teacher-only documents", () => {
      assert.deepEqual(getVisibleDocumentFilter({ role: "teacher" }), {
        isActive: { $ne: false },
        visibility: { $in: ["PUBLIC", "TEACHER_ONLY"] },
      });
    });

    await t.test("unknown roles are denied all document IDs", () => {
      assert.deepEqual(getVisibleDocumentFilter({ role: "guest" }), {
        isActive: { $ne: false },
        _id: { $in: [] },
      });
    });

    await t.test("only authorized, unique sources are stored", () => {
      const sources = toStoredSources([
        { document_id: "ai-a", title: "Allowed A", page: 2 },
        { document_id: "ai-a", title: "Duplicate", page: 3 },
        { document_id: "ai-b", title: "Not allowed", page: 1 },
      ], [
        { _id: "mongo-a", aiDocumentId: "ai-a", title: "Document A" },
      ]);

      assert.deepEqual(sources, [
        { documentId: "mongo-a", title: "Allowed A", page: 2 },
      ]);
    });
  } finally {
    if (oldUrl === undefined) delete process.env.AI_SERVICE_URL;
    else process.env.AI_SERVICE_URL = oldUrl;
    await new Promise((resolve) => server.close(resolve));
  }
});
