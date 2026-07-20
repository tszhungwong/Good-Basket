import { createAccountRepository, type AccountClient } from './accountRepository';

const user = {
  id: '0c30e4f6-4f61-4ff5-9d3c-c5f7e748f9ad',
  email: 'jamie.chen@example.com',
  user_metadata: { full_name: 'Jamie Chen' },
};

const overview = {
  profile: {
    displayName: 'Jamie Chen',
    memberSince: '2026',
    username: 'jamiechen_0c30e4f6',
  },
  deliveryPreference: null,
  paymentMethods: [],
  orders: [],
};

function createClient({
  rpcResults = [{ data: overview, error: null }],
  upsertError = null,
  authUser = user,
}: {
  rpcResults?: { data: unknown; error: Error | null }[];
  upsertError?: Error | null;
  authUser?: typeof user | null;
} = {}) {
  const getUser = jest.fn().mockResolvedValue({
    data: { user: authUser },
    error: null,
  });
  const signOut = jest.fn().mockResolvedValue({ error: null });
  const rpc = jest.fn();
  for (const result of rpcResults) {
    rpc.mockResolvedValueOnce(result);
  }
  const upsert = jest.fn().mockResolvedValue({ data: null, error: upsertError });
  const from = jest.fn().mockReturnValue({ upsert });

  return {
    client: { auth: { getUser, signOut }, from, rpc } as unknown as AccountClient,
    from,
    getUser,
    rpc,
    signOut,
    upsert,
  };
}

test('loads an existing account and includes the verified sign-in email', async () => {
  const { client, from, getUser, rpc } = createClient();

  await expect(createAccountRepository(client).getAccount()).resolves.toEqual({
    ...overview,
    profile: { ...overview.profile, email: user.email },
  });
  expect(getUser).toHaveBeenCalledTimes(1);
  expect(rpc).toHaveBeenCalledWith('get_account_overview');
  expect(from).not.toHaveBeenCalled();
});

test('creates an owned profile and retries when an authenticated account profile is missing', async () => {
  const { client, from, rpc, upsert } = createClient({
    rpcResults: [
      { data: null, error: null },
      { data: overview, error: null },
    ],
  });

  await expect(createAccountRepository(client).getAccount()).resolves.toMatchObject({
    profile: { displayName: 'Jamie Chen', email: user.email },
  });
  expect(from).toHaveBeenCalledWith('account_profiles');
  expect(upsert).toHaveBeenCalledWith(
    {
      display_name: 'Jamie Chen',
      user_id: user.id,
      username: 'jamiechen_0c30e4f6',
    },
    { ignoreDuplicates: true, onConflict: 'user_id' },
  );
  expect(rpc).toHaveBeenCalledTimes(2);
});

test('does not query account data without a verified authenticated user', async () => {
  const { client, from, rpc } = createClient({ authUser: null });

  await expect(createAccountRepository(client).getAccount()).rejects.toThrow(
    'Could not load your account. Please sign in and try again.',
  );
  expect(rpc).not.toHaveBeenCalled();
  expect(from).not.toHaveBeenCalled();
});

test('reports profile preparation failure when missing-profile recovery cannot insert', async () => {
  const { client, rpc } = createClient({
    rpcResults: [{ data: null, error: null }],
    upsertError: new Error('row-level security violation'),
  });

  await expect(createAccountRepository(client).getAccount()).rejects.toThrow(
    'Could not prepare your account profile. Please try again.',
  );
  expect(rpc).toHaveBeenCalledTimes(1);
});

test('signs out the active Supabase session', async () => {
  const { client, signOut } = createClient();

  await expect(createAccountRepository(client).signOut()).resolves.toBeUndefined();

  expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
});

test('reports sign out failure', async () => {
  const { client, signOut } = createClient();
  signOut.mockResolvedValueOnce({ error: new Error('network failed') });

  await expect(createAccountRepository(client).signOut()).rejects.toThrow(
    'Could not sign out. Please try again.',
  );
});

test('requests current account deletion through the database function', async () => {
  const { client, rpc } = createClient();

  await expect(createAccountRepository(client).requestAccountDeletion()).resolves.toBeUndefined();

  expect(rpc).toHaveBeenCalledWith('delete_current_user');
});

test('reports account deletion failure', async () => {
  const { client } = createClient({
    rpcResults: [{ data: null, error: new Error('permission denied') }],
  });

  await expect(createAccountRepository(client).requestAccountDeletion()).rejects.toThrow(
    'Could not delete your account. Please try again.',
  );
});
