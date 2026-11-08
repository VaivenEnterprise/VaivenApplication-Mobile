const MOCK_AUTH_DELAY_MS = 500;

export async function mockAuthRequest<T>(payload: T): Promise<T> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, MOCK_AUTH_DELAY_MS);
  });

  return payload;
}
