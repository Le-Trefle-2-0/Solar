import connect from "next-connect";
import checkJWT, { NextApiRequestWithUser } from "../../../src/middlewares/checkJWT";
import { Prisma } from "@prisma/client";
import { ListenWithStatus } from "../../../src/interfaces/listens";
import { filterSchema, postSchema } from "../../../src/schemas/listensSchemas";
import prisma_instance from "../../../src/utils/prisma_instance";
import checkSchema from "../../../src/middlewares/checkSchema";

export async function getRoles(){
    return await prisma_instance.roles.findMany();
}

export default connect().get(checkJWT, async (req, res) => {
    res.status(200).send(await getRoles());
  })