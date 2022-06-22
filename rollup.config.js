import { nodeResolve } from "@rollup/plugin-node-resolve";
import copy from "rollup-plugin-copy";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import { minifyHTML } from "rollup-plugin-minify-html";

export default {
  input: "src/main.js",
  output: {
    file: "dist/app.js",
    format: "iife",
    sourcemap: process.env.NODE_ENV !== "production",
  },
  plugins: [
    nodeResolve({
      jsnext: true,
      main: true,
      browser: true,
    }),
    commonjs(),
    ...(process.env.NODE_ENV === "production" ? [terser()] : []),
    ...(process.env.NODE_ENV === "production"
      ? [
          minifyHTML({
            targets: [
              {
                src: "src/index.html",
                dest: "dist/index.html",
                minifyOptions: {
                  minifyJS: true,
                },
              },
            ],
            minifyOptions: {
              collapseWhitespace: true,
              minifyCSS: true,
              minifyJS: false,
              minifyURLs: true,
            },
          }),
        ]
      : [
          copy({
            targets: [{ src: "src/index.html", dest: "dist" }],
          }),
        ]),
  ],
};
