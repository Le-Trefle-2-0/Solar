import connect from "next-connect";
import checkJWT, { NextApiRequestWithUser } from "../../../src/middlewares/checkJWT";
import { Prisma } from "@prisma/client";
import validator from "../../../src/middlewares/validator";
import { ListenWithStatus } from "../../../src/interfaces/listens";
import { filterSchema, postSchema } from "../../../src/schemas/listensSchemas";
import prisma_instance from "../../../src/utils/prisma_instance";


export function getListens(filter?:Prisma.listensWhereInput, includes?: Prisma.listensInclude ) : Promise<ListenWithStatus[]> {
  return prisma_instance.listens.findMany({include:includes, where: filter, orderBy: includes?.account_listen ? {account_listen: {_count: "asc"}} : undefined }).then((v)=>{
    return v as ListenWithStatus[];
  });
}

export default connect().get(checkJWT, validator(filterSchema), async (req, res) => {
  let filter = {
    NOT: {
      listen_status: {
        name: req.query.not_done ? "commented" : ""
      },
    },
  } as Prisma.listensWhereInput;
  res.status(200).send(await getListens(
    filter,
    req.query.with_users ? { account_listen: { include: { accounts: true } }, listen_status: true } : { listen_status: true }
  ));
})
.post(checkJWT, validator({body: postSchema}), async (req: NextApiRequestWithUser, res) => {
  req.body.date_time_start = new Date(req.body.date_time_start);
  await prisma_instance.listens.create({data: req.body});
  res.status(201).send(req.body);
})
