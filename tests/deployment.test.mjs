import test from 'node:test';
import assert from 'node:assert/strict';
import {deploymentConfig, requestAllowed} from '../deployment.mjs';
test('public HTTPS requests work without trusting arbitrary proxy headers', () => {
  const config = deploymentConfig({PORT:'8080', PUBLIC_ORIGINS:'https://afterbell.askstone.xyz'});
  assert.ok(requestAllowed({host:'afterbell.askstone.xyz',origin:'https://afterbell.askstone.xyz'},config));
  assert.equal(requestAllowed({host:'afterbell.askstone.xyz',origin:'https://evil.example'},config),false);
  assert.equal(requestAllowed({host:'evil.example','x-forwarded-host':'afterbell.askstone.xyz'},config),false);
  assert.equal(requestAllowed({host:'afterbell.askstone.xyz',origin:'http://afterbell.askstone.xyz'},config),false);
  assert.ok(requestAllowed({host:'localhost:8080'},config));
});
test('public configuration rejects paths, insecure origins and invalid ports', () => {
  for (const PUBLIC_ORIGINS of ['http://afterbell.askstone.xyz','https://afterbell.askstone.xyz/path','https://user:pass@afterbell.askstone.xyz']) {
    assert.throws(()=>deploymentConfig({PUBLIC_ORIGINS}));
  }
  assert.throws(()=>deploymentConfig({PORT:'not-a-port'}));
  assert.equal(deploymentConfig({}).bind,'127.0.0.1');
});
