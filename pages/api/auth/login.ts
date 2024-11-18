import cryptoJS from "crypto-js";
import Base64 from 'crypto-js/enc-base64';
import { sign } from "jsonwebtoken";
import { TOTP } from "totp-generator";
import session, { sessionAccountWithRoles } from "../../../src/interfaces/session";
import prisma_instance from "../../../src/utils/prisma_instance";
import { object, string } from "yup";
import checkSchema from "../../../src/middlewares/checkSchema";
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import SuperJSON from "superjson";

export type NextApiRequestWithUser = NextApiRequest & {session: session};
const router = createRouter<NextApiRequestWithUser, NextApiResponse>();

const schema = object({
  email: string().required(),
  password: string().required(),
  otp: string().optional()
});

router.post(async (req, res) => {
  if (req.body.json) {
    req.body = req.body.json;
  }
  checkSchema({body: schema})(req, res, async () => {});

  let fullAccount = await prisma_instance.accounts.findFirst({
    where: {
      password: Base64.stringify(cryptoJS.SHA512(req.body.password)),
      email: req.body.email
    },
    include: {
      roles: true
    }
  });

  let acc = fullAccount as sessionAccountWithRoles;

  if(acc){
    delete acc.password;
    acc.otp_token = null;

    if (req.body.otp && fullAccount?.otp_token) {
      const { otp, expires } = TOTP.generate(fullAccount.otp_token);
      if (otp === req.body.otp) {
        res.status(200).send({
          jwt: sign(
            JSON.parse(SuperJSON.stringify(acc)),
            process.env.JWT_SECRET || "secret",
            {expiresIn: "1d"}
          ),
          otp: false,
          user: JSON.parse(SuperJSON.stringify(acc))
        } as session);
      } else {
        res.status(401).send("invalid credentials");
      }
    } else if (acc.otp_enabled) {
      res.status(200).send({
        jwt: null,
        otp: true,
        user: acc
      } as session);
    } else {
      res.status(200).send({
        jwt: sign(
          JSON.parse(SuperJSON.stringify(acc)),
          process.env.JWT_SECRET || "secret",
          {expiresIn: "1d"}
        ),
        otp: false,
        user: JSON.parse(SuperJSON.stringify(acc))
      } as session);
    }
  } else {
    res.status(401).json({ error: "invalid credentials"})
  }
});

export default router.handler({
    onError: (err: any, req, res) => {
        console.error(err.stack);
        res.status(err.statusCode || 500).end(err.message);
    },
});
