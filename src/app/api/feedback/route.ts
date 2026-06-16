import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.163.com",
  port: 465,
  secure: true,
  auth: {
    user: "bmmdyx@163.com",
    pass: "GNUDUvhuVeviTMNH",
  },
});

export async function POST(req: Request) {
  try {
    const { text, url, userAgent } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ ok: false, error: "Empty feedback" }, { status: 400 });
    }
    await transporter.sendMail({
      from: "bmmdyx@163.com",
      to: "bmmdyx@163.com",
      subject: "[OpticsKit Feedback] New feedback",
      text: "New feedback from OpticsKit:\n\nContent:\n" + text + "\n\nPage:\n" + (url || "unknown") + "\n\nUA: " + (userAgent || "unknown"),
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Feedback error:", err);
    return NextResponse.json({ ok: false, error: "send failed" }, { status: 500 });
  }
}
