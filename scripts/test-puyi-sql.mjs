// Isolated local PostgreSQL/WASM. No credentials or remote SQL.
import {PGlite} from '../.cache/h4a-sql-runtime/node_modules/@electric-sql/pglite/dist/index.js';
import {puyiContract} from '../supabase/tests/puyi-contract.mjs';
const pg=new PGlite();try{const n=await puyiContract(pg);console.log(`${n}/${n} Puyi SQL scenarios passed. Storage API/JWT gateway are not covered by this runner.`);}finally{await pg.close();}
