import { inject } from '@angular/core';
import { CanActivateChildFn, CanMatchFn, Router } from '@angular/router';
import { GrammarAccessService } from './grammar-access.service';
import { safeReturnUrl } from './return-navigation';

export function grammarDestination(value:string|null|undefined):string {
  const path=safeReturnUrl(value,'/grammar');
  return path==='/grammar'||path.startsWith('/grammar/')||path.startsWith('/grammar?') ? path : '/grammar';
}
export const grammarMatch:CanMatchFn=async(_route,segments)=>{
  const access=inject(GrammarAccessService),router=inject(Router);
  const destination=grammarDestination(router.getCurrentNavigation()?.extractedUrl.toString() ?? '/'+segments.join('/'));
  return await access.check(true) || router.createUrlTree(['/grammar-access'],{queryParams:{return:destination}});
};
export const grammarChild:CanActivateChildFn=async(_route,state)=>{
  const access=inject(GrammarAccessService),router=inject(Router);
  return await access.check(true) || router.createUrlTree(['/grammar-access'],{queryParams:{return:grammarDestination(state.url)}});
};
