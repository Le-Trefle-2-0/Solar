import connect from "next-connect";
import checkJWT, { NextApiRequestWithUser } from "../../../src/middlewares/checkJWT";
import { Prisma } from "@prisma/client";
import { ListenWithStatus } from "../../../src/interfaces/listens";
import { filterSchema, postSchema } from "../../../src/schemas/listensSchemas";
import prisma_instance from "../../../src/utils/prisma_instance";
import checkSchema from "../../../src/middlewares/checkSchema";
import moment from "moment";



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
  let todayDate = new Date();
  let hourTimeStamp = todayDate.getHours() * 60 * 60 * 1000 + todayDate.getMinutes() * 60 * 1000;
  let todayHour = new Date(hourTimeStamp)
  todayDate.setHours(- todayDate.getTimezoneOffset() / 60);
  todayDate.setMinutes(0);
  todayDate.setSeconds(0);
  todayDate.setMilliseconds(1);
  let yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  console.log(yesterdayDate);

  let filter: Prisma.listensWhereInput = {
    NOT: {
      listen_status: {
        name: req.query.not_done ? "commented" : ""
      },
    },
  }

  let include : Prisma.listensInclude = {
    account_listen: {
      include:{
        accounts: true
      }
    }
  }

  let calendarEventForUser = await prisma_instance.calendar_events.findFirst({
    where:{
      account_calendar_event:{
        some:{
          accounts:{
            id: req.session.user.id
          }
        }
      },
      date_start: {lte: todayDate},
      daily_time_start: {lte: todayHour},
      OR:[
        {date_start: {gte: yesterdayDate}},
        {date_end: {gte: todayDate}}
      ],
      daily_time_end: {gte: todayHour},
    }
  })

  console.log(calendarEventForUser?.id);

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
  console.log(filter);
  let listens = await getListens(
    filter,
    req.query.with_users ? {...include, listen_status: true } : { listen_status: true }
  )
  console.log("l",listens);
  res.status(200).send(listens);
})
.post(checkJWT, checkSchema({body: postSchema}), async (req: NextApiRequestWithUser, res) => {
  req.body.date_time_start = new Date(req.body.date_time_start);
  await prisma_instance.listens.create({data: req.body});
  res.status(201).send(req.body);
})
