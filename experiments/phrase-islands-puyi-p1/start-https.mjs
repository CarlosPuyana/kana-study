import fs from 'node:fs';import path from 'node:path';import {WORK} from './prepare.mjs';import {serve} from './server.mjs';
const location=JSON.parse(fs.readFileSync(path.join(WORK,'https-location.json'),'utf8')),connection=JSON.parse(fs.readFileSync(location.connection,'utf8'));
const result=await serve({host:connection.host,port:connection.port,cert:connection.serverCertificate,key:connection.serverKey,token:connection.token});
console.log('Temporary local HTTPS laboratory: '+result.url+' (access URL is in the private connection.json; device trust NOT installed)');
