import * as crypto from "crypto";
import MessageEncryptService from "../src/utils/message_encrypt_service";
import prisma_instance from "../src/utils/prisma_instance";


(async()=>{
  await prisma_instance.roles.createMany({
    data: [
      {name:"admin", label: "Admin"},
      {name:"bot", label:"Bot"},
      {name:"be", label:"Bénévole Écoutant"},
      {name:"be_ref", label:"Référent Bénévole Écoutant"},
      {name:"training", label:"Bénévole en Formation"},
    ]
  })
  await prisma_instance.accounts.createMany({
    data: [
      //Evidement, il ne faut pas utiliser ce compte en prod
      {name:"admin", password: crypto.createHash("sha512").update("password").digest("base64"), role_id: 1, email: "admin@letrefle.org" },
      {name:"be", password: crypto.createHash("sha512").update("password").digest("base64"), role_id: 3, email: "be@letrefle.org" },
      {name:"rbe", password: crypto.createHash("sha512").update("password").digest("base64"), role_id: 4, email: "rbe@letrefle.org" },
      {name:"bot", password: crypto.createHash("sha512").update("password").digest("base64"), role_id: 2, email: "bot@letrefle.org" },
      {name:"nbe", password: crypto.createHash("sha512").update("password").digest("base64"), role_id: 5, email: "nbe@letrefle.org" },
    ]
  })
  await prisma_instance.listen_status.createMany({
    data: [
      {name:"waiting", label: "Non-Assignée" },
      {name:"started", label: "En cours" },
      {name:"closed", label: "En attente de transmission" },
      {name:"commented", label: "Terminée" },
    ]
  })
  
  await prisma_instance.listens.createMany({
    data: [
      {user_discord_id_encrypted: MessageEncryptService.encrypt("1234"), user_age_encrypted: MessageEncryptService.encrypt("majeur"), main_subject_encrypted: MessageEncryptService.encrypt("problème santé"), date_time_start: new Date().toISOString(), is_user_minor: false, listen_status_id:2},
      {user_discord_id_encrypted: MessageEncryptService.encrypt("1234"), user_age_encrypted: MessageEncryptService.encrypt("mineur"), main_subject_encrypted: MessageEncryptService.encrypt("problème santé 2"), date_time_start: new Date().toISOString(), is_user_minor: true, listen_status_id:2},
      {user_discord_id_encrypted: MessageEncryptService.encrypt("1234"), user_age_encrypted: MessageEncryptService.encrypt("mineur"), main_subject_encrypted: MessageEncryptService.encrypt("problème santé 2"), date_time_start: new Date().toISOString(), is_user_minor: true, listen_status_id:2},
      {user_discord_id_encrypted: MessageEncryptService.encrypt("1234"), user_age_encrypted: MessageEncryptService.encrypt("mineur"), main_subject_encrypted: MessageEncryptService.encrypt("problème santé 2"), date_time_start: new Date().toISOString(), is_user_minor: true, listen_status_id:2},
    ]
  })

  await prisma_instance.event_types.createMany({
    data: [
      { name: "permanent", label: "Permanence" },
      { name: "formation", label: "Formation" },
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
        creator_id: 1,
        type_id: 1,
      },
  ]
  })
})()
