import { defineConfig } from 'orval';

export default defineConfig({
  glidingpath: {
    input: {
      target: 'http://localhost:9090/v1/api/api-docs',
      override: {
        transformer: (spec) => {
          // Remove hardcoded servers to force relative URLs
          delete spec.servers;

          // Strip /v1/api prefix from all paths since baseURL already includes it
          if (spec.paths) {
            const newPaths: typeof spec.paths = {};
            for (const [path, value] of Object.entries(spec.paths)) {
              const cleanPath = path.startsWith('/v1/api')
                ? path.substring(7)
                : path;
              newPaths[cleanPath] = value;
            }
            spec.paths = newPaths;
          }

          return spec;
        },
      },
    },
    output: {
      mode: 'tags-split',
      target: './src/api/generated/endpoints',
      schemas: './src/api/generated/models',
      client: 'react-query',
      baseUrl: '',
      override: {
        mutator: {
          path: './src/api/client.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: true,
          version: 5,
          shouldExportQueryKey: true,
          shouldExportMutatorHooks: true,
        },
      },
      clean: true,
      prettier: true,
    },
  },
});
