import cryptoJS from "crypto-js";
import Base64 from 'crypto-js/enc-base64';
import connect from "next-connect";
import { sign } from "jsonwebtoken";
import session, { sessionAccountWithRoles } from "../../../src/interfaces/session";
import prisma_instance from "../../../src/utils/prisma_instance";
import { object, string } from "yup";
import checkSchema from "../../../src/middlewares/checkSchema";


const schema = object({
  name: string().required(),
  password: string().required()
})

export default connect().post(checkSchema({body: schema}), async (req, res) => {
  let acc = await prisma_instance.accounts.findFirst({
    where: {
      password: Base64.stringify(cryptoJS.SHA512(req.body.password)),
      email: req.body.email
    },
    include: {
      roles: true
    }
  }) as sessionAccountWithRoles;
  if(acc){
    delete acc.password;
    res.status(200).send({
      jwt: sign(
        acc,
        process.env.JWT_SECRET || "secret",
        {expiresIn: "1d"}
      ),
      user: acc
    } as session);
  }else{
    res.status(401).send("invalid credentials")
  }
});
