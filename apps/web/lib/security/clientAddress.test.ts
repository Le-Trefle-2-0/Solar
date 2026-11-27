import test from 'node:test';
import assert from 'node:assert/strict';
import {clientAddressFromForwarded} from './clientAddress';

const trusted = ['127.0.0.1', '::1', '10.0.0.0/8'];

test('client address: the address the proxy saw, not what the client wrote', () => {
    // Traefik appends the client's address after whatever the client sent
    assert.equal(clientAddressFromForwarded('6.6.6.6, 1.2.3.4', trusted), '1.2.3.4');
    assert.equal(clientAddressFromForwarded('1.2.3.4', trusted), '1.2.3.4');
    // Our own proxies are skipped from the right
    assert.equal(clientAddressFromForwarded('6.6.6.6, 1.2.3.4, 127.0.0.1', trusted), '1.2.3.4');
    assert.equal(clientAddressFromForwarded('1.2.3.4, 10.0.0.0', trusted), '1.2.3.4');
    assert.equal(clientAddressFromForwarded('::ffff:1.2.3.4', trusted), '1.2.3.4');
});

test('client address: none when only proxies or nothing are listed', () => {
    assert.equal(clientAddressFromForwarded('127.0.0.1', trusted), null);
    assert.equal(clientAddressFromForwarded('', trusted), null);
    assert.equal(clientAddressFromForwarded(null, trusted), null);
});
