import Prisma, {PrismaClient} from "@prisma/client";
import * as crypto from "crypto";

(async()=>{
  const prisma = new PrismaClient();

  await prisma.roles.createMany({
    data: [
      {name:"admin", label: "Admin"},
      {name:"be", label:"Bénévole"},
      {name:"be_ref", label:"Bénévole Référent"},
    ]
  })
  await prisma.accounts.createMany({
    data: [
      //Evidement, il ne faut pas utiliser ce compte en prod
      {name:"admin", password: crypto.createHash("sha512").update("VDnITtW2tTTUmqO1cUDt&pVZ!sbJSdEe3V2gqMMp").digest("base64"), role_id: 1, tel: "0123456789" }
    ]
  })
  await prisma.listen_status.createMany({
    data: [
      {name:"waiting", label: "En attente" },
      {name:"started", label: "Démarrée" },
      {name:"closed", label: "Fermée" },
      {name:"commented", label: "Commentée" },
    ]
  })
  
  await prisma.listens.createMany({
    data: [
      {user_discord_id_encrypted: "AB", user_age_encrypted: "CD", main_subject_encrypted: "EF", date_time_start: new Date().toDateString(), is_user_minor: false, listen_status_id:2},
      {user_discord_id_encrypted: "GH", user_age_encrypted: "IJ", main_subject_encrypted: "KL", date_time_start: new Date().toDateString(), is_user_minor: false, listen_status_id:1},
    ]
  })
  
  prisma.$disconnect();
})()
