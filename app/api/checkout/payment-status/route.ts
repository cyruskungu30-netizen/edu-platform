 import { connection } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  await connection();

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json(
        {
          error: userError.message,
        },
        { status: 401 },
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          error: "You must be signed in.",
        },
        { status: 401 },
      );
    }

    const url = new URL(request.url);

    const checkoutRequestId =
      url.searchParams.get("checkoutRequestId");

    if (!checkoutRequestId) {
      return NextResponse.json(
        {
          error: "Checkout request ID is required.",
        },
        { status: 400 },
      );
    }

    const {
      data: payment,
      error: paymentError,
    } = await supabase
      .from("payments")
      .select(
        `
        id,
        order_id,
        user_id,
        provider,
        transaction_reference,
        checkout_request_id,
        merchant_request_id,
        phone_number,
        amount,
        currency,
        status
        `,
      )
      .eq(
        "checkout_request_id",
        checkoutRequestId,
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (paymentError) {
      console.error(
        "PAYMENT_LOOKUP_ERROR:",
        paymentError,
      );

      return NextResponse.json(
        {
          error: paymentError.message,
        },
        { status: 500 },
      );
    }

    if (!payment) {
      return NextResponse.json(
        {
          error: "Payment request was not found.",
        },
        { status: 404 },
      );
    }

    const {
      data: order,
      error: orderError,
    } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        status,
        subtotal,
        discount,
        total,
        currency
        `,
      )
      .eq("id", payment.order_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (orderError) {
      console.error(
        "ORDER_LOOKUP_ERROR:",
        orderError,
      );

      return NextResponse.json(
        {
          error: orderError.message,
        },
        { status: 500 },
      );
    }

    const paymentStatus =
      payment.status;

    const orderStatus =
      order?.status ?? null;

    const completed =
      paymentStatus === "completed" &&
      orderStatus === "paid";

    const failed =
      paymentStatus === "failed" ||
      paymentStatus === "cancelled" ||
      orderStatus === "failed" ||
      orderStatus === "cancelled";

    return NextResponse.json({
      success: true,

      payment: {
        id: payment.id,
        provider: payment.provider,
        transactionReference:
          payment.transaction_reference,
        checkoutRequestId:
          payment.checkout_request_id,
        merchantRequestId:
          payment.merchant_request_id,
        phoneNumber:
          payment.phone_number,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: paymentStatus,
      },

      order: order
        ? {
            id: order.id,
            orderNumber:
              order.order_number,
            status: order.status,
            subtotal: Number(
              order.subtotal,
            ),
            discount: Number(
              order.discount,
            ),
            total: Number(
              order.total,
            ),
            currency: order.currency,
          }
        : null,

      completed,
      failed,
    });
  } catch (error) {
    console.error(
      "PAYMENT_STATUS_ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to check payment status.",
      },
      { status: 500 },
    );
  }
}