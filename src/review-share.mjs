const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function reviewShare(thesis,review){
 const challenged=review.results.filter(r=>r.status==='challenged'),unclear=review.results.filter(r=>r.status==='unclear');
 const reason=(challenged[0]||unclear[0]||review.results[0])?.reason||'';
 const lines=Array.from({length:Math.min(4,Math.ceil(reason.length/42))},(_,i)=>reason.slice(i*42,(i+1)*42));
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#111827"/><g fill="#f9fafb" font-family="Arial, sans-serif"><text x="70" y="90" font-size="25" fill="#93c5fd">ASKSTONE / WHAT CHANGED</text><text x="70" y="170" font-size="50">${escape(thesis.symbol)} THESIS</text><text x="70" y="235" font-size="26">${thesis.assumptions.length} assumptions · ${challenged.length} need attention · ${unclear.length} unclear</text>${lines.map((line,i)=>`<text x="70" y="${315+i*45}" font-size="25">${escape(line)}</text>`).join('')}<text x="70" y="535" font-size="20" fill="#9ca3af">Checked: ${escape(review.checkedAt)} · ${review.mode==='ai'?'AI review':'Source check / No AI'}</text><text x="70" y="580" font-size="18" fill="#9ca3af">Reported evidence, not verified facts. Research assistance, not a trade instruction.</text></g></svg>`;
}
