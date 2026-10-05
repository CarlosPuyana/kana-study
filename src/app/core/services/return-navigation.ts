import {Location} from '@angular/common';
import {Router} from '@angular/router';
/** Only local Angular URLs are accepted; never protocol-relative or encoded external paths. */
export function safeReturnUrl(value:string|null|undefined,fallback='/'):string {
  if(!value||!value.startsWith('/')||value.startsWith('//')||/[\\\x00-\x20\x7f]/u.test(value))return fallback;
  try {
    const path=decodeURIComponent(value.split(/[?#]/u)[0]);
    if(path.startsWith('//')||/[\\\x00-\x20\x7f]/u.test(path))return fallback;
    return value;
  }catch{return fallback;}
}

/** An Angular navigation after the initial entry gives Back a useful internal destination. */
export function backWithinApp(location: Location, router: Router, fallback: string): void {
  if (((location.getState() as {navigationId?: number} | null)?.navigationId ?? 0) > 1) location.back();
  else void router.navigateByUrl(fallback);
}
