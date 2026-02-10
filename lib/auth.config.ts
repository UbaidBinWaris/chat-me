import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                emailOrUsername: { label: 'Email or Username', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.emailOrUsername || !credentials?.password) {
                    throw new Error('Please enter your email/username and password')
                }

                // Find user by email or username
                const user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: credentials.emailOrUsername },
                            { username: credentials.emailOrUsername },
                        ],
                    },
                })

                if (!user || !user.password) {
                    throw new Error('Invalid credentials')
                }

                // Verify password
                const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

                if (!isPasswordValid) {
                    throw new Error('Invalid credentials')
                }

                // Return user object (will be stored in JWT)
                return {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    image: user.image,
                    bio: user.bio,
                    phoneNumber: user.phoneNumber,
                }
            },
        }),
    ],
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: '/',
        error: '/',
    },
    callbacks: {
        async jwt({ token, user }) {
            // Add user info to JWT token on sign in
            if (user) {
                token.id = user.id
                token.username = (user as any).username
                token.image = (user as any).image
                token.bio = (user as any).bio
                token.phoneNumber = (user as any).phoneNumber
                token.email = user.email
            }
            return token
        },
        async session({ session, token }) {
            // Add user info to session from JWT token
            if (token && session.user) {
                // Fetch fresh user data from database to ensure updates are reflected immediately
                const userId = token.id as string || token.sub as string;

                if (userId) {
                    const freshUser = await prisma.user.findUnique({
                        where: { id: userId }
                    });

                    if (freshUser) {
                        (session.user as any).id = freshUser.id;
                        (session.user as any).username = freshUser.username;
                        session.user.image = freshUser.image;
                        (session.user as any).bio = freshUser.bio;
                        (session.user as any).phoneNumber = freshUser.phoneNumber;
                        session.user.email = freshUser.email;
                    }
                }
            }
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
}
