import type {FastifyInstance} from 'fastify';
import {registerUsersRoutes} from './users';
import {registerMessagesRoutes} from './messages';
import {registerChannelsRoutes} from './channels';
import {registerTicketsRoutes} from './tickets';
import {registerKeysRoutes} from './keys';
import {registerMessageRoutes} from './message';
import {registerReactionsRoutes} from './reactions';
import {registerEventsRoutes} from './events.js';
import {registerAdminRoutes} from './admin.js';
import {registerImageRoutes} from './image.js';
import {registerBotRoutes} from './bot.js';
import {registerWidgetRoutes} from './widget.js';
import {registerWsRoutes} from './ws.js';
import {registerAuthRoutes} from './auth.js';

export async function registerV1Routes(app: FastifyInstance) {
    await registerUsersRoutes(app);
    await registerMessagesRoutes(app);
    await registerChannelsRoutes(app);
    await registerTicketsRoutes(app);
    await registerKeysRoutes(app);
    await registerMessageRoutes(app);
    await registerReactionsRoutes(app);
    await registerEventsRoutes(app);
    await registerAdminRoutes(app);
    await registerImageRoutes(app);
    await registerBotRoutes(app);
    await registerWidgetRoutes(app);
    await registerWsRoutes(app);
    await registerAuthRoutes(app);
}
