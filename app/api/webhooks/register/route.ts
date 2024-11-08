import { headers } from "next/headers";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const webhook_secret = process.env.WEBHOOK_SECRET;

  if (!webhook_secret) {
    return new Response("Webhook secret not set", { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(webhook_secret);
  let e: WebhookEvent;

  try {
    e = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    return new Response("Invalid signature", { status: 400 });
  }

  const eventType = e.type;

  if (eventType === "user.created") {
    try {
      const { email_addresses, primary_email_address_id } = e.data;
      const primaryEmail = email_addresses.find(
        (email) => email.id === primary_email_address_id
      );

      if (!primaryEmail) {
        return new Response("Primary email not found", { status: 400 });
      }

      await prisma.user.create({
        data: {
          id: e.data.id!,
          email: primaryEmail.email_address,
          isSubscribed: false,
        },
      });
    } catch (error) {
      return new Response("Error creating user", { status: 500 });
    }
  }

  return new Response("Webhook received", { status: 200 });
}
