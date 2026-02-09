import { join, resolve } from "node:path";
import staticPlugin from "@fastify/static";
import fp from "fastify-plugin";
import { addFontsRoutes } from "./fonts.js";
import type {} from "@fastify/helmet";
import type {} from "@jafps/plugin-openapi";
import type {} from "@jafps/plugin-schema";
import type { LogLevel } from "fastify";


export type ScalarPluginOptions = {
  /**
   * Prefix for API documentation and related files.
   *
   * Default to `/api`.
   */
  prefix?: string;
  staticOptions?: {
    /**
     * Default to `true`.
     */
    decorateReply?: boolean;

    /**
     * Default to `true`.
     */
    immutable?: boolean;

    /**
     * Default to `"silent"`.
     */
    logLevel?: LogLevel;

    /**
     * Default to `"30d"`.
     */
    maxAge?: number | string;
  };

  /**
   * Scalar HTML title.
   *
   * Default to `API Reference`.
   */
  title?: string;
};

export const name = "@jafps/plugin-scalar";

export default fp<ScalarPluginOptions>(
  async (app, opts) => {
    const {
      prefix = "/api",
      staticOptions: {
        decorateReply = true,
        immutable = true,
        logLevel = "silent",
        maxAge = "30d"
      } = {},
      title = "API Reference"
    } = opts;

    await app.register(staticPlugin, {
      decorateReply,
      immutable,
      logLevel,
      maxAge,
      prefix,
      root: [
        resolve(join(import.meta.dirname, "..", "public"))
      ],
      serve: false
    });

    app.get(prefix, { config: { openapi: { hide: true } } }, async (_req, res) => {
      await res.redirect(`${prefix}/`, 301);
    });

    app.get(
      `${prefix}/`,
      {
        config: { openapi: { hide: true } },
        helmet: {
          contentSecurityPolicy: {
            directives: {
              "font-src": ["'self'"],
              "style-src": ["'self'", "'unsafe-inline'"],
              "worker-src": ["'self'", "blob:"]
            },
            useDefaults: true
          },
          crossOriginEmbedderPolicy: true,
          crossOriginOpenerPolicy: true,
          crossOriginResourcePolicy: true,
          originAgentCluster: true,
          referrerPolicy: { policy: "no-referrer" },
          xContentTypeOptions: true,
          xDnsPrefetchControl: { allow: false },
          xDownloadOptions: true,
          xFrameOptions: { action: "deny" },
          xPermittedCrossDomainPolicies: { permittedPolicies: "none" },
          xXssProtection: true
        }
      },
      async (_req, res) => {
        await res.sendFile("scalar.html");
      }
    );
    const files = ["scalar.standalone.js", "favicon.svg"];
    for (const file of files) {
      app.get(
        `${prefix}/${file}`,
        { config: { openapi: { hide: true } } },
        async (_req, res) => {
          await res.sendFile(file);
        }
      );
    }

    app.get(
      `${prefix}/openapi.json`,
      { config: { openapi: { hide: true } } },
      async function (_req, res) {
        await res.send(this.openapi());
      }
    );

    app.get(
      `${prefix}/scalar.config.js`,
      { config: { openapi: { hide: true } } },
      async (_req, res) => {
        const script = `
          Scalar.createApiReference("#app", { 
            url: "./openapi.json",
            theme: "fastify",
            telemetry: false,
            showDeveloperTools: "never",
            withDefaultFonts: false,
            hideClientButton: true,
            agent: { disabled: true }
          });
          document.title = "${title}";
        `.trim();
        await res.type("text/javascript").send(script);
      }
    );
    addFontsRoutes(app, prefix);
  },
  {
    decorators: {},
    dependencies: ["@jafps/plugin-openapi", "@fastify/helmet"],
    fastify: "5.x",
    name
  }
);
