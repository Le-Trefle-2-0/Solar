"use client"

import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {authClient, signIn} from "@/lib/auth-client";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import {Fingerprint, Loader2} from "lucide-react";
import Link from "next/link";

export const locale = {
    "SLUG_DOES_NOT_MATCH": "Le slug ne correspond pas",
    "SLUG_REQUIRED": "Le slug de l'organisation est requis",
    "DELETE_ORGANIZATION_INSTRUCTIONS": "Entrez le slug de l'organisation pour continuer:",
    "DELETE_ORGANIZATION_SUCCESS": "Organisation supprimée avec succès",
    "DELETE_ORGANIZATION_DESCRIPTION": "Supprimez définitivement votre organisation et tout son contenu",
    "DELETE_ORGANIZATION": "Supprimer l'organisation",
    "INVITATION_EXPIRED": "Cette invitation a expiré",
    "REJECT": "Rejeter",
    "ACCEPT": "Accepter",
    "INVITATION_REJECTED": "Invitation rejetée avec succès",
    "INVITATION_ACCEPTED": "Invitation acceptée avec succès",
    "ACCEPT_INVITATION_DESCRIPTION": "Vous avez été invité à rejoindre une organisation.",
    "ACCEPT_INVITATION": "Accepter l'invitation",
    "INVITATION_CANCELLED": "Invitation annulée avec succès",
    "CANCEL_INVITATION": "Annuler l'invitation",
    "PENDING_INVITATIONS_DESCRIPTION": "Gérez les invitations en attente pour votre organisation.",
    "PENDING_INVITATIONS": "Invitations en attente",
    "SEND_INVITATION_SUCCESS": "Invitation envoyée avec succès",
    "SEND_INVITATION": "Envoyer une invitation",
    "MEMBER_ROLE_UPDATED": "Rôle du membre mis à jour avec succès",
    "UPDATE_ROLE": "Mettre à jour le rôle",
    "UPDATE_ROLE_DESCRIPTION": "Mettre à jour le rôle pour ce membre",
    "OWNER": "Propriétaire",
    "GUEST": "Invité",
    "MEMBER": "Membre",
    "ADMIN": "Administrateur",
    "SELECT_ROLE": "Sélectionner un rôle",
    "ROLE": "Rôle",
    "INVITE_MEMBER_DESCRIPTION": "Envoyer une invitation pour ajouter un nouveau membre à votre organisation.",
    "MEMBERS_INSTRUCTIONS": "Invitez de nouveaux membres à votre organisation.",
    "MEMBERS_DESCRIPTION": "Ajoutez ou supprimez des membres et gérez leurs rôles.",
    "MEMBERS": "Membres",
    "INVITE_MEMBER": "Inviter un membre",
    "REMOVE_MEMBER_SUCCESS": "Membre supprimé avec succès",
    "REMOVE_MEMBER_CONFIRM": "Êtes-vous sûr de vouloir supprimer ce membre de l'organisation?",
    "REMOVE_MEMBER": "Supprimer le membre",
    "MANAGE_ORGANIZATION": "Gérer l'organisation",
    "LEAVE_ORGANIZATION_SUCCESS": "Vous avez quitté l'organisation avec succès.",
    "LEAVE_ORGANIZATION_CONFIRM": "Êtes-vous sûr de vouloir quitter cette organisation?",
    "LEAVE_ORGANIZATION": "Quitter l'organisation",
    "ORGANIZATIONS_INSTRUCTIONS": "Créez une organisation pour collaborer avec d'autres utilisateurs.",
    "ORGANIZATIONS_DESCRIPTION": "Gérez vos organisations et vos adhésions.",
    "ORGANIZATIONS": "Organisations",
    "USER": "Utilisateur",
    "BY_CONTINUING_YOU_AGREE": "En continuant, vous acceptez les",
    "PROTECTED_BY_RECAPTCHA": "Ce site est protégé par reCAPTCHA.",
    "TERMS_OF_SERVICE": "Conditions d'utilisation",
    "PRIVACY_POLICY": "Politique de confidentialité",
    "DELETE_LOGO": "Supprimer le logo",
    "UPLOAD_LOGO": "Téléverser un logo",
    "UPLOAD": "Téléverser",
    "LOGO_INSTRUCTIONS": "Un logo est facultatif mais fortement recommandé.",
    "LOGO_DESCRIPTION": "Cliquez sur le logo pour téléverser un logo personnalisé depuis vos fichiers.",
    "LOGO": "Logo",
    "UPLOAD_AVATAR": "Téléverser un avatar",
    "SESSION_NOT_FRESH": "Votre session n'est pas fraîche. Veuillez vous connecter à nouveau.",
    "GO_BACK": "Retour",
    "VERIFY_YOUR_EMAIL_DESCRIPTION": "Veuillez vérifier votre adresse e-mail. Vérifiez votre boîte de réception pour le",
    "VERIFY_YOUR_EMAIL": "Vérifiez votre e-mail",
    "SIGN_IN_USERNAME_PLACEHOLDER": "Nom d'utilisateur ou e-mail",
    "USERNAME_PLACEHOLDER": "Nom d'utilisateur",
    "USERNAME_INSTRUCTIONS": "Veuillez utiliser 32 caractères au maximum.",
    "USERNAME_DESCRIPTION": "Entrez le nom d'utilisateur que vous souhaitez utiliser pour vous connecter.",
    "USERNAME": "Nom d'utilisateur",
    "UPDATED_SUCCESSFULLY": "Mis à jour avec succès",
    "UNLINK": "Dissocier",
    "SEND_VERIFICATION_CODE": "Envoyer le code de vérification",
    "TWO_FACTOR_TOTP_LABEL": "Scannez le code QR avec votre authentificateur",
    "TWO_FACTOR_PROMPT": "Authentification à deux facteurs",
    "TWO_FACTOR_DISABLED": "L'authentification à deux facteurs a été désactivée",
    "TWO_FACTOR_ENABLED": "L'authentification à deux facteurs a été activée",
    "TWO_FACTOR_ENABLE_INSTRUCTIONS": "Veuillez entrer votre mot de passe pour activer 2FA",
    "TWO_FACTOR_DISABLE_INSTRUCTIONS": "Veuillez entrer votre mot de passe pour désactiver 2FA.",
    "TWO_FACTOR_CARD_DESCRIPTION": "Ajoutez une couche supplémentaire de sécurité à votre compte.",
    "TWO_FACTOR_DESCRIPTION": "Veuillez entrer votre mot de passe à usage unique pour continuer",
    "TWO_FACTOR_ACTION": "Vérifier le code",
    "TWO_FACTOR": "Deux facteurs",
    "TRUST_DEVICE": "Faire confiance à cet appareil",
    "SWITCH_ACCOUNT": "Changer de compte",
    "SECURITY": "Sécurité",
    "SAVE": "Enregistrer",
    "SETTINGS": "Paramètres",
    "SET_PASSWORD_DESCRIPTION": "Cliquez sur le bouton ci-dessous pour recevoir un e-mail afin de configurer un mot de passe.",
    "SET_PASSWORD": "Définir le mot de passe",
    "SESSIONS_DESCRIPTION": "Gérez vos sessions actives et révoquez l'accès.",
    "SESSIONS": "Sessions",
    "SIGN_UP_EMAIL": "Vérifiez votre e-mail pour le lien de vérification.",
    "SIGN_UP_DESCRIPTION": "Entrez vos informations pour créer un compte",
    "SIGN_UP_ACTION": "Créer un compte",
    "SIGN_UP": "S'inscrire",
    "SIGN_OUT": "Se déconnecter",
    "SIGN_IN_WITH": "Se connecter avec",
    "SIGN_IN_USERNAME_DESCRIPTION": "Entrez votre nom d'utilisateur ou votre e-mail ci-dessous pour vous connecter à votre compte",
    "SIGN_IN_DESCRIPTION": "Entrez votre e-mail ci-dessous pour vous connecter à votre compte",
    "SIGN_IN_ACTION": "Se connecter",
    "SIGN_IN": "Se connecter",
    "API_KEY": "Clé API",
    "DELETE_API_KEY_CONFIRM": "Êtes-vous sûr de vouloir supprimer cette clé API?",
    "DELETE_API_KEY": "Supprimer la clé API",
    "REVOKE": "Révoquer",
    "REQUEST_FAILED": "Échec de la requête",
    "RESET_PASSWORD_SUCCESS": "Mot de passe réinitialisé avec succès",
    "RESET_PASSWORD_DESCRIPTION": "Entrez votre nouveau mot de passe ci-dessous",
    "RESET_PASSWORD_ACTION": "Enregistrer le nouveau mot de passe",
    "RESET_PASSWORD": "Réinitialiser le mot de passe",
    "RESEND_VERIFICATION_EMAIL": "Renvoyer l'e-mail de vérification",
    "RESEND_CODE": "Renvoyer le code",
    "REMEMBER_ME": "Se souvenir de moi",
    "RECOVER_ACCOUNT_DESCRIPTION": "Veuillez entrer un code de sauvegarde pour accéder à votre compte",
    "RECOVER_ACCOUNT_ACTION": "Récupérer le compte",
    "RECOVER_ACCOUNT": "Récupérer le compte",
    "PROVIDERS_DESCRIPTION": "Connectez votre compte à un service tiers.",
    "PROVIDERS": "Fournisseurs",
    "PASSWORDS_DO_NOT_MATCH": "Les mots de passe ne correspondent pas",
    "PASSWORD_REQUIRED": "Le mot de passe est requis",
    "PASSWORD_PLACEHOLDER": "Mot de passe",
    "PASSWORD": "Mot de passe",
    "CREATE_ORGANIZATION_SUCCESS": "Organisation créée avec succès",
    "ORGANIZATION_SLUG_PLACEHOLDER": "acme-inc",
    "ORGANIZATION_SLUG_INSTRUCTIONS": "Veuillez utiliser 48 caractères au maximum.",
    "ORGANIZATION_SLUG_DESCRIPTION": "Il s'agit de l'espace de noms URL de votre organisation.",
    "ORGANIZATION_SLUG": "URL du slug",
    "ORGANIZATION_NAME_INSTRUCTIONS": "Veuillez utiliser 32 caractères au maximum.",
    "ORGANIZATION_NAME_DESCRIPTION": "Il s'agit du nom visible de votre organisation.",
    "ORGANIZATION_NAME_PLACEHOLDER": "Acme Inc.",
    "ORGANIZATION_NAME": "Nom",
    "ORGANIZATION": "Organisation",
    "CREATE_ORGANIZATION": "Créer une organisation",
    "NO_EXPIRATION": "Pas d'expiration",
    "EXPIRES": "Expire",
    "NEVER_EXPIRES": "N'expire jamais",
    "CREATE_API_KEY_SUCCESS": "Veuillez copier votre clé API et la stocker dans un endroit sûr.",
    "API_KEY_CREATED": "Clé API créée",
    "API_KEY_NAME_PLACEHOLDER": "Nouvelle clé API",
    "CREATE_API_KEY_DESCRIPTION": "Entrez un nom unique pour votre clé API afin de la différencier",
    "CREATE_API_KEY": "Créer une clé API",
    "API_KEYS_INSTRUCTIONS": "Générez des clés API pour accéder à votre compte de manière programmatique.",
    "API_KEYS_DESCRIPTION": "Gérez vos clés API pour un accès sécurisé.",
    "API_KEYS": "Clés API",
    "PERSONAL_ACCOUNT": "Compte personnel",
    "PASSKEYS_INSTRUCTIONS": "Accédez à votre compte de manière sécurisée sans mot de passe.",
    "PASSKEYS_DESCRIPTION": "Gérez vos clés d'accès pour un accès sécurisé.",
    "PASSKEYS": "Clés d'accès",
    "PASSKEY": "Clé d'accès",
    "OR_CONTINUE_WITH": "Ou continuer avec",
    "ONE_TIME_PASSWORD": "Mot de passe à usage unique",
    "NEW_PASSWORD_REQUIRED": "Un nouveau mot de passe est requis",
    "NEW_PASSWORD_PLACEHOLDER": "Nouveau mot de passe",
    "NEW_PASSWORD": "Nouveau mot de passe",
    "NAME_PLACEHOLDER": "Nom",
    "NAME_INSTRUCTIONS": "Veuillez utiliser 32 caractères au maximum.",
    "NAME_DESCRIPTION": "Veuillez entrer votre nom complet, ou un nom d'affichage.",
    "NAME": "Nom",
    "EMAIL_OTP_VERIFICATION_SENT": "Veuillez vérifier votre e-mail pour le code de vérification.",
    "EMAIL_OTP_DESCRIPTION": "Entrez votre e-mail pour recevoir un code",
    "EMAIL_OTP_VERIFY_ACTION": "Vérifier le code",
    "EMAIL_OTP_SEND_ACTION": "Envoyer le code",
    "EMAIL_OTP": "Code e-mail",
    "MAGIC_LINK_EMAIL": "Vérifiez votre e-mail pour le lien magique",
    "MAGIC_LINK_DESCRIPTION": "Entrez votre e-mail pour recevoir un lien magique",
    "MAGIC_LINK_ACTION": "Envoyer le lien magique",
    "MAGIC_LINK": "Lien magique",
    "LINK": "Lien",
    "FORGOT_PASSWORD_LINK": "Mot de passe oublié?",
    "FORGOT_PASSWORD_EMAIL": "Vérifiez votre e-mail pour le lien de réinitialisation du mot de passe.",
    "FORGOT_PASSWORD_DESCRIPTION": "Entrez votre e-mail pour réinitialiser votre mot de passe",
    "FORGOT_PASSWORD_ACTION": "Envoyer le lien de réinitialisation",
    "FORGOT_PASSWORD": "Mot de passe oublié",
    "FORGOT_AUTHENTICATOR": "Authentificateur oublié?",
    "IS_THE_SAME": "est le même",
    "IS_REQUIRED": "est requis",
    "IS_INVALID": "est invalide",
    "ENABLE_TWO_FACTOR": "Activer l'authentification à deux facteurs",
    "EMAIL_VERIFICATION": "Veuillez vérifier votre e-mail pour le lien de vérification.",
    "EMAIL_VERIFY_CHANGE": "Veuillez vérifier votre e-mail pour confirmer le changement.",
    "EMAIL_REQUIRED": "L'adresse e-mail est requise",
    "EMAIL_PLACEHOLDER": "m@example.com",
    "EMAIL_IS_THE_SAME": "L'e-mail est le même",
    "EMAIL_INSTRUCTIONS": "Veuillez entrer une adresse e-mail valide.",
    "EMAIL_DESCRIPTION": "Entrez l'adresse e-mail que vous souhaitez utiliser pour vous connecter.",
    "EMAIL": "E-mail",
    "DONE": "Terminé",
    "DONT_HAVE_AN_ACCOUNT": "Vous n'avez pas de compte?",
    "DISABLED_CREDENTIALS_DESCRIPTION": "Choisissez un fournisseur pour vous connecter à votre compte",
    "DISABLE_TWO_FACTOR": "Désactiver l'authentification à deux facteurs",
    "DELETE_ACCOUNT_SUCCESS": "Votre compte a été supprimé.",
    "DELETE_ACCOUNT_VERIFY": "Veuillez vérifier votre e-mail pour confirmer la suppression de votre compte.",
    "DELETE_ACCOUNT_INSTRUCTIONS": "Veuillez confirmer la suppression de votre compte. Cette action est irréversible.",
    "DELETE_ACCOUNT_DESCRIPTION": "Supprimez définitivement votre compte et tout son contenu. Cette action est irréversible.",
    "DELETE_ACCOUNT": "Supprimer le compte",
    "DELETE_AVATAR": "Supprimer l'avatar",
    "DELETE": "Supprimer",
    "CURRENT_SESSION": "Session actuelle",
    "CURRENT_PASSWORD_PLACEHOLDER": "Mot de passe actuel",
    "CURRENT_PASSWORD": "Mot de passe actuel",
    "CONTINUE": "Continuer",
    "COPY_ALL_CODES": "Copier tous les codes",
    "COPY_TO_CLIPBOARD": "Copier dans le presse-papiers",
    "COPIED_TO_CLIPBOARD": "Copié dans le presse-papiers",
    "CONTINUE_WITH_AUTHENTICATOR": "Continuer avec l'authentificateur",
    "CONFIRM_PASSWORD_REQUIRED": "La confirmation du mot de passe est requise",
    "CONFIRM_PASSWORD_PLACEHOLDER": "Confirmer le mot de passe",
    "CONFIRM_PASSWORD": "Confirmer le mot de passe",
    "CHANGE_PASSWORD_SUCCESS": "Votre mot de passe a été changé.",
    "CHANGE_PASSWORD_INSTRUCTIONS": "Veuillez utiliser 8 caractères au minimum.",
    "CHANGE_PASSWORD_DESCRIPTION": "Entrez votre mot de passe actuel et un nouveau mot de passe.",
    "CHANGE_PASSWORD": "Changer le mot de passe",
    "CANCEL": "Annuler",
    "BACKUP_CODE": "Code de sauvegarde",
    "BACKUP_CODE_PLACEHOLDER": "Code de sauvegarde.",
    "BACKUP_CODE_DESCRIPTION": "Enregistrez ces codes de sauvegarde dans un endroit sûr. Vous pouvez les utiliser.",
    "BACKUP_CODES": "Codes de sauvegarde",
    "BACKUP_CODE_REQUIRED": "Le code de sauvegarde est requis",
    "AVATAR_INSTRUCTIONS": "Un avatar est facultatif mais fortement recommandé.",
    "AVATAR_DESCRIPTION": "Cliquez sur l'avatar pour téléverser un avatar personnalisé depuis vos fichiers.",
    "AVATAR": "Avatar",
    "ALREADY_HAVE_AN_ACCOUNT": "Vous avez déjà un compte?",
    "ADD_PASSWORD": "Ajouter une clé d'accès",
    "ADD_ACCOUNT": "Ajouter un compte",
    "ACCOUNTS_INSTRUCTIONS": "Connectez-vous à un compte supplémentaire.",
    "ACCOUNTS_DESCRIPTION": "Gérez vos comptes actuellement connectés.",
    "ACCOUNTS": "Comptes",
    "ACCOUNT": "Compte",
    "USER_ALREADY_HAS_PASSWORD": "L'utilisateur a déjà un mot de passe",
    "ACCOUNT_NOT_FOUND": "Compte non trouvé",
    "FAILED_TO_UNLINK_LAST_ACCOUNT": "Échec de la dissociation du dernier compte",
    "SESSION_EXPIRED": "Session expirée",
    "CREDENTIAL_ACCOUNT_NOT_FOUND": "Compte de crédential non trouvé",
    "EMAIL_CAN_NOT_BE_UPDATED": "L'e-mail ne peut pas être mis à jour",
    "PASSWORD_TOO_LONG": "Le mot de passe est trop long",
    "PASSWORD_TOO_SHORT": "Le mot de passe est trop court",
    "USER_EMAIL_NOT_FOUND": "E-mail de l'utilisateur non trouvé",
    "FAILED_TO_GET_USER_INFO": "Échec de la récupération des informations de l'utilisateur",
    "ID_TOKEN_NOT_SUPPORTED": "Le jeton d'identification n'est pas supporté",
    "INVALID_TOKEN": "Jeton invalide",
    "PROVIDER_NOT_FOUND": "Fournisseur non trouvé",
    "SOCIAL_ACCOUNT_ALREADY_LINKED": "Le compte social est déjà lié",
    "INVALID_EMAIL_OR_PASSWORD": "E-mail ou mot de passe invalide",
    "INVALID_PASSWORD": "Mot de passe invalide",
    "FAILED_TO_GET_SESSION": "Échec de la récupération de la session",
    "FAILED_TO_UPDATE_USER": "Échec de la mise à jour de l'utilisateur",
    "FAILED_TO_CREATE_SESSION": "Échec de la création de la session",
    "BANNED_USER": "Utilisateur banni",
    "YOU_ARE_NOT_ALLOWED_TO_SET_USERS_PASSWORD": "Vous n'êtes pas autorisé à définir le mot de passe de l'utilisateur",
    "YOU_ARE_NOT_ALLOWED_TO_DELETE_USERS": "Vous n'êtes pas autorisé à supprimer des utilisateurs",
    "YOU_ARE_NOT_ALLOWED_TO_REVOKE_USERS_SESSIONS": "Vous n'êtes pas autorisé à révoquer les sessions des utilisateurs",
    "YOU_ARE_NOT_ALLOWED_TO_IMPERSONATE_USERS": "Vous n'êtes pas autorisé à usurper l'identité des utilisateurs",
    "YOU_ARE_NOT_ALLOWED_TO_BAN_USERS": "Vous n'êtes pas autorisé à bannir des utilisateurs",
    "YOU_ARE_NOT_ALLOWED_TO_LIST_USERS_SESSIONS": "Vous n'êtes pas autorisé à lister les sessions des utilisateurs",
    "YOU_ARE_NOT_ALLOWED_TO_LIST_USERS": "Vous n'êtes pas autorisé à lister les utilisateurs",
    "YOU_ARE_NOT_ALLOWED_TO_CREATE_USERS": "Vous n'êtes pas autorisé à créer des utilisateurs",
    "YOU_ARE_NOT_ALLOWED_TO_CHANGE_USERS_ROLE": "Vous n'êtes pas autorisé à changer le rôle des utilisateurs",
    "YOU_CANNOT_BAN_YOURSELF": "Vous ne pouvez pas vous bannir vous-même",
    "USER_ALREADY_EXISTS": "L'utilisateur existe déjà",
    "ANONYMOUS_USERS_CANNOT_SIGN_IN_AGAIN_ANONYMOUSLY": "Les utilisateurs anonymes ne peuvent pas se connecter à nouveau de manière anonyme",
    "COULD_NOT_CREATE_SESSION": "Impossible de créer la session",
    "FAILED_TO_CREATE_USER": "Échec de la création de l'utilisateur",
    "SERVER_ONLY_PROPERTY": "Propriété serveur uniquement",
    "INVALID_API_KEY_GETTER_RETURN_TYPE": "Type de retour du getter de clé API invalide",
    "INVALID_USER_ID_FROM_API_KEY": "ID d'utilisateur invalide depuis la clé API",
    "INVALID_API_KEY": "Clé API invalide",
    "KEY_DISABLED_EXPIRATION": "Clé désactivée à l'expiration",
    "NO_VALUES_TO_UPDATE": "Aucune valeur à mettre à jour",
    "RATE_LIMIT_EXCEEDED": "Limite de taux dépassée",
    "METADATA_DISABLED": "Métadonnées désactivées",
    "INVALID_NAME_LENGTH": "Longueur de nom invalide",
    "INVALID_PREFIX_LENGTH": "Longueur de préfixe invalide",
    "INVALID_REMAINING": "Reste invalide",
    "EXPIRES_IN_IS_TOO_LARGE": "Expire dans est trop grand",
    "EXPIRES_IN_IS_TOO_SMALL": "Expire dans est trop petit",
    "KEY_NOT_RECOVERABLE": "Clé non récupérable",
    "USAGE_EXCEEDED": "Utilisation dépassée",
    "KEY_EXPIRED": "Clé expirée",
    "KEY_DISABLED": "Clé désactivée",
    "KEY_NOT_FOUND": "Clé non trouvée",
    "UNAUTHORIZED_SESSION": "Session non autorisée",
    "USER_BANNED": "Utilisateur banni",
    "REFILL_INTERVAL_AND_AMOUNT_REQUIRED": "Intervalle et montant de rechargement requis",
    "REFILL_AMOUNT_AND_INTERVAL_REQUIRED": "Montant et intervalle de rechargement requis",
    "INVALID_METADATA_TYPE": "Type de métadonnées invalide",
    "UNKNOWN_ERROR": "Erreur inconnue",
    "MISSING_RESPONSE": "Réponse manquante",
    "VERIFICATION_FAILED": "Échec de la vérification",
    "SERVICE_UNAVAILABLE": "Service non disponible",
    "MISSING_SECRET_KEY": "Clé secrète manquante",
    "TOO_MANY_ATTEMPTS": "Trop de tentatives",
    "USER_NOT_FOUND": "Utilisateur non trouvé",
    "INVALID_EMAIL": "E-mail invalide",
    "INVALID_OAUTH_CONFIGURATION": "Configuration OAuth invalide",
    "PASSWORD_COMPROMISED": "Mot de passe compromis",
    "INVALID_SESSION_TOKEN": "Jeton de session invalide",
    "INVITATION_LIMIT_REACHED": "Limite d'invitation atteinte",
    "YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_TEAM": "Vous n'êtes pas autorisé à supprimer cette équipe",
    "YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_TEAM": "Vous n'êtes pas autorisé à mettre à jour cette équipe",
    "YOU_ARE_NOT_ALLOWED_TO_DELETE_TEAMS_IN_THIS_ORGANIZATION": "Vous n'êtes pas autorisé à supprimer des équipes dans cette organisation",
    "YOU_ARE_NOT_ALLOWED_TO_CREATE_TEAMS_IN_THIS_ORGANIZATION": "Vous n'êtes pas autorisé à créer des équipes dans cette organisation",
    "ORGANIZATION_MEMBERSHIP_LIMIT_REACHED": "Limite d'adhésion à l'organisation atteinte",
    "YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_MEMBER": "Vous n'êtes pas autorisé à mettre à jour ce membre",
    "UNABLE_TO_REMOVE_LAST_TEAM": "Impossible de supprimer la dernière équipe",
    "YOU_HAVE_REACHED_THE_MAXIMUM_NUMBER_OF_TEAMS": "Vous avez atteint le nombre maximum d'équipes",
    "FAILED_TO_RETRIEVE_INVITATION": "Échec de la récupération de l'invitation",
    "YOU_ARE_NOT_ALLOWED_TO_INVITE_USER_WITH_THIS_ROLE": "Vous n'êtes pas autorisé à inviter un utilisateur avec ce rôle",
    "INVITER_IS_NO_LONGER_A_MEMBER_OF_THE_ORGANIZATION": "L'inviteur n'est plus membre de l'organisation",
    "YOU_ARE_NOT_ALLOWED_TO_CANCEL_THIS_INVITATION": "Vous n'êtes pas autorisé à annuler cette invitation",
    "YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION": "Vous n'êtes pas le destinataire de l'invitation",
    "INVITATION_NOT_FOUND": "Invitation non trouvée",
    "USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION": "L'utilisateur est déjà invité à cette organisation",
    "YOU_ARE_NOT_ALLOWED_TO_INVITE_USERS_TO_THIS_ORGANIZATION": "Vous n'êtes pas autorisé à inviter des utilisateurs à cette organisation",
    "YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_MEMBER": "Vous n'êtes pas autorisé à supprimer ce membre",
    "YOU_CANNOT_LEAVE_THE_ORGANIZATION_AS_THE_ONLY_OWNER": "Vous ne pouvez pas quitter l'organisation en tant que seul propriétaire",
    "TEAM_NOT_FOUND": "Équipe non trouvée",
    "TEAM_ALREADY_EXISTS": "L'équipe existe déjà",
    "YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_TEAM": "Vous n'êtes pas autorisé à créer une nouvelle équipe",
    "ROLE_NOT_FOUND": "Rôle non trouvé",
    "MEMBER_NOT_FOUND": "Membre non trouvé",
    "USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION": "L'utilisateur est déjà membre de cette organisation",
    "NO_ACTIVE_ORGANIZATION": "Aucune organisation active",
    "YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_ORGANIZATION": "Vous n'êtes pas autorisé à supprimer cette organisation",
    "YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_ORGANIZATION": "Vous n'êtes pas autorisé à mettre à jour cette organisation",
    "USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION": "L'utilisateur n'est pas membre de l'organisation",
    "ORGANIZATION_NOT_FOUND": "Organisation non trouvée",
    "ORGANIZATION_ALREADY_EXISTS": "L'organisation existe déjà",
    "YOU_HAVE_REACHED_THE_MAXIMUM_NUMBER_OF_ORGANIZATIONS": "Vous avez atteint le nombre maximum d'organisations",
    "YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_ORGANIZATION": "Vous n'êtes pas autorisé à créer une nouvelle organisation",
    "FAILED_TO_UPDATE_PASSWORD": "Échec de la mise à jour du mot de passe",
    "UNABLE_TO_CREATE_SESSION": "Impossible de créer la session",
    "AUTHENTICATION_FAILED": "Échec de l'authentification",
    "PASSKEY_NOT_FOUND": "Clé d'accès non trouvée",
    "FAILED_TO_VERIFY_REGISTRATION": "Échec de la vérification de l'enregistrement",
    "YOU_ARE_NOT_ALLOWED_TO_REGISTER_THIS_PASSWORD": "Vous n'êtes pas autorisé à enregistrer ce mot de passe",
    "CHALLENGE_NOT_FOUND": "Défi non trouvé",
    "PHONE_NUMBER_NOT_VERIFIED": "Numéro de téléphone non vérifié",
    "INVALID_OTP": "OTP invalide",
    "OTP_EXPIRED": "OTP expiré",
    "OTP_NOT_FOUND": "OTP non trouvé",
    "INVALID_PHONE_NUMBER_OR_PASSWORD": "Numéro de téléphone ou mot de passe invalide",
    "PHONE_NUMBER_EXIST": "Numéro de téléphone existe",
    "INVALID_PHONE_NUMBER": "Numéro de téléphone invalide",
    "SUBSCRIPTION_NOT_SCHEDULED_FOR_CANCELLATION": "Abonnement non programmé pour annulation",
    "SUBSCRIPTION_NOT_ACTIVE": "Abonnement non actif",
    "EMAIL_VERIFICATION_REQUIRED": "Vérification de l'e-mail requise",
    "FAILED_TO_FETCH_PLANS": "Échec de la récupération des plans",
    "UNABLE_TO_CREATE_CUSTOMER": "Impossible de créer le client",
    "ALREADY_SUBSCRIBED_PLAN": "Plan déjà abonné",
    "SUBSCRIPTION_PLAN_NOT_FOUND": "Plan d'abonnement non trouvé",
    "SUBSCRIPTION_NOT_FOUND": "Abonnement non trouvé",
    "INVALID_TWO_FACTOR_CODEIE": "Code d'authentification à deux facteurs invalide",
    "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE": "Trop de tentatives, demandez un nouveau code",
    "INVALID_CODE": "Code invalide",
    "INVALID_BACKUP_CODE": "Code de sauvegarde invalide",
    "BACKUP_CODES_NOT_ENABLED": "Codes de sauvegarde non activés",
    "TWO_FACTOR_NOT_ENABLED": "Authentification à deux facteurs non activée",
    "TOTP_NOT_ENABLED": "TOTP non activé",
    "OTP_HAS_EXPIRED": "OTP a expiré",
    "OTP_NOT_ENABLED": "OTP non activé",
    "INVALID_USERNAME": "Nom d'utilisateur invalide",
    "USERNAME_TOO_LONG": "Nom d'utilisateur trop long",
    "USERNAME_TOO_SHORT": "Nom d'utilisateur trop court",
    "USERNAME_IS_ALREADY_TAKEN": "Nom d'utilisateur déjà pris",
    "UNEXPECTED_ERROR": "Erreur inattendue",
    "EMAIL_NOT_VERIFIED": "E-mail non vérifié",
    "INVALID_USERNAME_OR_PASSWORD": "Nom d'utilisateur ou mot de passe invalide"
}

export function AuthView({pathname}: { pathname: string }) {
    const isSignUp = pathname === "sign-up";
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [twoFactor, setTwoFactor] = useState(false);
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [token, setToken] = useState("");
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    useEffect(() => {
        // Capture token from URL if on reset-password
        if (pathname === "reset-password") {
            const urlParams = new URLSearchParams(window.location.search);
            const t = urlParams.get("token");
            if (t) setToken(t);
        }

        // Force refresh session state on auth page to avoid ghost sessions
        authClient.getSession().then(({data}) => {
            if (data && !isSignUp) {
                // If we are on sign-in but have a session, redirect to app
                router.push("/app");
            }
        });
    }, [isSignUp, router]);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            toast.error("Les mots de passe ne correspondent pas");
            return;
        }

        setLoading(true);
        const {error} = await authClient.signUp.email({
            email: form.email,
            password: form.password,
            name: form.name,
            callbackURL: "/app"
        }, {
            onRequest: () => setLoading(true),
            onResponse: () => setLoading(false),
            onError: (ctx) => {
                toast.error(ctx.error.message || "Une erreur est survenue");
            },
            onSuccess: () => {
                toast.success("Compte créé avec succès !");
                router.push("/app");
            }
        });
        setLoading(false);
    };

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const {error} = await signIn.email({
            email: form.email,
            password: form.password,
            callbackURL: "/app"
        }, {
            onRequest: () => setLoading(true),
            onResponse: () => setLoading(false),
            onError: (ctx) => {
                if (ctx.error.status === 403 && ctx.error.message?.includes("two-factor")) {
                    setTwoFactor(true);
                } else {
                    toast.error(ctx.error.message || "Email ou mot de passe incorrect");
                }
            },
            onSuccess: () => {
                toast.success("Connecté avec succès !");
                router.push("/app");
            }
        });
        setLoading(false);
    };

    const handleTwoFactorVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const {error} = await authClient.twoFactor.verifyTotp({
            code: otp,
        }, {
            onError: (ctx) => {
                toast.error(ctx.error.message || "Code invalide");
            },
            onSuccess: () => {
                toast.success("Connecté avec succès !");
                router.push("/app");
            }
        });
        setLoading(false);
    };

    const handlePasskeySignIn = async () => {
        setLoading(true);
        const {error} = await authClient.signIn.passkey();
        setLoading(false);

        if (error) {
            toast.error(error.message || "Erreur lors de la connexion via clé de sécurité");
        } else {
            toast.success("Connecté avec succès !");
            router.push("/app");
        }
    };

    const handleDiscordSignIn = async () => {
        await signIn.social({
            provider: "discord",
            callbackURL: "/app"
        });
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    email: form.email,
                    redirectTo: `${window.location.origin}/auth/reset-password`,
                })
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.message || "Une erreur est survenue");
            }
            toast.success("E-mail de réinitialisation envoyé !");
        } catch (err: any) {
            toast.error(err?.message || "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            toast.error("Les mots de passe ne correspondent pas");
            return;
        }

        if (!token) {
            toast.error("Jeton de réinitialisation manquant ou invalide");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    newPassword: form.password,
                    token,
                })
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.message || "Échec de la réinitialisation");
            }
            toast.success("Mot de passe mis à jour avec succès !");
            router.push("/auth/sign-in");
        } catch (err: any) {
            toast.error(err?.message || "Échec de la réinitialisation");
        } finally {
            setLoading(false);
        }
    };

    const cardTitle = twoFactor ? "Vérification A2F" : (isSignUp ? "Créer un compte" : (pathname === "forgot-password" ? "Mot de passe oublié" : (pathname === "reset-password" ? "Réinitialiser le mot de passe" : "Se connecter")));
    const cardDescription = twoFactor
        ? "Entrez le code de votre application d'authentification"
        : (isSignUp
            ? "Entrez vos informations pour créer votre compte Solar"
            : (pathname === "forgot-password"
                ? "Entrez votre e-mail pour recevoir un lien de réinitialisation"
                : (pathname === "reset-password"
                    ? "Entrez votre nouveau mot de passe ci-dessous"
                    : "Entrez votre e-mail pour vous connecter à votre compte")));

    return (
        <main className="flex grow flex-col items-center justify-center p-4 w-full">
            <div className="w-full max-w-[400px]">
                <Card>
                    <CardHeader>
                        <CardTitle>{cardTitle}</CardTitle>
                        <CardDescription>{cardDescription}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {twoFactor ? (
                            <form onSubmit={handleTwoFactorVerify} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="otp">Code de vérification</Label>
                                    <Input
                                        id="otp"
                                        placeholder="000000"
                                        required
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        maxLength={6}
                                        autoFocus
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Vérifier
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full"
                                    onClick={() => setTwoFactor(false)}
                                >
                                    Retour
                                </Button>
                            </form>
                        ) : (
                            <>
                                <form
                                    onSubmit={isSignUp ? handleSignUp : (pathname === "forgot-password" ? handleForgotPassword : (pathname === "reset-password" ? handleResetPassword : handleSignIn))}
                                    className="space-y-4">
                                    {isSignUp && (
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nom complet</Label>
                                            <Input
                                                id="name"
                                                placeholder="Jean Dupont"
                                                required
                                                value={form.name}
                                                onChange={(e) => setForm({...form, name: e.target.value})}
                                            />
                                        </div>
                                    )}
                                    {pathname !== "reset-password" && (
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="jean@exemple.fr"
                                                required
                                                value={form.email}
                                                onChange={(e) => setForm({...form, email: e.target.value})}
                                            />
                                        </div>
                                    )}
                                    {pathname !== "forgot-password" && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="password">
                                                    {pathname === "reset-password" ? "Nouveau mot de passe" : "Mot de passe"}
                                                </Label>
                                                {!isSignUp && pathname === "sign-in" && (
                                                    <Link
                                                        href="/auth/forgot-password"
                                                        className="text-xs text-primary hover:underline"
                                                    >
                                                        Mot de passe oublié ?
                                                    </Link>
                                                )}
                                            </div>
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="••••••••"
                                                required
                                                value={form.password}
                                                onChange={(e) => setForm({...form, password: e.target.value})}
                                            />
                                        </div>
                                    )}
                                    {(isSignUp || pathname === "reset-password") && (
                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">
                                                {pathname === "reset-password" ? "Confirmer le nouveau mot de passe" : "Confirmer le mot de passe"}
                                            </Label>
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                placeholder="••••••••"
                                                required
                                                value={form.confirmPassword}
                                                onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
                                            />
                                        </div>
                                    )}
                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                        {isSignUp ? "S'inscrire" : (pathname === "forgot-password" ? "Envoyer le lien" : (pathname === "reset-password" ? "Réinitialiser" : "Se connecter"))}
                                    </Button>
                                </form>

                                {pathname === "sign-in" && (
                                    <div className="space-y-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full gap-2"
                                            onClick={handlePasskeySignIn}
                                            disabled={loading}
                                        >
                                            <Fingerprint className="h-4 w-4"/>
                                            Clé de sécurité
                                        </Button>
                                    </div>
                                )}

                                {pathname === "sign-in" && (
                                    <>
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <span className="w-full border-t"/>
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-background px-2 text-muted-foreground">
                                                    Ou continuer avec
                                                </span>
                                            </div>
                                        </div>

                                        <Button
                                            variant="outline"
                                            type="button"
                                            className="w-full"
                                            onClick={handleDiscordSignIn}
                                            disabled={loading}
                                        >
                                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false"
                                                 data-prefix="fab"
                                                 data-icon="discord" role="img" xmlns="http://www.w3.org/2000/svg"
                                                 viewBox="0 0 640 512">
                                                <path fill="currentColor"
                                                      d="M524.5 448c-51.5 0-93.7-45.4-93.7-101.2s41.3-101.2 93.7-101.2c52.4 0 93.7 45.4 93.7 101.2s-41.3 101.2-93.7 101.2zm-209.1 0c-51.5 0-93.7-45.4-93.7-101.2s41.3-101.2 93.7-101.2c52.4 0 93.7 45.4 93.7 101.2s-41.3 101.2-93.7 101.2zM615.7 38.8c-47.5-22.1-98.3-36.2-152.1-40.6-.6 1.1-1.3 2.7-2 4.4-60.4-9.2-122.3-9.2-182.7 0-.7-1.7-1.4-3.2-2-4.4-53.8 4.4-104.6 18.5-152.1 40.6-63.1 94.4-80.4 203.2-73.4 309.1 42.1 31.1 92.2 56.4 146 72.8 12.6-17.3 23.5-36 32.7-55.7-15.6-5.9-30.5-13.1-44.5-21.3 3.7-2.7 7.4-5.6 10.9-8.5 103.7 48 215.7 48 319.4 0 3.5 2.9 7.2 5.8 10.9 8.5-14 8.2-28.9 15.4-44.5 21.3 9.2 19.7 20.1 38.4 32.7 55.7 53.8-16.4 103.9-41.7 146-72.8 8.4-121.1-16.7-230.1-73.4-309.1z"></path>
                                            </svg>
                                            Discord
                                        </Button>
                                    </>
                                )}
                            </>
                        )}
                    </CardContent>
                    {!twoFactor && (
                        <CardFooter className="flex justify-center">
                            <div className="text-center text-sm text-muted-foreground">
                                {isSignUp ? (
                                    <>
                                        Déjà un compte ?{" "}
                                        <Link href="/auth/sign-in" className="text-primary hover:underline font-medium">
                                            Se connecter
                                        </Link>
                                    </>
                                ) : (pathname === "forgot-password" || pathname === "reset-password") ? (
                                    <Link href="/auth/sign-in" className="text-primary hover:underline font-medium">
                                        Retour à la connexion
                                    </Link>
                                ) : (
                                    <>
                                        Vous n'avez pas de compte ?{" "}
                                        <Link href="/auth/sign-up" className="text-primary hover:underline font-medium">
                                            S'inscrire
                                        </Link>
                                    </>
                                )}
                            </div>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </main>
    );
}