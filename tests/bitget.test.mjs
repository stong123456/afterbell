import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMarket} from '../bitget.mjs';
import {eventMove} from '../src/market-math.mjs';
const info={symbol:'RNVDAUSDT',baseCoin:'rNVDA',quoteCoin:'USDT',status:'online'};
test('Bitget mapping verifies exact spot identity and keeps absent prices missing',()=>{
 assert.throws(()=>normalizeMarket('NVDA',{...info,baseCoin:'NVDA'},null,null,[]));
 const d=normalizeMarket('NVDA',info,{symbol:'OTHER',lastPr:'100'},null,[]);
 assert.equal(d.price,null);assert.equal(d.spreadPct,null);
 const q=normalizeMarket('NVDA',info,{symbol:'RNVDAUSDT',lastPr:'100',change24h:'-0.02'},{bids:[['99','2']],asks:[['101','3']]},[]);
 assert.equal(q.change24hPct,-2);assert.equal(q.spreadPct,2);assert.equal(q.bidDepthUSDT,198);assert.equal(q.askDepthUSDT,303);
});
test('event comparison excludes the event-containing candle and stale baselines',()=>{
 const h=3600000,market={price:110,candles:[{time:h,close:100},{time:2*h,close:105}]};
 assert.equal(eventMove(market,new Date(2.5*h).toISOString()).baseline,100);
 assert.equal(eventMove(market,new Date(10*h).toISOString()),null);
 assert.equal(eventMove(market,undefined),null);
});

import {browserMarketEvidence} from '../bitget.mjs';
test('browser snapshots are bounded, labelled and never treated as verified server data',()=>{const v={symbol:'NVDA',pair:'RNVDAUSDT',price:100,quoteTimestamp:Date.now(),candles:['ignored']};assert.match(browserMarketEvidence(v,['NVDA'])[0].scope,/not-server-source-verified/);assert.deepEqual(browserMarketEvidence(v,['TSLA']),[]);assert.deepEqual(browserMarketEvidence({...v,quoteTimestamp:1},['NVDA']),[]);assert.ok(!browserMarketEvidence(v,['NVDA'])[0].summary.includes('candles'));});
