  import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { initiateMpesaStkPush } from "@/lib/mpesa";

type CartResource = {
  id: string;
  title: string;
  slug: string;
  price: number | string;
  status: string;
  format: string;
};

type CartItem = {
  id: string;
  resource_id: string;
  quantity: number;
  resource: CartResource | CartResource[] | null;
};

function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomUUID().split("-")[0].toUpperCase();

  return `EDU-${timestamp}-${random}`;
}

function normalizePhoneNumber(phone: string) {
  const cleaned = phone.replace(/\s+/g, "").replace(/-/g, "");

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

function isValidKenyanPhone(phone: string) {
  return /^254(7|1)\d{8}$/.test(phone);
}

export async function POST(request: Request) {
  let createdOrderId: string | null = null;

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json(
        {
          error: "Unable to verify your session. Please sign in again.",
        },
        { status: 401 },
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          error: "You must be signed in before checking out.",
        },
        { status: 401 },
      );
    }

    // Service-role access is used only after verifying the signed-in user.
    // Never send the admin client or its key to the browser.
    const admin = createAdminClient();

    const body = await request.json();

    const phoneNumber = normalizePhoneNumber(
      typeof body.phoneNumber === "string" ? body.phoneNumber : "",
    );

    const paymentMethod =
      typeof body.paymentMethod === "string"
        ? body.paymentMethod.toLowerCase()
        : "mpesa";

    if (!phoneNumber) {
      return NextResponse.json(
        {
          error: "Please provide your M-Pesa phone number.",
        },
        { status: 400 },
      );
    }

    if (!isValidKenyanPhone(phoneNumber)) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid Kenyan M-Pesa number, for example 0712345678.",
        },
        { status: 400 },
      );
    }

    if (paymentMethod !== "mpesa") {
      return NextResponse.json(
        {
          error: "The selected payment method is not supported.",
        },
        { status: 400 },
      );
    }

    const { data: cart, error: cartError } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (cartError) {
      return NextResponse.json(
        {
          error: "Unable to load your cart. Please try again.",
        },
        { status: 500 },
      );
    }

    if (!cart) {
      return NextResponse.json(
        {
          error: "Your cart is empty.",
        },
        { status: 400 },
      );
    }

    const { data: cartItems, error: cartItemsError } = await supabase
      .from("cart_items")
      .select(
        `
        id,
        resource_id,
        quantity,
        resource:resources (
          id,
          title,
          slug,
          price,
          status,
          format
        )
      `,
      )
      .eq("cart_id", cart.id);

    if (cartItemsError) {
      return NextResponse.json(
        {
          error: "Unable to load your cart items. Please try again.",
        },
        { status: 500 },
      );
    }

    const items = (cartItems ?? []) as CartItem[];

    if (items.length === 0) {
      return NextResponse.json(
        {
          error: "Your cart is empty.",
        },
        { status: 400 },
      );
    }

    const normalizedItems = items.map((item) => {
      const resource = Array.isArray(item.resource)
        ? item.resource[0]
        : item.resource;

      return {
        id: item.id,
        resource_id: item.resource_id,
        quantity: Number(item.quantity),
        resource,
      };
    });

    for (const item of normalizedItems) {
      if (!item.resource) {
        return NextResponse.json(
          {
            error:
              "One of the resources in your cart is no longer available.",
          },
          { status: 400 },
        );
      }

      if (item.resource.status !== "published") {
        return NextResponse.json(
          {
            error: `"${item.resource.title}" is no longer available for purchase.`,
          },
          { status: 400 },
        );
      }

      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return NextResponse.json(
          {
            error: "Your cart contains an invalid quantity.",
          },
          { status: 400 },
        );
      }
    }

    const subtotal = normalizedItems.reduce((total, item) => {
      const price = Number(item.resource?.price ?? 0);

      return total + price * item.quantity;
    }, 0);

    const discount = 0;
    const total = subtotal - discount;

    if (!Number.isFinite(total) || total <= 0) {
      return NextResponse.json(
        {
          error: "Unable to calculate a valid payment amount.",
        },
        { status: 400 },
      );
    }

    const orderNumber = generateOrderNumber();

    /*
     * ============================================================
     * CREATE ORDER
     * ============================================================
     */

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        status: "pending",
        subtotal,
        discount,
        total,
        currency: "KES",
        coupon_code: null,
      })
      .select(
        `
        id,
        user_id,
        order_number,
        status,
        subtotal,
        discount,
        total,
        currency,
        coupon_code,
        created_at
      `,
      )
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        {
          error: "Unable to create your order. Please try again.",
        },
        { status: 500 },
      );
    }

    createdOrderId = order.id;

    /*
     * ============================================================
     * CREATE ORDER ITEMS
     * ============================================================
     */

    const orderItems = normalizedItems.map((item) => ({
      order_id: order.id,
      resource_id: item.resource_id,
      title_snapshot: item.resource!.title,
      price_snapshot: Number(item.resource!.price),
      quantity: item.quantity,
    }));

    const { error: orderItemsError } = await admin
      .from("order_items")
      .insert(orderItems);

    if (orderItemsError) {
      await admin
        .from("orders")
        .delete()
        .eq("id", order.id)
        .eq("user_id", user.id);

      return NextResponse.json(
        {
          error: "Unable to save your order items. Please try again.",
        },
        { status: 500 },
      );
    }

    /*
     * ============================================================
     * CREATE PAYMENT RECORD
     * ============================================================
     */

    const { data: payment, error: paymentError } = await admin
      .from("payments")
      .insert({
        order_id: order.id,
        user_id: user.id,
        provider: "mpesa",
        transaction_reference: null,
        checkout_request_id: null,
        merchant_request_id: null,
        phone_number: phoneNumber,
        amount: total,
        currency: "KES",
        status: "processing",
        raw_response: null,
      })
      .select(
        `
        id,
        order_id,
        provider,
        phone_number,
        amount,
        currency,
        status,
        created_at
      `,
      )
      .single();

    if (paymentError || !payment) {
      await admin
        .from("order_items")
        .delete()
        .eq("order_id", order.id);

      await admin
        .from("orders")
        .delete()
        .eq("id", order.id)
        .eq("user_id", user.id);

      return NextResponse.json(
        {
          error: "Unable to create your payment. Please try again.",
        },
        { status: 500 },
      );
    }

    /*
     * ============================================================
     * M-PESA STK PUSH
     * ============================================================
     */

    let mpesaResponse;

    try {
      mpesaResponse = await initiateMpesaStkPush({
        phoneNumber,
        amount: total,
        accountReference: order.order_number,
        transactionDescription: "EduMarket payment",
      });
    } catch (mpesaError) {
      console.error("MPESA_STK_PUSH_ERROR:", mpesaError);

      await admin
        .from("payments")
        .update({
          status: "failed",
          raw_response: {
            error:
              mpesaError instanceof Error
                ? mpesaError.message
                : "M-Pesa STK Push failed.",
          },
        })
        .eq("id", payment.id);

      await admin
        .from("orders")
        .update({
          status: "failed",
        })
        .eq("id", order.id)
        .eq("user_id", user.id);

      return NextResponse.json(
        {
          error: "Unable to start M-Pesa payment. Please try again or contact support.",
        },
        { status: 502 },
      );
    }

    /*
     * ============================================================
     * SAVE M-PESA REQUEST REFERENCES
     * ============================================================
     */

    const checkoutRequestId =
      mpesaResponse.CheckoutRequestID ?? null;

    const merchantRequestId =
      mpesaResponse.MerchantRequestID ?? null;

    const transactionReference =
      checkoutRequestId ?? merchantRequestId ?? null;

    const { error: paymentUpdateError } = await admin
      .from("payments")
      .update({
        checkout_request_id: checkoutRequestId,
        merchant_request_id: merchantRequestId,
        transaction_reference: transactionReference,
        status: "processing",
        raw_response: mpesaResponse,
      })
      .eq("id", payment.id);

    if (paymentUpdateError) {
      console.error("PAYMENT_REFERENCE_UPDATE_ERROR:", paymentUpdateError);
      return NextResponse.json(
        { error: "Payment was initiated, but its status could not be saved. Please contact support before trying again." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          mpesaResponse.CustomerMessage ||
          "M-Pesa payment request sent to your phone.",
        order: {
          id: order.id,
          orderNumber: order.order_number,
          subtotal: Number(order.subtotal),
          discount: Number(order.discount),
          total: Number(order.total),
          currency: order.currency,
          status: order.status,
        },
        payment: {
          id: payment.id,
          provider: payment.provider,
          phoneNumber: payment.phone_number,
          amount: Number(payment.amount),
          currency: payment.currency,
          status: "processing",
          checkoutRequestId,
          merchantRequestId,
        },
        mpesa: {
          responseCode: mpesaResponse.ResponseCode ?? null,
          responseDescription:
            mpesaResponse.ResponseDescription ?? null,
          customerMessage:
            mpesaResponse.CustomerMessage ?? null,
          checkoutRequestId,
          merchantRequestId,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE_ORDER_MPESA_ERROR:", error);

    if (createdOrderId) {
      try {
        const admin = createAdminClient();

        await admin
          .from("orders")
          .update({
            status: "failed",
          })
          .eq("id", createdOrderId);
      } catch (cleanupError) {
        console.error(
          "ORDER_CLEANUP_ERROR:",
          cleanupError,
        );
      }
    }

    return NextResponse.json(
      {
        error: "An unexpected checkout error occurred. Please try again.",
      },
      { status: 500 },
    );
  }
}