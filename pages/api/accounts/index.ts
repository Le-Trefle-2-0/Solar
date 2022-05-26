import connect from "next-connect";
import checkJWT from "../../../src/middlewares/checkJWT";
import prisma_instance, { exclude } from "../../../src/utils/prisma_instance";
import checkSchema from "../../../src/middlewares/checkSchema";
import { postSchema } from './../../../src/schemas/account';
import * as crypto from "crypto";

export default connect().get(checkJWT, async (req, res) => {
    if(!req.session.user.is_admin) {
        res.status(403).send("forbidden")
        return;
    }
    res.status(200).send((await prisma_instance.accounts.findMany({include:{roles:true}})).map(a=>exclude(a, "password")));
}).post(checkJWT, checkSchema({body: postSchema}), async (req, res) => {
    if(!req.session.user.is_admin) {
        res.status(403).send("forbidden")
        return;
    }
    let acc = req.body;
    acc.password =  crypto.createHash("sha512").update(acc.password).digest("base64")
    await prisma_instance.accounts.create({data: acc});
    res.status(200).send("done");
})