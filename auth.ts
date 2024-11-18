import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import * as crypto from "crypto";
import prisma_instance from "@/utils/prisma_instance";
import { TOTP } from "totp-generator";
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
        credentials: {
            email: {},
            password: {},
            otptoken: {}
        },
        authorize: async (credentials) => {
            let password = crypto.createHash('sha512').update(credentials?.password || "").digest('base64')
            let user = await prisma_instance.accounts.findFirst({
                where: {
                    email: credentials?.email,
                    password: password
                }
            });

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
        }
    })
  ],
})