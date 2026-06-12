import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerConfig } from "../../src/lib/config.server";

export const subscribeToNewsletter = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string().email() }))
  .handler(async ({ data: { email } }) => {
    const config = getServerConfig();
    const apiKey = config.resendApiKey;

    if (!apiKey) {
      console.error("RESEND_API_KEY is not configured in .env file.");
      return { success: false, error: "Newsletter service is temporarily unavailable." };
    }

    try {
      // 1. Send notification email to saanjhvibe@gmail.com
      const adminResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: "Saanjh Studio <onboarding@resend.dev>",
          to: "saanjhvibe@gmail.com",
          subject: "New 10% Off Discount Request",
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>New Newsletter Subscription</h2>
              <p>A new visitor has subscribed to the newsletter and requested a 10% discount code.</p>
              <p><strong>Subscriber Email:</strong> ${email}</p>
            </div>
          `,
        }),
      });

      // 2. Send email to the subscriber with the 10% discount code
      const subResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: "Saanjh Studio <onboarding@resend.dev>",
          to: email,
          subject: "Your 10% Discount Code — Saanjh",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333333;">
              <h1 style="font-family: serif; color: #b0925a; font-size: 28px; margin-bottom: 20px;">Welcome to Saanjh</h1>
              <p>Thank you for joining the Saanjh list.</p>
              <p>Use code <strong style="font-size: 18px; color: #b0925a; background: #faf8f5; padding: 4px 8px; border-radius: 4px; border: 1px dashed #b0925a; display: inline-block; margin: 10px 0;">SAANJH10</strong> at checkout to enjoy <strong>10% off</strong> your first order of hand-poured candles and gold-plated jewellery.</p>
              <p style="margin-top: 30px;">Warm regards,<br /><strong>Saanjh Studio</strong></p>
            </div>
          `,
        }),
      });

      const adminOk = adminResponse.ok;
      const subOk = subResponse.ok;

      if (!adminOk || !subOk) {
        const adminText = await adminResponse.text();
        const subText = await subResponse.text();
        console.warn("Resend API partially failed or returned error:", {
          adminStatus: adminResponse.status,
          adminText,
          subStatus: subResponse.status,
          subText,
        });

        // Note: On Resend's free tier with unverified domains, sending to anyone outside the owner's email fails with 403.
        // If we successfully notified saanjhvibe@gmail.com, we consider this a partial success for local testing.
        if (adminOk) {
          return {
            success: true,
            warning: "Note: Since your domain is not verified on Resend, emails can currently only be sent to the account owner (saanjhvibe@gmail.com). Verify your domain in the Resend dashboard to send emails to all subscribers.",
          };
        }

        return { success: false, error: "Failed to send subscription emails." };
      }

      return { success: true };
    } catch (e) {
      console.error("Newsletter API error:", e);
      return { success: false, error: "Failed to process subscription." };
    }
  });
