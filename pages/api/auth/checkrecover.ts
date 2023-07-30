import connect from "next-connect";
import { generate } from 'rand-token';
import nodemailer from "nodemailer";
import prisma_instance from "../../../src/utils/prisma_instance";
import { object, string } from "yup";
import checkSchema from "../../../src/middlewares/checkSchema";

const schema = object({
  token: string().required()
})

export default connect().get(checkSchema({query: schema}), async (req, res) => {
    let acc = await prisma_instance.accounts.findFirst({
        where: {
            recovery_token: req.query.token as string
        }
    });
    if (acc) {
        res.status(200).send(acc.name);
    } else {
        res.status(404);
    }
});
