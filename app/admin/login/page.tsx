import { loginAction, isAdmin } from "@/lib/admin-auth-server"
import { redirect } from "next/navigation"
import { AdminLoginForm } from "./admin-login-form"

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin")

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Admin login
        </h1>
        <AdminLoginForm loginAction={loginAction} />
      </div>
    </div>
  )
}
