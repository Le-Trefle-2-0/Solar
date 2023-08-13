import connect from "next-connect";
import checkJWT from "../../../src/middlewares/checkJWT";
import prisma_instance from "../../../src/utils/prisma_instance";

export default connect().post(checkJWT, async (req, res) => {
    let acc = await prisma_instance.accounts.findFirst({ where: { id: req.body.userID } });
    if (!acc) {
        res.status(401).send("invalid credentials");
    } else if (acc.otp_enabled) {
        await prisma_instance.accounts.update({ where: { id: req.body.userID }, data: { otp_enabled: false, otp_token: null } });
        res.status(200).send("2fa disabled");
    } else {
        res.status(304).send("2fa not enabled");
    }
});