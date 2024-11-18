import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import * as crypto from "crypto";
import prisma_instance from "@/utils/prisma_instance";
import { TOTP } from "totp-generator";
import { ZodError } from "zod";
import { signInSchema } from "@/utils/zodValidation";
import { error } from "console";
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
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
                user = await prisma_instance.accounts.findFirst({
                    where: {
                        email: email,
                        password: hashed
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
            } catch (e) {
                if (error instanceof ZodError) {
                    return null;
                }
            }
        }
    })
  ],
})