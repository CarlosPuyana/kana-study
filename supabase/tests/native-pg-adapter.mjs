// Adapter used only by the existing 23-scenario runner in an isolated local cluster.
import pg from '../../.cache/h4a1-runtime/node_modules/pg/lib/index.js';
export class PGlite {
  constructor() {
    if (!/^\d+$/.test(process.env.H4A1_PG_PORT ?? '') || !process.env.H4A1_PG_PASSWORD)
      throw new Error('Start through test-custom-decks-native.mjs; no external database is accepted');
    this.client = new pg.Client({host:'127.0.0.1',port:Number(process.env.H4A1_PG_PORT),
      user:'postgres',password:process.env.H4A1_PG_PASSWORD,database:'h4a1_legacy_suite'});
    this.ready = this.client.connect();
  }
  async exec(sql) { await this.ready; return this.client.query(sql); }
  async query(sql,values) { await this.ready; return this.client.query(sql,values); }
  async close() { await this.client.end(); }
}
