import connect from "next-connect";
import checkJWT from "../../../src/middlewares/checkJWT";

export default connect().get(checkJWT, (req, res) => {
    res.status(200).send("valid");
});