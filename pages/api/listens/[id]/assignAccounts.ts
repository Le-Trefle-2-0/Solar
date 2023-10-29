import connect from "next-connect";
import checkJWT, { NextApiRequestWithUser } from "../../../../src/middlewares/checkJWT";
import {Prisma, PrismaClient} from "@prisma/client";
import { assignSchema } from "../../../../src/schemas/listensSchemas";
import PrismaInstance from "../../../../src/utils/prisma_instance";
import prisma_instance from "../../../../src/utils/prisma_instance";
import { setQuery } from "../../../../src/utils/helper";
import checkSchema from "../../../../src/middlewares/checkSchema";

export default connect().put(checkJWT, checkSchema({body: assignSchema}), async (req: NextApiRequestWithUser, res) => {
    let listenId = parseInt(req.query.id as string);
    if(!req.session.user.is_ref) {
        res.status(403).send("forbidden")
        return;
    }
    await prisma_instance.listens.update({
        where: {id: listenId},
        data: {listen_status_id: 2}
    });
    await prisma_instance.account_listen.deleteMany({
        where: {listen_id: listenId},
    });
    await prisma_instance.account_listen.createMany({
        data: req.body.account_ids.map((id: number) => ({account_id: id, listen_id: listenId}))
    });
    res.status(204).end();
})