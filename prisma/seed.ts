import Prisma, {PrismaClient} from "@prisma/client";
import * as crypto from "crypto";
import MessageEncryptService from "../src/utils/message_encrypt_service";
import prisma_instance from "../src/utils/prisma_instance";

(async()=>{
  await prisma_instance.roles.createMany({
    data: [
      {name:"admin", label: "Admin"},
      {name:"bot", label:"Bot"},
      {name:"be", label:"Bénévole"},
      {name:"be_ref", label:"Bénévole Référent"},
    ]
  })
  await prisma_instance.accounts.createMany({
    data: [
      //Evidement, il ne faut pas utiliser ce compte en prod
      {name:"admin", password: crypto.createHash("sha512").update("password").digest("base64"), role_id: 1, tel: "0123456789" },
      {name:"be", password: crypto.createHash("sha512").update("password").digest("base64"), role_id: 3, tel: "0123456789" },
      {name:"be_ref", password: crypto.createHash("sha512").update("password").digest("base64"), role_id: 4, tel: "0123456789" },
      {name:"bot", password: crypto.createHash("sha512").update("password").digest("base64"), role_id: 2, tel: "" }
    ]
  })
  await prisma_instance.listen_status.createMany({
    data: [
      {name:"waiting", label: "En attente" },
      {name:"started", label: "Démarrée" },
      {name:"closed", label: "Fermée" },
      {name:"commented", label: "Commentée" },
    ]
  })
  
  await prisma_instance.listens.createMany({
    data: [
      {user_discord_id_encrypted: MessageEncryptService.encrypt("1234"), user_age_encrypted: MessageEncryptService.encrypt("majeur"), main_subject_encrypted: MessageEncryptService.encrypt("problème santé"), date_time_start: new Date().toISOString(), is_user_minor: false, listen_status_id:2},
      {user_discord_id_encrypted: MessageEncryptService.encrypt("1234"), user_age_encrypted: MessageEncryptService.encrypt("mineur"), main_subject_encrypted: MessageEncryptService.encrypt("problème santé 2"), date_time_start: new Date().toISOString(), is_user_minor: true, listen_status_id:1},
      {user_discord_id_encrypted: MessageEncryptService.encrypt("1234"), user_age_encrypted: MessageEncryptService.encrypt("mineur"), main_subject_encrypted: MessageEncryptService.encrypt("problème santé 2"), date_time_start: new Date().toISOString(), is_user_minor: true, listen_status_id:3},
      {user_discord_id_encrypted: MessageEncryptService.encrypt("1234"), user_age_encrypted: MessageEncryptService.encrypt("mineur"), main_subject_encrypted: MessageEncryptService.encrypt("problème santé 2"), date_time_start: new Date().toISOString(), is_user_minor: true, listen_status_id:4},
    ]
  })

  await prisma_instance.calendar_events.createMany({
    data: [
      {
        subject: "test",
        date_start: new Date().toISOString(),
        date_end: null,
        daily_time_start: new Date().toISOString(),
        daily_time_end: new Date().toISOString(),
        creator_id: 1
      },
  ]
  })
})()
