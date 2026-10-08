 import Link from "next/link";
import {
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
                📚
              </div>

              <span className="text-xl font-black">
                Edu<span className="text-emerald-400">Market</span>
              </span>
            </div>

            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
              A modern education marketplace for quality teaching,
              learning and assessment resources.
            </p>
          </div>

          <div>
            <h3 className="font-bold">Resources</h3>

            <div className="mt-4 space-y-3 text-sm text-slate-400">
              <Link
                href="/resources"
                className="block hover:text-white"
              >
                All Resources
              </Link>

              <Link
                href="/categories"
                className="block hover:text-white"
              >
                Categories
              </Link>

              <Link
                href="/resources?type=exams"
                className="block hover:text-white"
              >
                Exams & Assessments
              </Link>

              <Link
                href="/resources?type=notes"
                className="block hover:text-white"
              >
                Notes
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold">Platform</h3>

            <div className="mt-4 space-y-3 text-sm text-slate-400">
              <Link
                href="/teachers"
                className="block hover:text-white"
              >
                For Teachers
              </Link>

              <Link
                href="/about"
                className="block hover:text-white"
              >
                About Us
              </Link>

              <Link
                href="/support"
                className="block hover:text-white"
              >
                Help & Support
              </Link>

              <Link
                href="/privacy"
                className="block hover:text-white"
              >
                Privacy Policy
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold">Contact</h3>

            <div className="mt-4 space-y-4 text-sm text-slate-400">
              <div className="flex items-center gap-3">
                <Mail size={17} />
                <span>support@edumarket.co.ke</span>
              </div>

              <div className="flex items-center gap-3">
                <Phone size={17} />
                <span>+254 700 000 000</span>
              </div>

              <div className="flex items-center gap-3">
                <MessageCircle size={17} />
                <span>WhatsApp Support</span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <a
                href="#"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-sm font-bold transition hover:bg-white/20"
              >
                f
              </a>

              <a
                href="#"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-sm font-bold transition hover:bg-white/20"
              >
                ig
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-slate-500">
          © {2026} EduMarket. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

