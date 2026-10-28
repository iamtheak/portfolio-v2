"use client";

import { useState, type FormEvent } from "react";
import { LINKS } from "../data";

interface Errors {
  name?: string;
  email?: string;
  message?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitError("");
    const next: Errors = {};
    if (!name.trim()) next.name = "NAME REQUIRED.";
    if (!email.trim()) next.email = "EMAIL REQUIRED.";
    else if (!EMAIL_RE.test(email.trim())) next.email = "INVALID EMAIL FORMAT.";
    if (!message.trim()) next.message = "MESSAGE REQUIRED.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        if (result.errors) setErrors(result.errors);
        setSubmitError(result.error ?? "CHECK YOUR MESSAGE AND TRY AGAIN.");
        return;
      }
      setSent(true);
    } catch {
      setSubmitError("COULD NOT SAVE YOUR MESSAGE. PLEASE TRY AGAIN.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full border-4 border-ink bg-abyss p-3 font-vt text-2xl text-ink placeholder:text-muted focus:shadow-[inset_0_0_0_3px_#29adff] focus:outline-none";

  return (
    <section id="contact" aria-label="Contact" className="scroll-mt-20 bg-base">
      <div className="mx-auto max-w-4xl px-4 py-14 pb-10">
        <p className="font-pixel text-[10px] text-yellow">LVL 05 — SAVE POINT</p>
        <h2 className="mt-2 font-pixel text-lg sm:text-2xl">
          CONTACT<span className="text-neon">.</span>
        </h2>
        <p className="mt-3 font-vt text-2xl text-muted">
          GOT A QUEST, A ROLE, OR JUST WANNA TALK PIXELS? DROP A MESSAGE.
        </p>

        <div className="mt-8 border-4 border-ink bg-panel p-4 shadow-[8px_8px_0_#7efc64] sm:p-6">
          {sent ? (
            <div role="status" className="border-4 border-neon bg-abyss p-6 text-center">
              <p className="font-pixel text-sm text-neon">★ MESSAGE SAVED! ★</p>
              <p className="mt-3 font-vt text-2xl">
                CHECKPOINT REACHED, {name.trim().toUpperCase()}. I REPLY FASTER THAN A SPEEDRUN.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setName("");
                  setEmail("");
                  setMessage("");
                }}
                className="mt-4 border-4 border-ink bg-panel2 px-4 py-2 font-pixel text-[10px] hover:bg-neon hover:text-abyss"
              >
                NEW MESSAGE
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className="font-pixel text-[10px] text-neon">
                    NAME *
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="PLAYER 1"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "contact-name-err" : undefined}
                    className={`${inputCls} mt-2`}
                  />
                  {errors.name && (
                    <p id="contact-name-err" role="alert" className="mt-1 font-pixel text-[9px] text-pink">
                      {errors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="contact-email" className="font-pixel text-[10px] text-neon">
                    EMAIL *
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="PLAYER1@OVERWORLD.GG"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "contact-email-err" : undefined}
                    className={`${inputCls} mt-2`}
                  />
                  {errors.email && (
                    <p id="contact-email-err" role="alert" className="mt-1 font-pixel text-[9px] text-pink">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="contact-message" className="font-pixel text-[10px] text-neon">
                  MESSAGE *
                </label>
                <textarea
                  id="contact-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="DESCRIBE YOUR QUEST..."
                  rows={5}
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? "contact-message-err" : undefined}
                  className={`${inputCls} mt-2 resize-y`}
                />
                {errors.message && (
                  <p id="contact-message-err" role="alert" className="mt-1 font-pixel text-[9px] text-pink">
                    {errors.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
                className="mt-5 w-full border-4 border-ink bg-neon px-5 py-3 font-pixel text-xs text-abyss shadow-[4px_4px_0_#f4f4f4] enabled:hover:translate-[2px] enabled:hover:translate-y-[2px] enabled:hover:shadow-[2px_2px_0_#f4f4f4] enabled:active:translate-[4px] enabled:active:translate-y-[4px] enabled:active:shadow-none disabled:cursor-wait disabled:opacity-60"
              >
                <span role="status" aria-live="polite">
                  {submitting ? <><span aria-hidden="true" className="mr-2 inline-block h-3 w-3 animate-spin border-2 border-abyss border-t-transparent motion-reduce:animate-none" />SENDING...</> : "SEND MESSAGE ▸"}
                </span>
              </button>
              {submitError && <p role="alert" className="mt-3 font-pixel text-[9px] text-pink">{submitError}</p>}
            </form>
          )}

          <div className="mt-6 flex flex-wrap gap-2 border-t-4 border-ink pt-5">
            <a
              href={`mailto:${LINKS.email}`}
              className="border-4 border-ink bg-panel2 px-4 py-2 font-pixel text-[10px] hover:bg-blue hover:text-abyss"
            >
              EMAIL
            </a>
            <a
              href={LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              className="border-4 border-ink bg-panel2 px-4 py-2 font-pixel text-[10px] hover:bg-blue hover:text-abyss"
            >
              GITHUB ↗
            </a>
            <a
              href={LINKS.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="border-4 border-ink bg-panel2 px-4 py-2 font-pixel text-[10px] hover:bg-blue hover:text-abyss"
            >
              LINKEDIN ↗
            </a>
          </div>
        </div>

        <footer className="mt-10 text-center">
          <p className="font-pixel text-[9px] text-muted">
            © 2026 ADARSHA KARKI — NO CONTINUE SCREEN. THANKS FOR PLAYING.
          </p>
        </footer>
      </div>
    </section>
  );
}
