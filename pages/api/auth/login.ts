import cryptoJS from "crypto-js";
import Base64 from 'crypto-js/enc-base64';
import connect from "next-connect";
import { sign } from "jsonwebtoken";
import totp from "totp-generator";
import session, { sessionAccountWithRoles } from "../../../src/interfaces/session";
import prisma_instance from "../../../src/utils/prisma_instance";
import { object, string } from "yup";
import checkSchema from "../../../src/middlewares/checkSchema";

const schema = object({
  email: string().required(),
  password: string().required(),
  otp: string().optional()
});

export default connect().post(checkSchema({body: schema}), async (req, res) => {
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
      if (totp(fullAccount.otp_token) === req.body.otp) {
        res.status(200).send({
          jwt: sign(
            acc,
            process.env.JWT_SECRET || "secret",
            {expiresIn: "1d"}
          ),
          otp: false,
          user: acc
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
          acc,
          process.env.JWT_SECRET || "secret",
          {expiresIn: "1d"}
        ),
        otp: false,
        user: acc
      } as session);
    }
  }else{
    res.status(401).send("invalid credentials")
  }
});
