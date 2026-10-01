import { TestBed } from "@angular/core/testing";
import { AuthService } from "./auth.service";
import { SupabaseClientService } from "./supabase-client.service";
import { WorkspaceService } from "./workspace.service";
import { WorkspaceMigrationService } from "./workspace-migration.service";

describe("AuthService local-first lifecycle", () => {
  beforeEach(() => localStorage.clear());

  afterEach(() => TestBed.resetTestingModule());

  it("boots as usable Guest when Supabase is absent", async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SupabaseClientService,
          useValue: {
            config: { configured: false },
            getClient: async () => null,
          },
        },
      ],
    });

    const auth = TestBed.inject(AuthService);

    await Promise.resolve();

    expect(auth.ready()).toBe(true);
    expect(auth.authenticated()).toBe(false);
    expect(TestBed.inject(WorkspaceService).active()).toBe("guest");
  });

  it("activates the authenticated user workspace and returns to Guest on sign out", async () => {
    let listener: any;

    const user = {
      id: "carlos",
      email: "c@example.com",
    };

    const client = {
      auth: {
        onAuthStateChange: (callback: any) => {
          listener = callback;

          return {
            data: {
              subscription: {
                unsubscribe() {},
              },
            },
          };
        },

        signOut: async () => {
          listener("SIGNED_OUT", null);
        },
      },

      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                id: "carlos",
                username: "carlos",
                display_name: "Carlos",
                created_at: "2026-01-01",
                updated_at: "2026-01-01",
              },
            }),
          }),
        }),
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: SupabaseClientService,
          useValue: {
            config: { configured: true },
            getClient: async () => client,
          },
        },
        {
          provide: WorkspaceMigrationService,
          useValue: {
            hasGuestData: async () => false,
            copyGuestToUser: async () => undefined,
          },
        },
      ],
    });

    const auth = TestBed.inject(AuthService);

    await Promise.resolve();

    listener("SIGNED_IN", { user });

    await Promise.resolve();
    await Promise.resolve();

    expect(TestBed.inject(WorkspaceService).active()).toBe("user:carlos");

    await auth.signOut();

    expect(TestBed.inject(WorkspaceService).active()).toBe("guest");
  });
});
