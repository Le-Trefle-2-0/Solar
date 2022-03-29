import {PrismaClient} from "@prisma/client";
import * as crypto from "crypto";
import connect from "next-connect";
import validator from "../../../src/middlewares/validator";
import Joi from "joi";
import { sign } from "jsonwebtoken";
import session, { sessionAccountWithRoles } from "../../../src/interfaces/session";

const schema = Joi.object({
  name: Joi.string().required(),
  password: Joi.string().required()
})

export default connect().post(validator({body: schema}), async (req, res) => {
  const prisma = new PrismaClient();

  let acc = await prisma.accounts.findFirst({
    where: {
      password: crypto.createHash("sha512").update(req.body.password).digest("base64"),
      name: req.body.name
    },
    include: {
      roles: true
    }
  }) as sessionAccountWithRoles ;
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

  prisma.$disconnect();
});
