import connect from "next-connect";
import checkJWT, { NextApiRequestWithUser } from "../../../../src/middlewares/checkJWT";
import {Prisma, PrismaClient} from "@prisma/client";
import { assignSchema } from "../../../../src/schemas/listensSchemas";
import PrismaInstance from "../../../../src/utils/prisma_instance";
import prisma_instance from "../../../../src/utils/prisma_instance";
import { setQuery } from "../../../../src/utils/helper";
import checkSchema from "../../../../src/middlewares/checkSchema";

export default connect().put(checkJWT, checkSchema({body: assignSchema}), async (req: NextApiRequestWithUser, res) => {
    if(!["be_ref", "admin"].includes(req.session.user.roles.name)) {
        res.status(403).send("unauthorized");
        return;
    }
    await prisma_instance.listens.update({
        where: {id: parseInt(req.query.id as string)},
        data: {account_listen:{set: []}}
    });
    await prisma_instance.listens.update({
        where: {id: parseInt(req.query.id as string)},
        data: {
            account_listen:{
                connect: req.body.account_ids.map((id: number) => ({id: id}))
            }
        }
    });
    res.status(204).send(req.body);
})