import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import db from '@/libs/db'
import bcrypt from 'bcrypt'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password", placeholder: "*****" },
      },
      async authorize(credentials, req) {
        console.log(credentials)

        const userFound = await db.user.findUnique({
            where: {
                email: credentials.email
            }
        })

        if (!userFound) throw new Error('No user found')

        console.log("userfound",userFound)

        const matchPassword = await bcrypt.compare(credentials.password, userFound.password)

        if (!matchPassword) throw new Error('Wrong password')

        return {
            id: userFound.id,
            name: userFound.username,
            email: userFound.email,
            role: userFound.role,
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
    signOut: '/auth/signout'
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
