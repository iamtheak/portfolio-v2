import postgres from "postgres";

export const runtime = "nodejs";

const database = globalThis as typeof globalThis & { contactSql?: ReturnType<typeof postgres> };

export async function POST(request: Request) {
  let body: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) return Response.json({ success: false, error: "INVALID REQUEST." }, { status: 400 });
    const decoder = new TextDecoder();
    let bytes = 0;
    let text = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 20_000) {
          await reader.cancel();
          return Response.json({ success: false, error: "MESSAGE TOO LARGE." }, { status: 413 });
        }
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
    } finally {
      reader.releaseLock();
    }
    body = JSON.parse(text);
  } catch {
    return Response.json({ success: false, error: "INVALID REQUEST." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ success: false, error: "INVALID REQUEST." }, { status: 400 });
  }
  const fields = body as Record<string, unknown>;
  const name = typeof fields.name === "string" ? fields.name.trim() : "";
  const email = typeof fields.email === "string" ? fields.email.trim() : "";
  const message = typeof fields.message === "string" ? fields.message.trim() : "";
  const errors: Record<string, string> = {};
  if (!name) errors.name = "NAME REQUIRED.";
  else if (name.length > 200) errors.name = "NAME MUST BE 200 CHARACTERS OR LESS.";
  if (!email) errors.email = "EMAIL REQUIRED.";
  else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "INVALID EMAIL FORMAT.";
  if (!message) errors.message = "MESSAGE REQUIRED.";
  else if (message.length > 5000) errors.message = "MESSAGE MUST BE 5000 CHARACTERS OR LESS.";
  if ([name, email, message].some((value) => value.includes("\0"))) {
    return Response.json({ success: false, error: "INVALID REQUEST." }, { status: 400 });
  }
  if (Object.keys(errors).length) {
    return Response.json({ success: false, errors }, { status: 400 });
  }

  try {
    if (!process.env.DATABASE_URL) throw new Error("Missing database configuration");
    const sql = database.contactSql ??= postgres(process.env.DATABASE_URL, {
      max: 3,
      connect_timeout: 10,
      idle_timeout: 20,
    });
    const saved = await sql.begin(async (transaction) => {
      // Serialize the limit check and insert across all server instances.
      await transaction`SELECT pg_advisory_xact_lock(710709)`;
      const [counts] = await transaction`
        SELECT count(*)::int AS total,
          count(*) FILTER (WHERE lower(email) = lower(${email}))::int AS sender
        FROM public.contacts WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '10 minutes'`;
      if (counts.total >= 30 || counts.sender >= 3) return false;
      await transaction`INSERT INTO public.contacts (name, email, message, created_at)
        VALUES (${name}, ${email}, ${message}, CURRENT_TIMESTAMP)`;
      return true;
    });
    if (!saved) {
      return Response.json({ success: false, error: "TOO MANY MESSAGES. PLEASE TRY AGAIN LATER." }, {
        status: 429, headers: { "Retry-After": "600" },
      });
    }
    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false, error: "COULD NOT SAVE YOUR MESSAGE. PLEASE TRY AGAIN." }, { status: 500 });
  }
}
