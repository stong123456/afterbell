import test from 'node:test';
import assert from 'node:assert/strict';
import {sortMarkets} from '../src/market-sort.mjs';
test('default gain ranking handles negatives, ties and missing values without mutation',()=>{
 const input=[{symbol:'Z',change24hPct:null},{symbol:'C',change24hPct:-2},{symbol:'B',change24hPct:3},{symbol:'A',change24hPct:3},{symbol:'D',change24hPct:0}];
 assert.deepEqual(sortMarkets(input).map(a=>a.symbol),['A','B','D','C','Z']);
 assert.deepEqual(sortMarkets(input,'change24hPct','asc').map(a=>a.symbol),['C','D','A','B','Z']);assert.equal(input[0].symbol,'Z');
});
test('numeric sort preserves zero and keeps null, NaN and undefined last in either direction',()=>{
 for(const key of ['price','volume24hToken','volume24hUSDT','quoteTimestamp']){
  const rows=[{symbol:'A',[key]:null},{symbol:'B',[key]:0},{symbol:'C',[key]:12},{symbol:'D',[key]:NaN},{symbol:'E'}];
  assert.deepEqual(sortMarkets(rows,key,'asc').map(a=>a.symbol),['B','C','A','D','E']);
  assert.deepEqual(sortMarkets(rows,key,'desc').map(a=>a.symbol),['C','B','A','D','E']);
 }
 assert.deepEqual(sortMarkets([{symbol:'A'},{symbol:'B'}],'symbol','desc').map(a=>a.symbol),['B','A']);
});
