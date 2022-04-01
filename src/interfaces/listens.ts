import { accounts, account_listen, listens, listen_status } from "@prisma/client";

export type ListenWithStatus = listens & { listen_status: listen_status };
export type ListenWithStatusAndAccounts = listens & { listen_status: listen_status, account_listen: (account_listen & { accounts: accounts })[] };