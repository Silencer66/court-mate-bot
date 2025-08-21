const { build } = require("esbuild");
const path = require("path");

const srcDir = path.resolve(__dirname, "..", "src");

build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    platform: "node",
    target: "node18",
    format: "cjs",
    outfile: "dist/index.js",
    sourcemap: true,
    alias: {
        "@": srcDir,
    },
}).catch(() => process.exit(1));
