import connect from "next-connect";
import checkJWT, { NextApiRequestWithUser } from "../../../src/middlewares/checkJWT";
import prisma_instance from "../../../src/utils/prisma_instance";

export default connect().post(checkJWT, async (req: NextApiRequestWithUser, res) => {
    // if (!req.session.user.is_bot) {
    //     res.status(403).send("forbidden")
    //     return;
    // }

    let newListen: any = await prisma_instance.listens.create({
        data: req.body
    });
    
    res.status(200).send(newListen);
});