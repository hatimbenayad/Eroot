import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true },
});

try {
  await server.ssrLoadModule('/scripts/load-sanity.ts');
} finally {
  await server.close();
}
