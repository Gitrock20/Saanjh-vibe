import { defineConfig } from "@lovable.dev/vite-tanstack-config";

let isBuild = false;

export default (defineConfig as any)({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    prerender: {
      enabled: true,
      crawlLinks: true,
    },
  },
  nitro: {
    preset: "static",
  },
  plugins: [
    {
      name: "ssr-fix-plugin",
      config(config: any, env: any) {
        isBuild = env.command === "build";
        const isSSR = !!(env.ssrBuild || config.build?.ssr);
        if (isSSR) {
          if (!config.build) config.build = {};
          if (!config.build.rollupOptions) config.build.rollupOptions = {};
          if (!config.build.rolldownOptions) config.build.rolldownOptions = {};
          const input = config.build.rolldownOptions.input ?? config.build.rollupOptions.input;
          if (input) {
            if (typeof input === "string" && input.endsWith(".html")) {
              config.build.rollupOptions.input = "src/server.ts";
              config.build.rolldownOptions.input = "src/server.ts";
            } else if (Array.isArray(input)) {
              const filtered = input.filter((f) => !f.endsWith(".html"));
              config.build.rollupOptions.input = filtered;
              config.build.rolldownOptions.input = filtered;
            } else if (typeof input === "object" && input !== null) {
              const newInput = { ...input } as Record<string, string>;
              for (const key in newInput) {
                if (newInput[key].endsWith(".html")) {
                  delete newInput[key];
                }
              }
              config.build.rollupOptions.input = newInput;
              config.build.rolldownOptions.input = newInput;
            }
          } else {
            config.build.rollupOptions.input = "src/server.ts";
            config.build.rolldownOptions.input = "src/server.ts";
          }
        }
      },
      configEnvironment(name: any, config: any) {
        const isSSR = name === "ssr" || name === "nitro" || config.consumer === "server";
        if (isSSR) {
          if (!isBuild && name === "ssr") {
            if (!config.build) config.build = {};
            if (!config.build.rollupOptions) config.build.rollupOptions = {};
            if (!config.build.rolldownOptions) config.build.rolldownOptions = {};
            config.build.outDir = "node_modules/.nitro/vite/services/ssr";
            config.build.rollupOptions.input = "index";
            config.build.rolldownOptions.input = "index";
            return;
          }
          const input = config.build?.rolldownOptions?.input ?? config.build?.rollupOptions?.input;
          if (!input) {
            return {
              build: {
                rollupOptions: {
                  input: "src/server.ts"
                },
                rolldownOptions: {
                  input: "src/server.ts"
                }
              }
            };
          }
          if (typeof input === "string" && input.endsWith(".html")) {
            return {
              build: {
                rollupOptions: {
                  input: "src/server.ts"
                },
                rolldownOptions: {
                  input: "src/server.ts"
                }
              }
            };
          } else if (Array.isArray(input)) {
            const filtered = input.filter((f) => !f.endsWith(".html"));
            const target = filtered.length > 0 ? filtered : ["src/server.ts"];
            return {
              build: {
                rollupOptions: {
                  input: target
                },
                rolldownOptions: {
                  input: target
                }
              }
            };
          } else if (typeof input === "object" && input !== null) {
            const newInput = { ...input } as Record<string, string>;
            let hasNonHtml = false;
            for (const key in newInput) {
              if (newInput[key].endsWith(".html")) {
                delete newInput[key];
              } else {
                hasNonHtml = true;
              }
            }
            if (!hasNonHtml) {
              newInput["index"] = "src/server.ts";
            }
            return {
              build: {
                rollupOptions: {
                  input: newInput
                },
                rolldownOptions: {
                  input: newInput
                }
              }
            };
          }
        }
      },
      configurePreviewServer(server: any) {
        console.log("[DEBUG] SSR Env Build:", JSON.stringify(server.config.environments.ssr?.build, null, 2));
      }
    },
  ],
});
