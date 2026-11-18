import fs from 'node:fs';
const source=JSON.parse(fs.readFileSync(process.env['PHRASE_ISLANDS_TEST_CATALOG']??'src/app/data/phrase-islands/phrases.v1.json','utf8'));
export const topicIds=['everyday','conversation','work','shopping','travel','hobbies'];
export const topicCount=(...topics:string[])=>source.phrases.filter((p:{topicId:string})=>topics.includes(p.topicId)).length;
