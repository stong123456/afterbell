import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCatalog,normalizeMarket} from '../bitget.mjs';
import {thesisType,eventLens,readDecision} from '../src/decision.mjs';
import {challenge,scenarios} from '../src/research.mjs';
test('catalog includes new verified rTokens but excludes normal crypto and malformed pairs',()=>{
 const infos=[{symbol:'RMSFTUSDT',baseCoin:'rMSFT',quoteCoin:'USDT',status:'online'},{symbol:'RUNEUSDT',baseCoin:'RUNE',quoteCoin:'USDT'},{symbol:'RFAKEUSDT',baseCoin:'rMSFT',quoteCoin:'USDT'}];
 const rows=normalizeCatalog(infos,[{symbol:'RMSFTUSDT',lastPr:'400',change24h:'0.01',usdtVolume:'0',ts:'1000'}]);assert.equal(rows.length,1);assert.equal(rows[0].symbol,'MSFT');assert.equal(rows[0].volume24hUSDT,0);assert.equal(rows[0].change24hPct,1);assert.equal(normalizeMarket('MSFT',infos[0],null,null,[]).price,null);assert.throws(()=>normalizeMarket('RUNE',infos[1],null,null,[]));
});
test('buying alone is not classified as a rebound thesis',()=>{assert.equal(thesisType('I want to buy on improving revenue'),'earnings');assert.equal(thesisType('我考虑买入，因为新产品可能改善业务'),'event');assert.equal(thesisType('我认为超跌后会反弹'),'rebound');assert.notEqual(challenge('我考虑买入，因为新产品可能改善业务',scenarios[0]).checks[0].title,'下跌本身不能证明超跌');});
test('market-structure lens does not treat a filing as approval',()=>{assert.match(eventLens({title:'Files to list stock perps',summary:''},'en').counter,/not approval/);});
test('local research drafts ignore credentials and malformed values',()=>{const s={getItem:()=>JSON.stringify({trigger:'above prior level',apiKey:'secret',notes:42})};assert.deepEqual(readDecision(s,'x'),{trigger:'above prior level'});});
