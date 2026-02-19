import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "./db"

export const { auth, handlers, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string)?.trim().toLowerCase()
        const password = credentials?.password as string

        if (!email || !password) return null

        const user = await db.user.findUnique({ where: { email } })
        if (!user?.passwordHash) return null

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        }
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      if (user?.id && user?.email) {
        const email = user.email.toLowerCase()
        const pendingInvitations = await db.teamInvitation.findMany({
          where: { email, status: "PENDING" },
        })
        for (const invitation of pendingInvitations) {
          const alreadyMember = await db.teamMember.findUnique({
            where: {
              teamId_userId: { teamId: invitation.teamId, userId: user.id },
            },
          })
          if (!alreadyMember) {
            await db.teamMember.create({
              data: {
                teamId: invitation.teamId,
                userId: user.id,
                role: "MEMBER",
                dedicationPct: invitation.dedicationPct,
              },
            })
          }
          await db.teamInvitation.update({
            where: { id: invitation.id },
            data: { status: "ACCEPTED" },
          })
        }
      }
    },
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
