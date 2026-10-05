/** Only local Angular URLs are accepted; never protocol-relative or encoded external paths. */
export function safeReturnUrl(value:string|null|undefined,fallback='/'):string {
  if(!value||!value.startsWith('/')||value.startsWith('//')||/[\\\x00-\x20\x7f]/u.test(value))return fallback;
  try {
    const path=decodeURIComponent(value.split(/[?#]/u)[0]);
    if(path.startsWith('//')||/[\\\x00-\x20\x7f]/u.test(path))return fallback;
    return value;
  }catch{return fallback;}
}
