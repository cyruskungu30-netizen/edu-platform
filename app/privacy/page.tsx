import Link from "next/link";
import {
  ShieldCheck,
  Database,
  LockKeyhole,
  UserRound,
  Mail,
  FileText,
} from "lucide-react";

export const metadata = {
  title: "Privacy Policy | EduMarket",
  description:
    "Learn how EduMarket collects, uses, stores, and protects your personal information.",
};

const sections = [
  {
    title: "1. Information We Collect",
    icon: Database,
    content:
      "We may collect information you provide when creating an account, purchasing educational resources, contacting us, or using our platform. This may include your name, email address, account details, transaction references, and information needed to provide our services.",
  },
  {
    title: "2. How We Use Your Information",
    icon: UserRound,
    content:
      "We use information to manage accounts, process orders and payments, provide access to purchased resources, respond to enquiries, improve our services, prevent fraud, and meet applicable legal obligations.",
  },
  {
    title: "3. Payments and Transactions",
    icon: LockKeyhole,
    content:
      "Payments may be processed through third-party payment providers, including M-Pesa where available. Payment processing may involve those providers' own privacy policies and terms. We do not intend to collect or store your M-Pesa PIN.",
  },
  {
    title: "4. Storage and Security",
    icon: ShieldCheck,
    content:
      "We use technical and organizational measures intended to protect personal information from unauthorized access, loss, misuse, or disclosure. No online service can guarantee absolute security, so please protect your login credentials and notify us if you suspect unauthorized account access.",
  },
  {
    title: "5. Sharing of Information",
    icon: FileText,
    content:
      "We may share necessary information with service providers that help us operate EduMarket, process payments, host data, or deliver services. We may also disclose information where required by law. We do not promise that information is never shared; any sharing should be limited to legitimate operational or legal purposes.",
  },
  {
    title: "6. Cookies and Technical Data",
    icon: Database,
    content:
      "EduMarket may use cookies, session storage, or similar technologies to support authentication, security, preferences, and platform functionality. Your browser may allow you to manage cookies, although disabling some technologies may affect how the platform works.",
  },
  {
    title: "7. Your Privacy Rights",
    icon: UserRound,
    content:
      "Depending on applicable law, you may have rights to request access to, correction of, deletion of, or other action concerning your personal information. Contact us to submit a privacy request. We may need to verify your identity before acting on it.",
  },
  {
    title: "8. Data Retention",
    icon: FileText,
    content:
      "We retain personal information for as long as reasonably necessary for the purposes described in this policy, including account operation, order records, dispute resolution, security, and legal compliance. Retention periods depend on the type of information and applicable requirements.",
  },
  {
    title: "9. Children's Privacy",
    icon: ShieldCheck,
    content:
      "EduMarket is an educational platform. Where a user is a child, use of the platform and processing of personal information must comply with applicable child-protection and data-protection requirements. Parents or guardians may contact us with questions or concerns.",
  },
  {
    title: "10. Changes to This Policy",
    icon: FileText,
    content:
      "We may update this Privacy Policy as our services or legal obligations change. When changes are made, we will update the policy on this page and revise the effective date where appropriate.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden bg-slate-950 px-6 py-20 text-white sm:py-28">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-blue-200">
            <ShieldCheck size={18} />
            Your privacy matters
          </div>

          <h1 className="mt-7 text-4xl font-black tracking-tight sm:text-6xl">
            Privacy Policy
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            This policy explains how EduMarket handles personal information
            when you use our educational marketplace.
          </p>

          <p className="mt-5 text-sm text-slate-400">
            Effective date: October 12, 2026
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
        <div className="mb-8 rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <h2 className="text-lg font-bold text-blue-950">
            A note about this policy
          </h2>
          <p className="mt-2 leading-7 text-blue-900/80">
            This is a general privacy-policy starting point. Before publishing,
            confirm that it accurately reflects EduMarket&apos;s actual data
            collection, storage, payment integrations, and retention practices.
          </p>
        </div>

        <div className="space-y-5">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <article
                key={section.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Icon size={22} />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold">{section.title}</h2>
                    <p className="mt-3 leading-8 text-slate-600">
                      {section.content}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl bg-slate-950 p-7 text-white sm:p-9">
          <div className="flex items-center gap-3">
            <Mail className="text-blue-300" size={25} />
            <h2 className="text-2xl font-bold">Privacy enquiries</h2>
          </div>

          <p className="mt-4 leading-7 text-slate-300">
            For questions about this policy or requests concerning your
            personal information, contact the EduMarket team through our
            official contact channel.
          </p>

          <Link
            href="/support"
            className="mt-6 inline-flex items-center rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500"
          >
            Contact us
          </Link>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            ← Back to EduMarket
          </Link>
        </div>
      </section>
    </main>
  );
}