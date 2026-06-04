// app/api/admin/resend-invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { signIn } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // Verify user exists and is unverified
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.json(
      { error: "User already verified" },
      { status: 400 },
    );
  }

  // Trigger magic link via NextAuth
  try {
    await signIn("nodemailer", {
      email,
      redirect: false,
      callbackUrl: `${process.env.NEXTAUTH_URL}/competitions`,
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[resend-invite] error:", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
