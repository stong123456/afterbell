import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceCopy} from '../src/source-copy.mjs';
test('flash headlines become a concise title plus original body without duplicate filler',()=>{
 assert.deepEqual(sourceCopy({title:'【政策更新】原始报道内容',summary:'原始来源记录；请阅读原文并核实增量信息。'}),{title:'政策更新',summary:'原始报道内容'});
 assert.deepEqual(sourceCopy({title:'Headline',summary:'Headline'}),{title:'Headline',summary:''});
});
