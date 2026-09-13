import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {translate,localizeTree,reportMarkdown} from '../src/i18n.mjs';
import {challenge,scenarios} from '../src/research.mjs';
test('language switches UI without changing original source or user input',()=>{
 assert.equal(translate('Radar','zh'),'事件雷达');
 assert.equal(translate('持仓市值 USD','en'),'Position value USD');
 const original=React.createElement('h2',{'data-original':true},'Rates stay higher for longer');
 assert.equal(localizeTree(original,'zh'),original);
 const input=localizeTree(React.createElement('textarea',{value:'我的原始观点',placeholder:'请填写 10–2000 字的交易观点。'}),'en');
 assert.equal(input.props.value,'我的原始观点');assert.equal(input.props.placeholder,'Enter a trade thesis of 10–2000 characters.');
});
test('scenario report translates every generated check but retains the thesis',()=>{
 const thesis='我认为 NVDA 超跌，会反弹。';const report=challenge(thesis,scenarios[0]);
 const output=reportMarkdown(report,scenarios[0],'en');
 assert.ok(output.includes(thesis));assert.ok(output.includes('A decline alone does not establish overselling'));
 assert.ok(!output.replace(thesis,'').match(/[\u4e00-\u9fff]/));
 assert.ok(reportMarkdown(report,scenarios[0],'zh').includes('芯片出口限制收紧'));
});
