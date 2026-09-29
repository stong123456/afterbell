import {createThesis} from './thesis-memory.mjs';
export function confirmedBaseline(brief,baseline,drafts,now=Date.now()){
 if(!Array.isArray(drafts)||drafts.length<1||drafts.length>4||drafts.some(a=>!a.text?.trim()||!a.invalidation?.trim()||a.text.length>500||a.invalidation.length>500))throw Error('INVALID_ASSUMPTIONS');
 const entry=createThesis({symbol:brief.symbol,horizon:brief.horizon,idea:baseline?.idea||brief.idea,assumptions:drafts.map(a=>({...a,text:a.text.trim(),invalidation:a.invalidation.trim()}))},now);
 entry.baselineConfirmation={at:entry.createdAt,originAt:baseline?.createdAt||brief.createdAt,actor:'user',originalAssumptions:structuredClone(baseline?.assumptions||brief.assumptions)};
 entry.brief={mode:brief.mode,createdAt:brief.createdAt,evidence:structuredClone(brief.evidence),report:structuredClone(brief.report)};
 return entry;
}
