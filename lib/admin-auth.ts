import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createHmac } from "crypto"

const COOKIE_NAME = "admin_session"
const COOKIE_PATH = "/admin"

function getAdminToken(): string | null {
  const secret = process.env.ADMIN_PASSWORD
  if (!secret) return null
  return createHmac("sha256", secret).update("admin").digest("hex")
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const expected = getAdminToken()
  return !!expected && token === expected
}

export async function requireAdmin() {
  const ok = await isAdmin()
  if (!ok) redirect("/admin/login")
}

export async function loginAction(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const password = (formData.get("password") as string)?.trim()
  const expected = process.env.ADMIN_PASSWORD

  if (!expected) {
    return { error: "Admin is not configured." }
  }

  if (!password) {
    return { error: "Password is required." }
  }

  if (password !== expected) {
    return { error: "Invalid password." }
  }

  const token = getAdminToken()
  if (!token) return { error: "Admin is not configured." }

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: COOKIE_PATH,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  redirect("/admin")
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  redirect("/admin/login")
}
