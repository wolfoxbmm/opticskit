import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.163.com",
  port: 465,
  secure: true,
  auth: {
    user: "bmmdyx@163.com",
    pass: process.env.SMTP_PASS || "",
  },
});

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { text, url, userAgent } = await req.json();

    if (!text || text.trim().length === 0) {
      return new Response("Empty feedback", { status: 400 });
    }

    const mailOptions = {
      from: "bmmdyx@163.com",
      to: "bmmdyx@163.com",
      subject: `[OpticsKit 反馈] ${text.slice(0, 40)}`,
      text: `来自 OpticsKit 的新用户反馈：

📝 内容：
${text}

🔗 页面：
${url || "未知"}
`,
    };

    await transporter.sendMail(mailOptions);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Feedback send error:", err);
    return new Response(JSON.stringify({ ok: false, error: "发送失败，请稍后再试" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const config = {
  path: "/api/feedback",
};
