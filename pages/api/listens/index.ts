import connect from "next-connect";
import checkJWT, { NextApiRequestWithUser } from "../../../src/middlewares/checkJWT";
import { Prisma } from "@prisma/client";
import { ListenWithStatus } from "../../../src/interfaces/listens";
import { filterSchema, postSchema } from "../../../src/schemas/listensSchemas";
import prisma_instance from "../../../src/utils/prisma_instance";
import checkSchema from "../../../src/middlewares/checkSchema";
import moment from "moment";
import { getActiveEvent } from "../events/getActive";
import MessageEncryptService from './../../../src/utils/message_encrypt_service';



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

  if(req.query.for_transcript){
    if(!req.session.user.is_admin) {
      res.status(403).send("forbidden")
      return;
    }
    res.status(200).send(await getListens({listen_status:{name:{in:["commented","closed"]}}, listen_message:{some:{message_id:{gt:0}}}}))
    return;
  }

  let filter: Prisma.listensWhereInput = {
    listen_status: {
      name: {
        notIn: [
          ...(req.query.not_done ? ["commented"] : [])
        ]
      }
    },
  }

  let include : Prisma.listensInclude = {
    account_listen: {
      include:{
        accounts: true
      }
    }
  }

  let calendarEventForUser = await getActiveEvent(req.session.user.id);

  switch(req.session.user.roles.name){
    case 'admin':case 'be_ref':
      filter = {
        listen_status: {
          name: {
            notIn: ["commented", "closed"]
          }
        },
        OR: [
          {
            account_listen:{
              some:{
                accounts:{
                  OR:[
                    {
                      account_calendar_event:{
                        some:{
                          calendar_event_id: calendarEventForUser?.id
                        }
                      }
                    },
                    {
                      id: req.session.user.id
                    }
                  ]
                }
              }
            }
          },
          {
            account_listen:{
              every:{
                NOT:[
                  {
                    account_id:{
                      gt: 0
                    }
                  }
                ]
              }
            }
          }
        ]
      }
      break;
    case 'be':
      filter = {
        NOT: {
          listen_status: {
            name: "commented"
          },
        },
        account_listen:{
          some:{
            accounts:{
              id: req.session.user.id
            }
          }
        }
      };
  }
  let listens = await getListens(
    filter,
    req.query.with_users ? {...include, listen_status: true } : { listen_status: true }
  )
  res.status(200).send(listens);
})
.post(checkJWT, checkSchema({body: postSchema}), async (req: NextApiRequestWithUser, res) => {
  if(!req.session.user.is_bot) {
    res.status(403).send("forbidden")
    return;
  }
  if(req.body.user_discord_id_encrypted)req.body.user_discord_id_encrypted = MessageEncryptService.encrypt(req.body.user_discord_id_encrypted);
  if(req.body.main_subject_encrypted)req.body.main_subject_encrypted = MessageEncryptService.encrypt(req.body.main_subject_encrypted);
  req.body.date_time_start = new Date();
  await prisma_instance.listens.create({data: req.body});
  res.status(201).send(req.body);
})
