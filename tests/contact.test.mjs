import assert from "node:assert/strict";
import { test } from "node:test";
import postgres from "postgres";

const { POST } = await import(new URL("../src/app/api/contact/route.ts", import.meta.url).href);
const submission = { name: " Player One ", email: "player@example.com", message: " Hello 'world' " };
const request = (body) => new Request("http://localhost/api/contact", { method: "POST", body: JSON.stringify(body) });

test("validates input, awaits parameterized persistence, hides database errors", async () => {
  const originalUrl = process.env.DATABASE_URL;
  const originalSql = globalThis.contactSql;
  process.env.DATABASE_URL = "postgres://unused";
  try {
    let called = false;
    globalThis.contactSql = { begin: () => { called = true; throw new Error("secret database details"); } };
    for (const body of [null, [], {}, { ...submission, email: "invalid" }, { ...submission, name: 42 }, { ...submission, message: "x".repeat(5001) }]) {
      assert.equal((await POST(request(body))).status, 400);
    }
    assert.equal((await POST(new Request("http://localhost/api/contact", { method: "POST", body: "{" }))).status, 400);
    assert.equal((await POST(request({ ...submission, message: "x".repeat(20_001) }))).status, 413);
    assert.equal(called, false);
    const failure = await POST(request(submission));
    assert.equal(failure.status, 500);
    assert.deepEqual(await failure.json(), { success: false, error: "COULD NOT SAVE YOUR MESSAGE. PLEASE TRY AGAIN." });
    let release;
    const transaction = (strings, ...values) => {
      if (strings.join("").includes("pg_advisory_xact_lock")) return Promise.resolve([]);
      if (strings.join("").includes("count(*)")) return Promise.resolve([{ total: 0, sender: 0 }]);
      assert.match(strings.join("?"), /INSERT INTO public\.contacts/);
      assert.match(strings.join("?"), /CURRENT_TIMESTAMP/);
      assert.deepEqual(values, ["Player One", "player@example.com", "Hello 'world'"]);
      return new Promise((resolve) => { release = resolve; });
    };
    globalThis.contactSql = { begin: (callback) => callback(transaction) };
    let completed = false;
    const pending = POST(request(submission)).then((response) => { completed = true; return response; });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(completed, false);
    release([]);
    const success = await pending;
    assert.equal(success.status, 200);
    assert.deepEqual(await success.json(), { success: true });
  } finally {
    if (originalUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalUrl;
    globalThis.contactSql = originalSql;
  }
});

test("rejects oversized streams before consuming the rest of the request", async () => {
  let cancelled = false;
  let pulls = 0;
  const stream = new ReadableStream({
    pull(controller) {
      pulls++;
      controller.enqueue(new Uint8Array(10_001));
    },
    cancel() { cancelled = true; },
  }, { highWaterMark: 0 });
  const response = await POST(new Request("http://localhost/api/contact", {
    method: "POST", body: stream, duplex: "half",
  }));
  assert.equal(response.status, 413);
  assert.equal(pulls, 2);
  assert.equal(cancelled, true);
});

test("rate limits by global volume or email before inserting", async () => {
  const originalUrl = process.env.DATABASE_URL;
  const originalSql = globalThis.contactSql;
  process.env.DATABASE_URL = "postgres://unused";
  try {
    for (const counts of [{ total: 30, sender: 0 }, { total: 3, sender: 3 }]) {
      let locked = false;
      globalThis.contactSql = { begin: async (callback) => callback(async (strings) => {
        const query = strings.join("");
        if (query.includes("pg_advisory_xact_lock")) { locked = true; return []; }
        assert.equal(locked, true);
        assert.match(query, /count\(\*\)/);
        return [counts];
      }) };
      const response = await POST(request(submission));
      assert.equal(response.status, 429);
      assert.equal(response.headers.get("Retry-After"), "600");
      assert.equal((await response.json()).success, false);
    }
  } finally {
    if (originalUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalUrl;
    globalThis.contactSql = originalSql;
  }
});

test("persists fields and a creation timestamp, then rolls back", { skip: !process.env.DATABASE_URL }, async () => {
  const sql = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 10 });
  const originalSql = globalThis.contactSql;
  const rollback = new Error("Roll back test submission");
  try {
    await assert.rejects(sql.begin(async (transaction) => {
      globalThis.contactSql = { begin: (callback) => transaction.savepoint(callback) };
      const email = `contact-test-${crypto.randomUUID()}@example.com`;
      assert.equal((await POST(request({ ...submission, email }))).status, 200);
      const rows = await transaction`SELECT name, email, message, created_at FROM public.contacts WHERE email = ${email}`;
      assert.equal(rows.length, 1);
      assert.equal(rows[0].name, "Player One");
      assert.equal(rows[0].email, email);
      assert.equal(rows[0].message, "Hello 'world'");
      assert.ok(rows[0].created_at instanceof Date);
      for (let i = 0; i < 2; i++) {
        assert.equal((await POST(request({ ...submission, email: email.toUpperCase() }))).status, 200);
      }
      assert.equal((await POST(request({ ...submission, email }))).status, 429);
      const [{ count }] = await transaction`SELECT count(*)::int AS count FROM public.contacts WHERE lower(email) = lower(${email})`;
      assert.equal(count, 3);
      throw rollback;
    }), (error) => error === rollback);
  } finally {
    globalThis.contactSql = originalSql;
    await sql.end({ timeout: 1 });
  }
});
