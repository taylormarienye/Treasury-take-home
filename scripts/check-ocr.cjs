const {createWorker}=require('tesseract.js');
const fs=require('fs');
(async()=>{
 const root=require('path').resolve(__dirname,'..');
 const t0=performance.now();
 const w=await createWorker('eng',1,{langPath:root+'/dist/vendor/lang',gzip:true,cacheMethod:'none'});
 const init=(performance.now()-t0)/1000;
 const reports=[];
 const {compare,SAMPLE}=await import(root+'/dist/engine.js');
 for(const file of ['old-tom.png','wrong-abv.png','warning-case.png']){
  const start=performance.now();const {data}=await w.recognize(root+'/dist/samples/'+file);
  const result=compare(data.text,SAMPLE,data.confidence);
  reports.push({file,seconds:(performance.now()-start)/1000,confidence:data.confidence,review:result.rows.filter(r=>r.status==='review').map(r=>r.key),text:data.text});
 }
 await w.terminate();
 fs.writeFileSync(root+'/OCR_VALIDATION.json',JSON.stringify({initializationSeconds:init,reports},null,2));
 console.log(JSON.stringify({initializationSeconds:init,reports:reports.map(({text,...r})=>r)},null,2));
 if(reports[0].review.length||!reports[1].review.includes('abv')||!reports[2].review.includes('caps'))process.exitCode=1;
})();
