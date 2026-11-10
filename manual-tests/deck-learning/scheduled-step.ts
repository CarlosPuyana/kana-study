import {Page,expect} from '@playwright/test';
/** Learn Ahead resumes the short step immediately; no synthetic passage of minutes. */
export async function resumeScheduledStep(page:Page){await expect(page.locator('.study-card')).toBeVisible();}
