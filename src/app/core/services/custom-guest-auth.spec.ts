import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {AuthService} from './auth.service';
import {SupabaseClientService} from './supabase-client.service';
import {WorkspaceService} from './workspace.service';
import {WorkspaceMigrationService} from './workspace-migration.service';

describe('Account migration keeps custom completion separate from legacy commits',()=>{
 let auth:AuthService,workspace:WorkspaceService;
 let migration:{customImportAvailable:()=>boolean;copyGuestToUser:ReturnType<typeof vi.fn>;hasCustomGuestData:()=>Promise<boolean>;customImportComplete:ReturnType<typeof vi.fn>};
 beforeEach(async()=>{localStorage.clear();migration={customImportAvailable:()=>true,copyGuestToUser:vi.fn(async()=>{}),hasCustomGuestData:async()=>true,customImportComplete:vi.fn(async()=>false)};
  TestBed.configureTestingModule({providers:[{provide:SupabaseClientService,useValue:{config:{configured:false},getClient:async()=>null}},{provide:WorkspaceMigrationService,useValue:migration}]});
  auth=TestBed.inject(AuthService);workspace=TestBed.inject(WorkspaceService);await Promise.resolve();(auth as unknown as {userState:ReturnType<typeof signal<{id:string}>>}).userState.set({id:'synthetic-a'});
 });
 afterEach(()=>{TestBed.resetTestingModule();localStorage.clear();});
 it('explicit merge keeps the migration decision pending after legacy copy until custom proof exists',async()=>{
  expect(await auth.chooseGuestImport('merge')).toBe(true);expect(migration.copyGuestToUser).toHaveBeenCalledWith('synthetic-a');expect(workspace.active()).toBe('user:synthetic-a');expect(workspace.importDecision('synthetic-a')).toBeNull();expect(auth.needsGuestImportDecision()).toBe(true);
  expect(await auth.finishCustomGuestImport()).toBe(false);expect(workspace.importDecision('synthetic-a')).toBeNull();migration.customImportComplete.mockResolvedValue(true);
  expect(await auth.finishCustomGuestImport()).toBe(true);expect(workspace.importDecision('synthetic-a')).toBe('merge');expect(auth.needsGuestImportDecision()).toBe(false);
 });
 it('use account never invokes legacy or custom Guest copying',async()=>{expect(await auth.chooseGuestImport('account')).toBe(true);expect(migration.copyGuestToUser).not.toHaveBeenCalled();expect(workspace.importDecision('synthetic-a')).toBe('account');});
 it('A-B-A while legacy copy is pending cannot activate or complete an old decision',async()=>{
  let release!:()=>void;const barrier=new Promise<void>(r=>release=r);migration.copyGuestToUser.mockImplementation(()=>barrier);
  const request=auth.chooseGuestImport('merge');workspace.activateUser('synthetic-b');workspace.activateUser('synthetic-a');release();expect(await request).toBe(false);expect(workspace.importDecision('synthetic-a')).toBeNull();
 });
 it('A-B-A during completion proof cannot mark the old activation migrated',async()=>{
  workspace.activateUser('synthetic-a');let release!:(value:boolean)=>void;const barrier=new Promise<boolean>(r=>release=r);migration.customImportComplete.mockImplementation(()=>barrier);
  const request=auth.finishCustomGuestImport();workspace.activateUser('synthetic-b');workspace.activateUser('synthetic-a');release(true);expect(await request).toBe(false);expect(workspace.importDecision('synthetic-a')).toBeNull();
 });
});
