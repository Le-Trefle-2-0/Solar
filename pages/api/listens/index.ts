import connect from "next-connect";
import checkJWT, { NextApiRequestWithUser } from "../../../src/middlewares/checkJWT";
import {listens, listen_status, Prisma, PrismaClient} from "@prisma/client";
import validator from "../../../src/middlewares/validator";
import { promises } from "dns"; 
import { ListenWithStatus } from "../../../src/interfaces/listens";
import { filterSchema, postSchema } from "../../../src/schemas/listensSchemas";


export function getListens(filter?:Prisma.listensWhereInput) : Promise<ListenWithStatus[]> {
  const prisma = new PrismaClient();
  return prisma.listens.findMany({include:{listen_status:true}, where: filter}).then((v)=>{
    prisma.$disconnect(); return v as ListenWithStatus[];
  });
}

export default connect().get(checkJWT, validator(filterSchema), async (req, res) => {
  let filter = {
    NOT: {
      listen_status: {
        name: req.query.not_done ? "commented" : ""
      }
    }
  } as Prisma.listensWhereInput;
  res.status(200).send(await getListens(filter));
})
.post(checkJWT, validator({body: postSchema}), async (req: NextApiRequestWithUser, res) => {
  req.body.date_time_start = new Date(req.body.date_time_start);
  const prisma = new PrismaClient();
  await prisma.listens.create({data: req.body});
  res.status(201).send(req.body);
  prisma.$disconnect();
})
