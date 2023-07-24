import connect from "next-connect";
import { generate } from 'rand-token';
import nodemailer from "nodemailer";
import prisma_instance from "../../../src/utils/prisma_instance";
import { object, string } from "yup";
import checkSchema from "../../../src/middlewares/checkSchema";

const schema = object({
  token: string().required()
})

export default connect().post(checkSchema({body: schema}), async (req, res) => {
    console.log('check recovery')
    let acc = await prisma_instance.accounts.findFirst({
        where: {
            recovery_token: req.body.token
        }
    });
    if (acc) {
        res.status(200).send(acc.name);
    } else {
        res.status(404);
    }
});
