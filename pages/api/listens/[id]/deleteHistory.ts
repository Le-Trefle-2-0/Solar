import connect from "next-connect";
import checkJWT, { NextApiRequestWithUser } from "../../../../src/middlewares/checkJWT";
import prisma_instance from './../../../../src/utils/prisma_instance';

export default connect().delete(checkJWT, async (req: NextApiRequestWithUser, res) => {
    if(!req.session.user.is_admin) {
        res.status(403).send("forbidden")
        return;
    }
    let deleted_links = await prisma_instance.listen_message.findMany({where:{listen_id: parseInt(req.query.id as string)}})
    await prisma_instance.listen_message.deleteMany({where:{listen_id: parseInt(req.query.id as string)}})
    await prisma_instance.messages.deleteMany({where:{id:{in:deleted_links.map(dl=>dl.message_id)}}})
    
    res.status(201).end();
})