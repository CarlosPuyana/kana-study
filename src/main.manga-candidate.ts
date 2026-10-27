import {bootstrapApplication} from '@angular/platform-browser';
import {appConfig} from './app/app.config';
import {App} from './app/app';
import {MANGA_CANDIDATE_PROVIDERS} from './app/release/manga-candidate.providers';

bootstrapApplication(App,{...appConfig,providers:[...appConfig.providers,...MANGA_CANDIDATE_PROVIDERS]}).catch(error=>console.error(error));
