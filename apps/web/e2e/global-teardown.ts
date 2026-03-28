export default async function globalTeardown() {
    const server = (globalThis as unknown as Record<string, unknown>).__mockApiServer as
        | { close: (cb: () => void) => void }
        | undefined;
    if (server) {
        await new Promise<void>((resolve) => server.close(resolve));
    }
}
