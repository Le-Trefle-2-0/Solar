import type {FastifyInstance} from 'fastify';
import {registerUsersRoutes} from './users';
import {registerMessagesRoutes} from './messages';
import {registerChannelsRoutes} from './channels';
import {registerTicketsRoutes} from './tickets';
import {registerKeysRoutes} from './keys';
import {registerMessageRoutes} from './message';
import {registerReactionsRoutes} from './reactions';
import {registerProxyRoutes} from './proxy';

export async function registerV1Routes(app: FastifyInstance) {
    await registerUsersRoutes(app);
    await registerMessagesRoutes(app);
    await registerChannelsRoutes(app);
    await registerTicketsRoutes(app);
    await registerKeysRoutes(app);
    await registerMessageRoutes(app);
    await registerReactionsRoutes(app);
    await registerProxyRoutes(app);
}
