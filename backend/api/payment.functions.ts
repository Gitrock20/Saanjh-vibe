import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerConfig } from "../../src/lib/config.server";
import Razorpay from "razorpay";
import crypto from "crypto";

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      amount: z.number().int().min(100), // in paise, minimum 100 paise
      currency: z.string().default("INR"),
      receipt: z.string().optional(),
    })
  )
  .handler(async ({ data: { amount, currency, receipt } }) => {
    const config = getServerConfig();
    const keyId = config.razorpayKeyId;
    const keySecret = config.razorpayKeySecret;

    if (!keyId || !keySecret) {
      console.error("Razorpay API credentials are not configured in the environment.");
      return {
        success: false,
        error: "Payment gateway is not configured on the server. Please check your environment variables.",
      };
    }

    try {
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      const order = await razorpay.orders.create({
        amount,
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
      });

      return {
        success: true,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
      };
    } catch (e: any) {
      console.error("Razorpay Order Creation Failed:", e);
      const errorMessage = e.description || (e.error && e.error.description) || e.message || "Failed to create order with Razorpay.";
      return {
        success: false,
        error: errorMessage,
      };
    }
  });

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      razorpay_order_id: z.string(),
      razorpay_payment_id: z.string(),
      razorpay_signature: z.string(),
    })
  )
  .handler(async ({ data: { razorpay_order_id, razorpay_payment_id, razorpay_signature } }) => {
    const config = getServerConfig();
    const keySecret = config.razorpayKeySecret;

    if (!keySecret) {
      console.error("Razorpay API Key Secret is not configured in the environment.");
      return {
        success: false,
        error: "Verification failed: Server API Key Secret is missing.",
      };
    }

    try {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return {
          success: false,
          error: "Missing fields required for payment verification.",
        };
      }

      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      const isMatch = generatedSignature === razorpay_signature;

      if (isMatch) {
        return { success: true };
      } else {
        return { success: false, error: "Signature mismatch. Verification failed." };
      }
    } catch (e: any) {
      console.error("Razorpay Payment Verification Failed:", e);
      const errorMessage = e.description || (e.error && e.error.description) || e.message || "Failed to verify signature.";
      return {
        success: false,
        error: errorMessage,
      };
    }
  });

export const sendOrderEmail = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email(),
      name: z.string(),
      orderId: z.string(),
      amount: z.number(),
      itemsCount: z.number(),
      status: z.enum(["success", "failed"]),
      details: z.string().optional(),
    })
  )
  .handler(async ({ data: { email, name, orderId, amount, itemsCount, status, details } }) => {
    const config = getServerConfig();
    const apiKey = config.resendApiKey;

    if (!apiKey) {
      console.error("RESEND_API_KEY is not configured in .env file.");
      return { success: false, error: "Email service is temporarily unavailable." };
    }

    try {
      const subject = status === "success" 
        ? `Order Confirmed! — ${orderId}` 
        : `Payment Failed for Order — ${orderId}`;
      
      const htmlContent = status === "success" 
        ? `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333333;">
            <h1 style="font-family: serif; color: #b0925a; font-size: 28px; border-bottom: 2px solid #F6EFE9; padding-bottom: 15px;">Order Confirmation</h1>
            <p>Dear <strong>${name}</strong>,</p>
            <p>Thank you for shopping with Saanjh Studio! We are delighted to confirm that your order has been successfully placed and is now being processed.</p>
            
            <div style="background: #faf8f5; border: 1px solid #e5dcd3; border-radius: 6px; padding: 18px; margin: 25px 0;">
              <h3 style="font-family: serif; color: #b0925a; margin-top: 0; font-size: 18px;">Order Details</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; color: #666;">Order Reference:</td>
                  <td style="padding: 6px 0; font-weight: bold; text-align: right;">${orderId}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666;">Items count:</td>
                  <td style="padding: 6px 0; text-align: right;">${itemsCount} ${itemsCount === 1 ? "item" : "items"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666;">Amount Paid:</td>
                  <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #b0925a; font-size: 16px;">₹${amount}</td>
                </tr>
              </table>
            </div>

            <p>We will send you another update once your package has been shipped. In the meantime, you can track your order status in the "My Orders" section of your Saanjh profile.</p>
            <p style="margin-top: 30px;">Warm regards,<br /><strong>Saanjh Studio</strong></p>
          </div>
        `
        : `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333333;">
            <h1 style="font-family: serif; color: #e11d48; font-size: 28px; border-bottom: 2px solid #ffe4e6; padding-bottom: 15px;">Payment Failed</h1>
            <p>Dear <strong>${name}</strong>,</p>
            <p>We noticed that you tried to place an order with Saanjh Studio, but unfortunately, the payment transaction could not be completed successfully.</p>
            
            <div style="background: #fff5f5; border: 1px solid #fecdd3; border-radius: 6px; padding: 18px; margin: 25px 0;">
              <h3 style="font-family: serif; color: #e11d48; margin-top: 0; font-size: 18px;">Transaction Details</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; color: #666;">Order Reference:</td>
                  <td style="padding: 6px 0; font-weight: bold; text-align: right;">${orderId}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666;">Pending Total:</td>
                  <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #e11d48; font-size: 16px;">₹${amount}</td>
                </tr>
                ${details ? `
                <tr>
                  <td style="padding: 6px 0; color: #666;">Reason:</td>
                  <td style="padding: 6px 0; text-align: right; color: #c084fc;">${details}</td>
                </tr>` : ""}
              </table>
            </div>

            <p>Your bag items are still saved, so you can safely return to your cart and attempt the payment again. If the amount was deducted from your account, it will be refunded automatically by your payment provider.</p>
            <p>Please feel free to contact us if you need any assistance completing your checkout.</p>
            <p style="margin-top: 30px;">Warm regards,<br /><strong>Saanjh Studio</strong></p>
          </div>
        `;

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: "Saanjh Studio <onboarding@resend.dev>",
          to: email,
          subject: subject,
          html: htmlContent,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn("Resend email delivery failed:", errText);
        return { success: false, error: errText };
      }

      return { success: true };
    } catch (e: any) {
      console.error("Failed to send order email:", e);
      return { success: false, error: e.message || "Failed to deliver email." };
    }
  });
