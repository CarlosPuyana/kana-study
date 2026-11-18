import { bootstrapApplication } from '@angular/platform-browser';
import { PhraseAdminPage } from './app/features/phrase-islands-admin/phrase-admin.page';
import { PhraseAuthoringPreferences } from './app/core/services/phrase-authoring-preferences.service';
import { SettingsService } from './app/core/services/settings.service';
// A dedicated language/theme adapter prevents authoring from instantiating study persistence or Auth.
bootstrapApplication(PhraseAdminPage,{providers:[PhraseAuthoringPreferences,{provide:SettingsService,useExisting:PhraseAuthoringPreferences}]}).catch(error=>console.error(error));
