import connect from "next-connect";
import checkJWT from "../../../src/middlewares/checkJWT";
import prisma_instance, { exclude } from "../../../src/utils/prisma_instance";
import checkSchema from "../../../src/middlewares/checkSchema";
import { putSchema } from './../../../src/schemas/account';
import * as crypto from "crypto";

export default connect().delete(checkJWT, async (req, res) => {
    if(!req.session.user.is_admin) {
        res.status(403).send("forbidden")
        return;
    }
    await prisma_instance.accounts.delete({where:{id:parseInt(req.query.id as string)}});
    res.status(200).send("done");
}).put(checkJWT, checkSchema({body: putSchema}), async (req, res) => {
    if(!req.session.user.is_admin) {
        res.status(403).send("forbidden")
        return;
    }
    let acc = req.body;
    if(acc.password) {
        acc.password =  crypto.createHash("sha512").update(acc.password).digest("base64")
    } else {
        delete acc.password
    }
    await prisma_instance.accounts.update({where:{id:parseInt(req.query.id as string)}, data: acc});
    res.status(200).send("done");
})