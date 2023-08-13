import connect from "next-connect";
import checkJWT from "../../../src/middlewares/checkJWT";
import prisma_instance from "../../../src/utils/prisma_instance";
import totp from "totp-generator";
import checkSchema from "../../../src/middlewares/checkSchema";

export default connect().post(checkJWT, async (req, res) => {
    let acc = await prisma_instance.accounts.findFirst({ where: { id: req.body.userID } });
    if (!acc) {
        res.status(401).send("invalid credentials");
    } else if (acc.otp_enabled) {
        res.status(304).send("2fa already enabled");
    } else if (totp(req.body.token) == req.body.code) {
        await prisma_instance.accounts.update({ where: { id: req.body.userID }, data: { otp_enabled: true, otp_token: req.body.token } });
        res.status(200).send("done");
    } else {
        res.status(401).send("invalid otp code");
    }
});