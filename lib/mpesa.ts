const MPESA_ENVIRONMENT =
  process.env.MPESA_ENVIRONMENT === "production"
    ? "production"
    : "sandbox";

const MPESA_BASE_URL =
  MPESA_ENVIRONMENT === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export type MpesaAccessTokenResponse = {
  access_token: string;
  expires_in: string;
};

export type MpesaStkPushResponse = {
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  ResponseCode?: string;
  ResponseDescription?: string;
  CustomerMessage?: string;
  errorCode?: string;
  errorMessage?: string;
};

export async function getMpesaAccessToken(): Promise<string> {
  const consumerKey = getRequiredEnv("MPESA_CONSUMER_KEY");
  const consumerSecret = getRequiredEnv("MPESA_CONSUMER_SECRET");

  const credentials = Buffer.from(
    `${consumerKey}:${consumerSecret}`,
  ).toString("base64");

  const response = await fetch(
    `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
      cache: "no-store",
    },
  );

  const data =
    (await response.json()) as Partial<MpesaAccessTokenResponse> & {
      errorCode?: string;
      errorMessage?: string;
    };

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.errorMessage ||
        data.errorCode ||
        "Unable to generate M-Pesa access token.",
    );
  }

  return data.access_token;
}

function generateTimestamp(): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function generatePassword(timestamp: string): string {
  const shortcode = getRequiredEnv("MPESA_SHORTCODE");
  const passkey = getRequiredEnv("MPESA_PASSKEY");

  return Buffer.from(
    `${shortcode}${passkey}${timestamp}`,
  ).toString("base64");
}

export async function initiateMpesaStkPush({
  phoneNumber,
  amount,
  accountReference,
  transactionDescription,
}: {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDescription: string;
}): Promise<MpesaStkPushResponse> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("M-Pesa amount must be greater than zero.");
  }

  const accessToken = await getMpesaAccessToken();

  const shortcode = getRequiredEnv("MPESA_SHORTCODE");
  const callbackUrl = getRequiredEnv("MPESA_CALLBACK_URL");

  const timestamp = generateTimestamp();
  const password = generatePassword(timestamp);

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(amount),
    PartyA: phoneNumber,
    PartyB: shortcode,
    PhoneNumber: phoneNumber,
    CallBackURL: callbackUrl,
    AccountReference: accountReference.slice(0, 12),
    TransactionDesc: transactionDescription.slice(0, 13),
  };

  const response = await fetch(
    `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );

  const data = (await response.json()) as MpesaStkPushResponse;

  if (!response.ok) {
    throw new Error(
      data.errorMessage ||
        data.ResponseDescription ||
        "M-Pesa STK Push request failed.",
    );
  }

  if (data.ResponseCode && data.ResponseCode !== "0") {
    throw new Error(
      data.ResponseDescription ||
        data.CustomerMessage ||
        "M-Pesa rejected the STK Push request.",
    );
  }

  return data;
}

export function getMpesaBaseUrl(): string {
  return MPESA_BASE_URL;
}