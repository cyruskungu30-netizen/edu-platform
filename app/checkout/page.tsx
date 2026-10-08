 "use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  Lock,
  Phone,
  ShieldCheck,
  Smartphone,
  XCircle,
} from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/hooks/useCart";

type PaymentState =
  | "idle"
  | "starting"
  | "waiting"
  | "success"
  | "failed";

type PaymentResponse = {
  success?: boolean;
  error?: string;
  message?: string;

  order?: {
    id: string;
    orderNumber: string;
    subtotal: number;
    discount: number;
    total: number;
    currency: string;
    status?: string;
  };

  payment?: {
    id: string;
    provider: string;
    phoneNumber: string;
    amount: number;
    currency: string;
    status: string;
    checkoutRequestId?: string | null;
    merchantRequestId?: string | null;
  };

  mpesa?: {
    responseCode?: string | null;
    responseDescription?: string | null;
    customerMessage?: string | null;
    checkoutRequestId?: string | null;
    merchantRequestId?: string | null;
  };
};

type PaymentStatusResponse = {
  success?: boolean;
  error?: string;

  payment?: {
    id: string;
    provider: string;
    transactionReference: string | null;
    checkoutRequestId: string | null;
    merchantRequestId: string | null;
    phoneNumber: string | null;
    amount: number;
    currency: string;
    status: string;
  };

  order?: {
    id: string;
    orderNumber: string;
    status: string;
    subtotal: number;
    discount: number;
    total: number;
    currency: string;
  } | null;

  completed?: boolean;
  failed?: boolean;
};

function normalizePhoneNumber(phone: string): string {
  const cleaned = phone
    .replace(/\s+/g, "")
    .replace(/-/g, "");

  if (cleaned.startsWith("+254")) {
    return `254${cleaned.slice(4)}`;
  }

  if (cleaned.startsWith("254")) {
    return cleaned;
  }

  if (cleaned.startsWith("07")) {
    return `254${cleaned.slice(1)}`;
  }

  if (cleaned.startsWith("01")) {
    return `254${cleaned.slice(1)}`;
  }

  return cleaned;
}

function isValidKenyanPhone(phone: string): boolean {
  return /^254(7|1)\d{8}$/.test(phone);
}

function formatMoney(
  amount: number | string | null | undefined,
  currency = "KES",
): string {
  const numericAmount = Number(amount ?? 0);

  const safeAmount = Number.isFinite(numericAmount)
    ? numericAmount
    : 0;

  return `${currency} ${safeAmount.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function CheckoutPage() {
  const {
    items,
    itemCount,
    subtotal,
    loading: cartLoading,
    error: cartError,
    emptyCart,
  } = useCart();

  const [phoneNumber, setPhoneNumber] =
    useState<string>("");

  const [paymentState, setPaymentState] =
    useState<PaymentState>("idle");

  const [message, setMessage] =
    useState<string>("");

  const [errorMessage, setErrorMessage] =
    useState<string>("");

  const [
    checkoutRequestId,
    setCheckoutRequestId,
  ] = useState<string | null>(null);

  const [orderNumber, setOrderNumber] =
    useState<string | null>(null);

  const [
    completedAmount,
    setCompletedAmount,
  ] = useState<number | null>(null);

  const [checkingStatus, setCheckingStatus] =
    useState<boolean>(false);

   const pollingRef =
  useRef<ReturnType<typeof window.setInterval> | null>(
    null,
  );

  const pollingAttemptsRef =
    useRef<number>(0);

  const isProcessing =
    paymentState === "starting" ||
    paymentState === "waiting";

  const displayTotal = Number(subtotal ?? 0);

  const clearPolling = useCallback(() => {
    if (pollingRef.current !== null) {
      window.clearInterval(
        pollingRef.current,
      );

      pollingRef.current = null;
    }

    pollingAttemptsRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, [clearPolling]);

  const checkPaymentStatus = useCallback(
    async (
      requestId: string,
    ): Promise<boolean> => {
      if (!requestId) {
        return false;
      }

      try {
        const response = await fetch(
          `/api/checkout/payment-status?checkoutRequestId=${encodeURIComponent(
            requestId,
          )}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as PaymentStatusResponse;

        if (!response.ok) {
          throw new Error(
            result.error ||
              "Unable to check payment status.",
          );
        }

        if (result.completed) {
          clearPolling();

          setPaymentState("success");
          setCheckingStatus(false);
          setErrorMessage("");

          setMessage(
            "Payment confirmed successfully. Your resources are now unlocked.",
          );

          if (result.order?.orderNumber) {
            setOrderNumber(
              result.order.orderNumber,
            );
          }

          if (
            result.payment?.amount !==
              undefined &&
            result.payment?.amount !== null
          ) {
            setCompletedAmount(
              Number(result.payment.amount),
            );
          }

          try {
            await emptyCart();
          } catch (error) {
            console.error(
              "Failed to clear cart after payment:",
              error,
            );
          }

          return true;
        }

        if (result.failed) {
          clearPolling();

          setPaymentState("failed");
          setCheckingStatus(false);
          setMessage("");

          setErrorMessage(
            "The M-Pesa payment was not completed. You can try again.",
          );

          return true;
        }

        return false;
      } catch (error) {
        console.error(
          "PAYMENT_STATUS_CHECK_ERROR:",
          error,
        );

        return false;
      }
    },
    [emptyCart, clearPolling],
  );

  const startPolling = useCallback(
    (requestId: string) => {
      clearPolling();

      pollingAttemptsRef.current = 0;

      const runCheck = async () => {
        pollingAttemptsRef.current += 1;

        const finished =
          await checkPaymentStatus(
            requestId,
          );

        if (finished) {
          return;
        }

        if (
          pollingAttemptsRef.current >= 24
        ) {
          clearPolling();

          setCheckingStatus(false);
          setPaymentState("waiting");

          setMessage(
            "We're still waiting for M-Pesa confirmation. You can check the payment status again below.",
          );
        }
      };

      void runCheck();

      pollingRef.current = setInterval(() => {
  void runCheck();
}, 5000);
    },
    [
      checkPaymentStatus,
      clearPolling,
    ],
  );

  const handleCheckStatus =
    async () => {
      if (!checkoutRequestId) {
        return;
      }

      setCheckingStatus(true);
      setErrorMessage("");

      const finished =
        await checkPaymentStatus(
          checkoutRequestId,
        );

      if (!finished) {
        setCheckingStatus(false);

        setMessage(
          "Payment is still pending. If you completed the M-Pesa prompt, please wait a moment and check again.",
        );
      }
    };

  const handleCheckout = async () => {
    if (paymentState === "starting") {
      return;
    }

    setErrorMessage("");
    setMessage("");

    const normalizedPhone =
      normalizePhoneNumber(
        phoneNumber,
      );

    if (!normalizedPhone) {
      setErrorMessage(
        "Please enter your M-Pesa phone number.",
      );

      return;
    }

    if (
      !isValidKenyanPhone(
        normalizedPhone,
      )
    ) {
      setErrorMessage(
        "Please enter a valid Kenyan M-Pesa number, for example 0712345678.",
      );

      return;
    }

    if (items.length === 0) {
      setErrorMessage(
        "Your cart is empty. Add a resource before checking out.",
      );

      return;
    }

    setPaymentState("starting");
    setErrorMessage("");

    setMessage(
      "Starting your M-Pesa payment...",
    );

    try {
      const response = await fetch(
        "/api/checkout/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            phoneNumber:
              normalizedPhone,
            paymentMethod:
              "mpesa",
          }),
        },
      );

      const result =
        (await response.json()) as PaymentResponse;

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to start the M-Pesa payment.",
        );
      }

      const requestId =
        result.payment
          ?.checkoutRequestId ??
        result.mpesa
          ?.checkoutRequestId ??
        null;

      if (!requestId) {
        throw new Error(
          "M-Pesa started the request but did not return a CheckoutRequestID.",
        );
      }

      setCheckoutRequestId(
        requestId,
      );

      if (result.order?.orderNumber) {
        setOrderNumber(
          result.order.orderNumber,
        );
      }

      if (
        result.order?.total !==
          undefined &&
        result.order?.total !== null
      ) {
        setCompletedAmount(
          Number(result.order.total),
        );
      }

      setPaymentState("waiting");

      setMessage(
        result.message ||
          result.mpesa
            ?.customerMessage ||
          "M-Pesa payment request sent. Check your phone and enter your M-Pesa PIN.",
      );

      startPolling(requestId);
    } catch (error) {
      console.error(
        "CHECKOUT_PAYMENT_ERROR:",
        error,
      );

      setPaymentState("failed");

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to start the M-Pesa payment.",
      );

      setMessage("");
    }
  };

  const handleRetry = () => {
    clearPolling();

    setPaymentState("idle");
    setCheckoutRequestId(null);
    setOrderNumber(null);
    setCompletedAmount(null);
    setMessage("");
    setErrorMessage("");
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />

        <main className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="h-6 w-6 animate-spin" />

            <span>
              Loading your checkout...
            </span>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  if (cartError) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />

        <main className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />

            <h1 className="text-2xl font-bold text-slate-950">
              Checkout unavailable
            </h1>

            <p className="mt-3 text-slate-600">
              {cartError}
            </p>

            <Link
              href="/cart"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to cart
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  if (
    paymentState === "success"
  ) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />

        <main className="mx-auto flex min-h-[75vh] max-w-4xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="w-full rounded-[2rem] border border-emerald-200 bg-white p-8 text-center shadow-xl shadow-emerald-100/40 sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>

            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
              Payment successful
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Your resources are unlocked 🎉
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              Your M-Pesa payment has been confirmed and your purchased
              educational resources are now available to you.
            </p>

            <div className="mx-auto mt-8 grid max-w-xl gap-4 sm:grid-cols-2">
              {orderNumber && (
                <div className="rounded-2xl bg-slate-50 p-5 text-left">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Order number
                  </p>

                  <p className="mt-2 font-bold text-slate-950">
                    {orderNumber}
                  </p>
                </div>
              )}

              {completedAmount !== null && (
                <div className="rounded-2xl bg-slate-50 p-5 text-left">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount paid
                  </p>

                  <p className="mt-2 font-bold text-slate-950">
                    {formatMoney(
                      completedAmount,
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/resources"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Browse more resources
              </Link>

              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back to EduMarket
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to cart
          </Link>

          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Secure checkout
          </h1>

          <p className="mt-2 text-slate-600">
            Complete your purchase securely with M-Pesa.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100">
                  <Smartphone className="h-6 w-6 text-green-700" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-950">
                    M-Pesa payment
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    Enter the number registered with M-Pesa. We'll send a
                    payment prompt directly to your phone.
                  </p>
                </div>
              </div>

              <div className="mt-7">
                <label
                  htmlFor="phoneNumber"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  M-Pesa phone number
                </label>

                <div className="relative">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <input
                    id="phoneNumber"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="0712 345 678"
                    value={phoneNumber}
                    onChange={(event) =>
                      setPhoneNumber(
                        event.target.value,
                      )
                    }
                    disabled={isProcessing}
                    className="w-full rounded-2xl border border-slate-300 bg-white py-4 pl-12 pr-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Supported formats include 0712345678, 0112345678,
                  254712345678 and +254712345678.
                </p>
              </div>

              {message && (
                <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <div className="flex gap-3">
                    {paymentState ===
                    "waiting" ? (
                      <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                    ) : (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                    )}

                    <div>
                      <p className="font-semibold text-blue-950">
                        {paymentState ===
                        "waiting"
                          ? "Waiting for payment confirmation"
                          : "Payment update"}
                      </p>

                      <p className="mt-1 text-sm text-blue-800">
                        {message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <div className="flex gap-3">
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                    <div>
                      <p className="font-semibold text-red-950">
                        Payment could not be completed
                      </p>

                      <p className="mt-1 text-sm text-red-800">
                        {errorMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {paymentState === "idle" && (
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={
                    items.length === 0
                  }
                  className="mt-7 flex w-full items-center justify-center gap-3 rounded-2xl bg-green-600 px-6 py-4 font-bold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Smartphone className="h-5 w-5" />
                  Pay with M-Pesa
                </button>
              )}

              {paymentState ===
                "starting" && (
                <button
                  type="button"
                  disabled
                  className="mt-7 flex w-full items-center justify-center gap-3 rounded-2xl bg-green-600 px-6 py-4 font-bold text-white opacity-80"
                >
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Starting M-Pesa payment...
                </button>
              )}

              {paymentState ===
                "waiting" && (
                <div className="mt-7 space-y-3">
                  <div className="flex items-center justify-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-6 py-4 font-semibold text-blue-900">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Waiting for M-Pesa confirmation...
                  </div>

                  <button
                    type="button"
                    onClick={
                      handleCheckStatus
                    }
                    disabled={
                      checkingStatus ||
                      !checkoutRequestId
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {checkingStatus ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking payment...
                      </>
                    ) : (
                      "Check payment status"
                    )}
                  </button>
                </div>
              )}

              {paymentState ===
                "failed" && (
                <button
                  type="button"
                  onClick={
                    handleRetry
                  }
                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 font-bold text-white transition hover:bg-slate-800"
                >
                  Try payment again
                </button>
              )}

              {checkoutRequestId &&
                paymentState ===
                  "waiting" && (
                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Payment request
                  </p>

                  <p className="mt-1 break-all font-mono text-xs text-slate-700">
                    {checkoutRequestId}
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <ShieldCheck className="h-6 w-6 text-blue-600" />

                <p className="mt-3 font-bold text-slate-950">
                  Secure payment
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  Your payment is processed securely through M-Pesa.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <Lock className="h-6 w-6 text-blue-600" />

                <p className="mt-3 font-bold text-slate-950">
                  Protected access
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  Paid resources are unlocked only after confirmation.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <CreditCard className="h-6 w-6 text-blue-600" />

                <p className="mt-3 font-bold text-slate-950">
                  Instant confirmation
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  Your order updates automatically after payment.
                </p>
              </div>
            </div>
          </section>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-950 px-6 py-5">
                <h2 className="text-lg font-bold text-white">
                  Order summary
                </h2>

                <p className="mt-1 text-sm text-slate-300">
                  {itemCount}{" "}
                  {itemCount === 1
                    ? "resource"
                    : "resources"}
                </p>
              </div>

              <div className="p-6">
                <div className="max-h-[360px] space-y-4 overflow-y-auto pr-1">
                  {items.map((item) => {
                    const itemPrice =
                      Number(
                        item.resource
                          .price ?? 0,
                      );

                    const quantity =
                      Number(
                        item.quantity ?? 0,
                      );

                    const lineTotal =
                      itemPrice *
                      quantity;

                    return (
                      <div
                        key={item.id}
                        className="flex gap-3 border-b border-slate-100 pb-4 last:border-0"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                            {
                              item
                                .resource
                                .title
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Qty:{" "}
                            {quantity}{" "}
                            ·{" "}
                            {
                              item
                                .resource
                                .format
                            }
                          </p>
                        </div>

                        <p className="shrink-0 text-sm font-bold text-slate-950">
                          {formatMoney(
                            lineTotal,
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 space-y-3 border-t border-slate-200 pt-5">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>
                      Subtotal
                    </span>

                    <span>
                      {formatMoney(
                        displayTotal,
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>
                      Discount
                    </span>

                    <span>
                      KES 0.00
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                    <span className="text-lg font-bold text-slate-950">
                      Total
                    </span>

                    <span className="text-2xl font-black text-slate-950">
                      {formatMoney(
                        displayTotal,
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                  <div className="flex gap-3">
                    <Lock className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />

                    <p className="text-xs leading-5 text-slate-600">
                      You will receive an M-Pesa prompt on the phone number
                      you provide. Never share your M-Pesa PIN with anyone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}