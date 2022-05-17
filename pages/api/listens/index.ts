import connect from "next-connect";
import checkJWT, { NextApiRequestWithUser } from "../../../src/middlewares/checkJWT";
import { Prisma } from "@prisma/client";
import { ListenWithStatus } from "../../../src/interfaces/listens";
import { filterSchema, postSchema } from "../../../src/schemas/listensSchemas";
import prisma_instance from "../../../src/utils/prisma_instance";
import checkSchema from "../../../src/middlewares/checkSchema";


export function getListens(filter?:Prisma.listensWhereInput, includes?: Prisma.listensInclude ) : Promise<ListenWithStatus[]> {
  return prisma_instance.listens.findMany({include:includes, where: filter, orderBy: includes?.account_listen ? {account_listen: {_count: "asc"}} : undefined }).then((v)=>{
    return v as ListenWithStatus[];
  });
}

/*
rappel: events sont lies a des user. les écoutes ont 4 états: en attente, démarrée, fermée, commentée
bénévole, récupère toutes les écoutes qui lui sont attribuées sauf celles commentées
bénévole ref, récupère toutes les écoutes de tous les utilisateurs ayant rejoint la même permanence que lui mis à part les écoutes fermées / commentées
admin, comme le bénévole référent
bot, peut avoir toutes les écoutes en cours sans distinctions ouvertes

getActualEvents(event_id) a ajouter dans events/index
démarche exemple pour le bénévole référent getActualEvent(user.id)
users.getAll({with:{event:{id:actualEvent.id}}}) listens uniquement ouvertes

*/

export default connect().get(checkJWT, checkSchema({query: filterSchema}), async (req: NextApiRequestWithUser, res) => {
  console.log(req.session.user.roles.label)
  
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
.post(checkJWT, checkSchema({body: postSchema}), async (req: NextApiRequestWithUser, res) => {
  req.body.date_time_start = new Date(req.body.date_time_start);
  await prisma_instance.listens.create({data: req.body});
  res.status(201).send(req.body);
})
