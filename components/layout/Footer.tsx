 import Link from "next/link";
import {
  Mail,
  Phone,
  MessageCircle,
  ArrowUpRight,
  GraduationCap,
} from "lucide-react";

const WHATSAPP_URL =
  "https://wa.me/254795083575?text=Hello%20EduMarket!%20I%20would%20like%20to%20enquire%20about%20your%20educational%20resources.";

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
      <path d="M13.5 21v-8.2h2.76l.41-3.2H13.5V7.56c0-.93.26-1.56 1.6-1.56h1.7V3.14C16.5 3.05 15.48 3 14.3 3c-2.48 0-4.18 1.52-4.18 4.3v2.3H7.3v3.2h2.82V21h3.38Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.8" r="1.2" fill="currentColor" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" className="h-8 w-8">
      <path d="M16 3A13 13 0 0 0 4.8 22.6L3 29l6.6-1.7A13 13 0 1 0 16 3Zm0 23.6h-.01a10.6 10.6 0 0 1-5.4-1.48l-.4-.23-3.94 1.03 1.05-3.83-.26-.41a10.6 10.6 0 1 1 8.96 4.92Zm5.84-7.95c-.32-.16-1.9-.94-2.2-1.05-.3-.1-.51-.16-.72.16-.21.32-.83 1.05-1.02 1.26-.19.22-.37.25-.69.09-.32-.16-1.35-.5-2.57-1.6-.95-.83-1.59-1.87-1.78-2.19-.19-.32-.02-.5.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.72-1.74-.99-2.38-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.08-1.11 2.64s1.14 3.06 1.3 3.27c.16.21 2.23 3.4 5.41 4.77.76.33 1.35.53 1.81.68.76.24 1.45.21 1.99.13.61-.09 1.9-.78 2.17-1.53.27-.76.27-1.4.19-1.53-.08-.13-.29-.21-.61-.37Z" />
    </svg>
  );
}

const socialLinks = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/",
    icon: FacebookIcon,
    color: "hover:bg-[#1877F2]",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/",
    icon: InstagramIcon,
    color: "hover:bg-gradient-to-br hover:from-purple-600 hover:via-pink-500 hover:to-orange-400",
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/",
    icon: YouTubeIcon,
    color: "hover:bg-[#FF0033]",
  },
];

export default function Footer() {
  return (
    <>
      <footer className="relative overflow-hidden border-t border-white/10 bg-[#07111f] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]"
        />

        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid gap-11 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
            <div>
              <Link href="/" aria-label="EduMarket home" className="group inline-flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-lg shadow-emerald-500/20 transition duration-300 group-hover:scale-105">
                  <GraduationCap size={27} />
                </div>

                <span className="text-2xl font-black tracking-tight">
                  Edu<span className="text-emerald-400">Market</span>
                </span>
              </Link>

              <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
                A modern educational marketplace connecting learners and educators
                with quality teaching, learning, revision, and assessment resources.
              </p>

              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
              >
                <MessageCircle size={17} />
                Chat with our team
                <ArrowUpRight size={15} />
              </a>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.16em]">Resources</h3>
              <div className="mt-5 space-y-4 text-sm text-slate-400">
                <Link href="/resources" className="block transition hover:translate-x-1 hover:text-emerald-400">All Resources</Link>
                <Link href="/categories" className="block transition hover:translate-x-1 hover:text-emerald-400">Categories</Link>
                <Link href="/resources?type=exams" className="block transition hover:translate-x-1 hover:text-emerald-400">Exams & Assessments</Link>
                <Link href="/resources?type=notes" className="block transition hover:translate-x-1 hover:text-emerald-400">Study Notes</Link>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.16em]">Platform</h3>
              <div className="mt-5 space-y-4 text-sm text-slate-400">
                <Link href="/teachers" className="block transition hover:translate-x-1 hover:text-emerald-400">For Teachers</Link>
                <Link href="/about" className="block transition hover:translate-x-1 hover:text-emerald-400">About EduMarket</Link>
                <Link href="/support" className="block transition hover:translate-x-1 hover:text-emerald-400">Help & Support</Link>
                <Link href="/privacy" className="block transition hover:translate-x-1 hover:text-emerald-400">Privacy Policy</Link>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.16em]">Get in Touch</h3>

              <div className="mt-5 space-y-4">
                <a href="mailto:support@edumarket.co.ke" className="group flex min-w-0 items-start gap-3 text-sm text-slate-400 transition hover:text-white">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-emerald-400">
                    <Mail size={17} />
                  </span>
                  <span className="break-all pt-2">support@edumarket.co.ke</span>
                </a>

                <a href="tel:+254758788674" className="group flex items-center gap-3 text-sm text-slate-400 transition hover:text-white">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-emerald-400">
                    <Phone size={17} />
                  </span>
                  <span>+254 795 083 575</span>
                </a>

                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 text-sm text-slate-400 transition hover:text-emerald-400">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400">
                    <MessageCircle size={18} />
                  </span>
                  <span>WhatsApp Support</span>
                  <ArrowUpRight size={14} />
                </a>
              </div>

              <h4 className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Follow EduMarket
              </h4>

              <div className="mt-4 flex flex-wrap gap-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;

                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Visit EduMarket on ${social.name}`}
                      title={social.name}
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-transparent hover:text-white hover:shadow-lg ${social.color}`}
                    >
                      <Icon />
                    </a>
                  );
                })}
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                Follow our channels for educational updates and new resources.
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p className="text-xs leading-6 text-slate-500">
 © 2026 EduMarket. All rights reserved.
             </p>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-emerald-400 transition hover:text-emerald-300"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
              Need help? Chat with us
            </a>
          </div>
        </div>
      </footer>

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with EduMarket on WhatsApp"
        title="Chat with us on WhatsApp"
        className="group fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-[#25D366] text-white shadow-[0_8px_30px_rgba(37,211,102,0.4)] transition-all duration-300 hover:scale-110 hover:bg-[#20BA5A] hover:shadow-[0_12px_40px_rgba(37,211,102,0.55)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-300/60 motion-reduce:transition-none sm:bottom-7 sm:right-7 sm:h-16 sm:w-16"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-2 border-green-300/60 motion-safe:animate-ping motion-reduce:animate-none"
        />
        <WhatsAppIcon />
      </a>
    </>
  );
}