import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ALL_PERMISSIONS} from './permissionCatalogue.js';

test('the API and web permission catalogues are identical', async () => {
    // Test-only import across workspaces; the web package is CommonJS, hence the default fallback.
    const web: any = await import('../../../web/lib/permissions.ts' as string);
    const webPermissions: string[] = web.ALL_PERMISSIONS ?? web.default?.ALL_PERMISSIONS;
    assert.ok(Array.isArray(webPermissions), 'ALL_PERMISSIONS not exported by apps/web/lib/permissions.ts');
    assert.deepEqual([...ALL_PERMISSIONS].sort(), [...webPermissions].sort());
});
