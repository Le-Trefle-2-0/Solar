import connect from "next-connect";
import checkJWT from "../../../src/middlewares/checkJWT";
import prisma_instance, { exclude } from "../../../src/utils/prisma_instance";
import checkSchema from "../../../src/middlewares/checkSchema";
import { postSchema } from './../../../src/schemas/account';
import * as crypto from "crypto";
import { object, string } from "yup";

const schema = object({
  password: string().required(),
  token: string().required()
})

export default connect().post(checkSchema({body: schema}), async (req, res) => {
    let acc = await prisma_instance.accounts.findFirst({
        where: {
            recovery_token: req.body.token
        }
    });

    if (!acc) {
        res.status(404).send("not found");
        return;
    }

    acc.recovery_token = null;
    acc.password = crypto.createHash("sha512").update(req.body.password).digest("base64")
    await prisma_instance.accounts.update({
        where: {
            id: acc.id
        },
        data: acc
    });
    res.status(200).send("done");
})