import {readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const paths=['app.js',...(await readdir('js')).filter(path=>path.endsWith('.js')).map(path=>'js/'+path)];
for(const path of paths){const result=spawnSync(process.execPath,['--check',path],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
console.log(`Sintaxis verificada: ${paths.length} archivos.`);
