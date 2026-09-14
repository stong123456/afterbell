import {mkdir,copyFile,cp} from 'node:fs/promises';
import {build} from 'esbuild';
await mkdir('dist/client',{recursive:true});
await copyFile('dist/index.html','dist/client/index.html');
await cp('dist/assets','dist/client/assets',{recursive:true});
await mkdir('dist/.openai',{recursive:true});
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
await build({entryPoints:['worker/index.js'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022'});
