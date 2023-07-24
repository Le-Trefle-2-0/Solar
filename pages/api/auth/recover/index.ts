import connect from "next-connect";
import { generate } from 'rand-token';
import nodemailer from "nodemailer";
import prisma_instance from "../../../../src/utils/prisma_instance";
import { object, string } from "yup";
import checkSchema from "../../../../src/middlewares/checkSchema";

const schema = object({
  email: string().required()
})

export default connect().post(checkSchema({body: schema}), async (req, res) => {
    let acc = await prisma_instance.accounts.findFirst({
        where: {
            email: req.body.email
        }
    });
    if (acc) {
        let token = generate(64);
        acc.recovery_token = token;
        await prisma_instance.accounts.update({
            where: {
                id: acc.id
            },
            data: {
                recovery_token: token
            }
        });

        let transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: false,
            auth: {
                user: process.env.SMTP_USERNAME,
                pass: process.env.SMTP_PASSWORD
            }
        });

        await transporter.sendMail({
            from: '"Solar" <noreply@letrefle.org>',
            to: req.body.email,
            subject: 'Récupération de mot de passe',
            html: `
            <h1>Récupération de mot de passe</h1>
            <p>Vous avez demandé une réinitialisation de votre mot de passe.</p>
            <p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce mail.</p>
            <p>Si vous êtes à l'origine de cette demande, cliquez sur le lien suivant pour réinitialiser votre mot de passe : <a href="${process.env.FRONTEND_URL}/auth/recover/${token}">${process.env.FRONTEND_URL}/auth/recover/${token}</a></p>
            `
        }).then((info) => {
            res.status(200);
        }).catch((err) => {
            console.log(err)
            res.status(500);
        });

    } else {
        res.status(200);
    }
});
