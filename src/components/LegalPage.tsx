import React, { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { getApiBaseUrl } from "../lib/apiBase";

type LegalPageProps = {
  page: "privacy" | "delete-account";
};

const effectiveDate = "2 August 2026";

const PageShell: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <main className="min-h-screen bg-slate-50 text-slate-800">
    <div className="mx-auto max-w-3xl px-5 py-10 sm:py-16">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link to="/login" className="text-xl font-bold text-blue-700">Privora</Link>
        <nav className="flex gap-4 text-sm">
          <Link to="/privacy" className="text-blue-700 hover:underline">Privacy</Link>
          <Link to="/delete-account" className="text-blue-700 hover:underline">Delete account</Link>
        </nav>
      </div>
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <h1 className="mb-2 text-3xl font-bold text-slate-950">{title}</h1>
        <p className="mb-8 text-sm text-slate-500">Effective date: {effectiveDate}</p>
        <div className="space-y-7 leading-7">{children}</div>
      </article>
    </div>
  </main>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    <h2 className="mb-2 text-xl font-semibold text-slate-950">{title}</h2>
    <div className="space-y-3">{children}</div>
  </section>
);

function PrivacyPolicy() {
  return (
    <PageShell title="Privacy Policy">
      <p>
        Privora is an independent messaging application available at privora-app.com. This policy explains
        what information Privora processes when you create an account and use the web or mobile application.
      </p>

      <Section title="Information we process">
        <ul className="list-disc space-y-2 pl-6">
          <li>Account data, including your email address, display name, Firebase user ID and profile photo.</li>
          <li>Messages, reactions, call history entries, voice messages and files that you choose to send.</li>
          <li>Support messages and issue reports that you submit.</li>
          <li>Device notification tokens and basic technical information needed to deliver notifications and operate calls.</li>
          <li>Camera, photo-library and microphone content only when you choose to use the related feature.</li>
        </ul>
      </Section>

      <Section title="Why we use this information">
        <p>
          We use it to create and secure your account, deliver messages and files, connect voice calls,
          display your profile, send incoming-call notifications, provide support and diagnose service problems.
          Privora does not sell personal information or use it for targeted advertising.
        </p>
      </Section>

      <Section title="Service providers and transfers">
        <p>
          Privora uses Google Firebase for authentication and cloud messaging. Messages, uploaded files and
          support requests are processed by the Privora backend and its hosting infrastructure. Voice-call media
          is transmitted using WebRTC and may pass through STUN or TURN infrastructure when a direct connection
          is unavailable. Privora does not record voice calls.
        </p>
      </Section>

      <Section title="Security">
        <p>
          Production connections are protected in transit with HTTPS, WSS and the encryption provided by WebRTC.
          Access to account features requires a valid Firebase authentication token. Privora does not currently
          claim that stored chat content is end-to-end encrypted.
        </p>
      </Section>

      <Section title="Retention and deletion">
        <p>
          Account and conversation data is retained while your account is active so that the service can operate.
          You can delete your account from Privora settings or submit a request on the
          {" "}<Link to="/delete-account" className="text-blue-700 hover:underline">account deletion page</Link>.
          A confirmed deletion removes the Firebase account and associated Privora backend records. Limited
          information may be retained only when reasonably necessary for security, abuse prevention or a legal obligation.
        </p>
      </Section>

      <Section title="Your choices">
        <p>
          Android permissions can be changed in your device settings. You can choose not to upload a profile photo,
          record audio, attach files or enable notifications. You may request access, correction or deletion through
          the Contact us form in Privora settings or through the public deletion-request page.
        </p>
      </Section>

      <Section title="Children">
        <p>Privora is not directed to children under 13 and does not knowingly collect their personal information.</p>
      </Section>

      <Section title="Contact and policy changes">
        <p>
          Privacy questions can be sent to{" "}
          <a href="mailto:privora.support.app@gmail.com" className="text-blue-700 hover:underline">
            privora.support.app@gmail.com
          </a>{" "}
          or through the Contact us form in Privora settings. If you cannot access your account, use the public
          deletion-request form and explain your request in the details field. Material changes to this policy will
          be published on this page with a new effective date.
        </p>
      </Section>
    </PageShell>
  );
}

function DeleteAccountPage() {
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ message: string; error?: boolean } | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/account-deletion-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), details: details.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "The request could not be submitted.");
      setEmail("");
      setDetails("");
      setStatus({ message: data.message || "Request received." });
    } catch (error) {
      setStatus({
        message: error instanceof Error ? error.message : "The request could not be submitted.",
        error: true,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell title="Delete your Privora account">
      <p>
        The fastest option is <strong>Privora → Settings → Delete account</strong>. That authenticated flow
        deletes your account immediately after confirmation. If you no longer have access to the app, submit the
        request below using the email address registered to your Privora account.
      </p>

      <Section title="What is deleted">
        <ul className="list-disc space-y-2 pl-6">
          <li>Your Firebase authentication account and Privora profile.</li>
          <li>Messages and pending messages associated with your account.</li>
          <li>Your locally hosted profile photo and identifiable uploaded attachments sent by your account.</li>
          <li>Notification tokens, support requests and issue reports associated with your account.</li>
        </ul>
      </Section>

      <Section title="Request deletion without the app">
        <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <label className="block">
            <span className="mb-1 block font-medium">Registered email address</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              maxLength={320}
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-medium">Details (optional)</span>
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              maxLength={2000}
              rows={4}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Explain if you cannot access your account."
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-red-600 px-4 py-2.5 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? "Submitting…" : "Request account deletion"}
          </button>
          {status && (
            <p className={status.error ? "text-red-700" : "text-green-700"}>{status.message}</p>
          )}
        </form>
        <p className="text-sm text-slate-600">
          For security, submitting this form does not prove ownership. Privora will verify the request using the
          registered address before deleting data. The response does not reveal whether an account exists.
        </p>
      </Section>
    </PageShell>
  );
}

export default function LegalPage({ page }: LegalPageProps) {
  return page === "privacy" ? <PrivacyPolicy /> : <DeleteAccountPage />;
}
