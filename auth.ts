import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Discord from "next-auth/providers/discord"
import * as crypto from "crypto";
import { TOTP } from "totp-generator";
import { ZodError } from "zod";
import { signInSchema } from "@/src/utils/zodValidation";
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma";
 
export const { handlers, signIn, signOut, auth } = NextAuth({
    // adapter: PrismaAdapter(prisma),
    providers: [
        // Discord
        Credentials({
            credentials: {
                email: {},
                password: {},
                otptoken: {}
            },
            authorize: async (credentials) => {
                try {
                    let user = null;

                    const { email, password } = await signInSchema.parseAsync(credentials)

                    let hashed = crypto.createHash('sha512').update(password).digest('base64')

                    user = await fetch('http://localhost:3000/api/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            email,
                            password,
                            otptoken: credentials?.otptoken
                        })
                    }).then(res => res.json())
        
                    if (!user) {
                        throw new Error('Invalid credentials')
                    } else if (user && user.otp_enabled) {
                        const otp = TOTP.generate(user.otp_token || '');
                        if (otp.otp == credentials?.otptoken) {
                            return user;
                        } else {
                            throw new Error('Invalid 2FA code')
                        }
                    }
                     
        
                    return user;
                } catch (e) {
                    if (e instanceof ZodError) {
                        return null;
                    }
                }
            }
        })
    ],
    pages: {
        signIn: '/auth/login',
    }
})