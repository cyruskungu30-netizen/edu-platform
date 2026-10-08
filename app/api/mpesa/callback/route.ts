 import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type MpesaCallbackMetadataItem = {
  Name?: string;
  Value?: string | number;
};

type MpesaStkCallback = {
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  ResultCode?: number;
  ResultDesc?: string;
  CallbackMetadata?: {
    Item?: MpesaCallbackMetadataItem[];
  };
};

type MpesaCallbackBody = {
  Body?: {
    stkCallback?: MpesaStkCallback;
  };
};

type PaymentRecord = {
  id: string;
  order_id: string;
  user_id: string;
  provider: string;
  transaction_reference: string | null;
  checkout_request_id: string | null;
  merchant_request_id: string | null;
  phone_number: string | null;
  amount: number;
  currency: string;
  status: string;
};

type OrderItemRecord = {
  id: string;
  order_id: string;
  resource_id: string;
  title_snapshot: string;
  price_snapshot: number;
  quantity: number;
};

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL environment variable.",
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY environment variable.",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getMetadataValue(
  items: MpesaCallbackMetadataItem[],
  name: string,
) {
  const item = items.find(
    (entry) =>
      typeof entry.Name === "string" &&
      entry.Name.toLowerCase() === name.toLowerCase(),
  );

  return item?.Value ?? null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MpesaCallbackBody;

    console.log(
      "M-PESA CALLBACK RECEIVED:",
      JSON.stringify(body),
    );

    const stkCallback = body?.Body?.stkCallback;

    if (!stkCallback) {
      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Callback received.",
      });
    }

    const checkoutRequestId =
      stkCallback.CheckoutRequestID ?? null;

    const merchantRequestId =
      stkCallback.MerchantRequestID ?? null;

    const resultCode = Number(
      stkCallback.ResultCode ?? -1,
    );

    const resultDescription =
      stkCallback.ResultDesc ??
      "No M-Pesa result description was supplied.";

    if (!checkoutRequestId) {
      console.error(
        "M-PESA CALLBACK: Missing CheckoutRequestID.",
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Callback received.",
      });
    }

    const supabase = createAdminClient();

    /*
     * ============================================================
     * FIND PAYMENT
     * ============================================================
     */

    const { data: paymentData, error: paymentLookupError } =
      await supabase
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
        .eq("checkout_request_id", checkoutRequestId)
        .maybeSingle();

    if (paymentLookupError) {
      console.error(
        "M-PESA PAYMENT LOOKUP ERROR:",
        paymentLookupError,
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Callback received.",
      });
    }

    if (!paymentData) {
      console.error(
        "M-PESA CALLBACK: Payment not found.",
        checkoutRequestId,
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Callback received.",
      });
    }

    const payment = paymentData as PaymentRecord;

    /*
     * ============================================================
     * EXTRACT CALLBACK METADATA
     * ============================================================
     */

    const metadata =
      stkCallback.CallbackMetadata?.Item ?? [];

    const mpesaReceiptNumber = getMetadataValue(
      metadata,
      "MpesaReceiptNumber",
    );

    const callbackPhoneNumber = getMetadataValue(
      metadata,
      "PhoneNumber",
    );

    const callbackAmount = getMetadataValue(
      metadata,
      "Amount",
    );

    const transactionDate = getMetadataValue(
      metadata,
      "TransactionDate",
    );

    /*
     * ============================================================
     * IDEMPOTENCY
     * ============================================================
     */

    if (payment.status === "completed") {
      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Payment already processed.",
      });
    }

    /*
     * ============================================================
     * SUCCESSFUL PAYMENT
     * ============================================================
     */

    if (resultCode === 0) {
      /*
       * ----------------------------------------------------------
       * VERIFY CALLBACK AMOUNT
       * ----------------------------------------------------------
       */

      if (callbackAmount !== null) {
        const receivedAmount = Number(callbackAmount);
        const expectedAmount = Number(payment.amount);

        if (
          !Number.isFinite(receivedAmount) ||
          receivedAmount !== expectedAmount
        ) {
          console.error(
            "M-PESA AMOUNT MISMATCH:",
            JSON.stringify({
              paymentId: payment.id,
              expectedAmount,
              receivedAmount,
            }),
          );

          await supabase
            .from("payments")
            .update({
              status: "failed",
              raw_response: {
                callback: body,
                error: "Payment amount mismatch.",
                expectedAmount,
                receivedAmount,
              },
            })
            .eq("id", payment.id);

          await supabase
            .from("orders")
            .update({
              status: "failed",
            })
            .eq("id", payment.order_id);

          return NextResponse.json({
            ResultCode: 0,
            ResultDesc: "Callback received.",
          });
        }
      }

      const rawResponse = {
        callback: body,
        resultCode,
        resultDescription,
        checkoutRequestId,
        merchantRequestId,
        mpesaReceiptNumber,
        callbackPhoneNumber,
        callbackAmount,
        transactionDate,
      };

      /*
       * ----------------------------------------------------------
       * MARK PAYMENT COMPLETED
       * ----------------------------------------------------------
       */

      const { error: paymentUpdateError } =
        await supabase
          .from("payments")
          .update({
            transaction_reference:
              mpesaReceiptNumber
                ? String(mpesaReceiptNumber)
                : payment.transaction_reference,
            checkout_request_id: checkoutRequestId,
            merchant_request_id:
              merchantRequestId ??
              payment.merchant_request_id,
            phone_number: callbackPhoneNumber
              ? String(callbackPhoneNumber)
              : payment.phone_number,
            status: "completed",
            raw_response: rawResponse,
          })
          .eq("id", payment.id);

      if (paymentUpdateError) {
        console.error(
          "M-PESA PAYMENT UPDATE ERROR:",
          paymentUpdateError,
        );

        return NextResponse.json({
          ResultCode: 0,
          ResultDesc: "Callback received.",
        });
      }

      /*
       * ----------------------------------------------------------
       * MARK ORDER PAID
       * ----------------------------------------------------------
       */

      const { error: orderUpdateError } =
        await supabase
          .from("orders")
          .update({
            status: "paid",
          })
          .eq("id", payment.order_id);

      if (orderUpdateError) {
        console.error(
          "M-PESA ORDER UPDATE ERROR:",
          orderUpdateError,
        );

        return NextResponse.json({
          ResultCode: 0,
          ResultDesc: "Callback received.",
        });
      }

      /*
       * ----------------------------------------------------------
       * GET ORDER ITEMS
       * ----------------------------------------------------------
       */

      const {
        data: orderItemsData,
        error: orderItemsError,
      } = await supabase
        .from("order_items")
        .select(
          `
          id,
          order_id,
          resource_id,
          title_snapshot,
          price_snapshot,
          quantity
        `,
        )
        .eq("order_id", payment.order_id);

      if (orderItemsError) {
        console.error(
          "ORDER ITEMS LOOKUP ERROR:",
          orderItemsError,
        );

        return NextResponse.json({
          ResultCode: 0,
          ResultDesc: "Callback received.",
        });
      }

      const orderItems =
        (orderItemsData ?? []) as OrderItemRecord[];

      /*
       * ----------------------------------------------------------
       * CREATE ENTITLEMENTS
       * ----------------------------------------------------------
       *
       * download_limit = null means unlimited downloads.
       *
       * download_count starts at zero.
       */

      for (const orderItem of orderItems) {
        const {
          data: existingEntitlement,
          error: entitlementLookupError,
        } = await supabase
          .from("entitlements")
          .select(
            `
            id,
            user_id,
            resource_id,
            order_id,
            download_limit,
            download_count,
            purchased_at,
            expires_at
          `,
          )
          .eq("user_id", payment.user_id)
          .eq("resource_id", orderItem.resource_id)
          .eq("order_id", payment.order_id)
          .maybeSingle();

        if (entitlementLookupError) {
          console.error(
            "ENTITLEMENT LOOKUP ERROR:",
            entitlementLookupError,
          );

          continue;
        }

        /*
         * Do not create duplicate entitlements if Safaricom
         * sends the callback more than once.
         */

        if (existingEntitlement) {
          continue;
        }

        const { error: entitlementInsertError } =
          await supabase
            .from("entitlements")
            .insert({
              user_id: payment.user_id,
              resource_id: orderItem.resource_id,
              order_id: payment.order_id,
              download_limit: null,
              download_count: 0,
              purchased_at: new Date().toISOString(),
              expires_at: null,
            });

        if (entitlementInsertError) {
          console.error(
            "ENTITLEMENT CREATION ERROR:",
            entitlementInsertError,
          );

          continue;
        }
      }

      console.log(
        "M-PESA PAYMENT COMPLETED:",
        JSON.stringify({
          paymentId: payment.id,
          orderId: payment.order_id,
          userId: payment.user_id,
          receipt: mpesaReceiptNumber,
          entitlementCount: orderItems.length,
        }),
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc:
          "Payment processed and resources unlocked.",
      });
    }

    /*
     * ============================================================
     * FAILED / CANCELLED PAYMENT
     * ============================================================
     */

    const failedStatus =
      resultCode === 1032
        ? "cancelled"
        : "failed";

    const failedRawResponse = {
      callback: body,
      resultCode,
      resultDescription,
      checkoutRequestId,
      merchantRequestId,
    };

    const {
      error: failedPaymentUpdateError,
    } = await supabase
      .from("payments")
      .update({
        status: failedStatus,
        raw_response: failedRawResponse,
      })
      .eq("id", payment.id);

    if (failedPaymentUpdateError) {
      console.error(
        "M-PESA FAILED PAYMENT UPDATE ERROR:",
        failedPaymentUpdateError,
      );
    }

    const {
      error: failedOrderUpdateError,
    } = await supabase
      .from("orders")
      .update({
        status: failedStatus,
      })
      .eq("id", payment.order_id);

    if (failedOrderUpdateError) {
      console.error(
        "M-PESA FAILED ORDER UPDATE ERROR:",
        failedOrderUpdateError,
      );
    }

    console.log(
      "M-PESA PAYMENT FAILED:",
      JSON.stringify({
        paymentId: payment.id,
        orderId: payment.order_id,
        resultCode,
        resultDescription,
      }),
    );

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Callback received.",
    });
  } catch (error) {
    console.error(
      "M-PESA CALLBACK ERROR:",
      error,
    );

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Callback received.",
    });
  }
}