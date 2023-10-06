import * as esbuild from "esbuild-wasm";
import axios from "axios";

export const unpkgPathPlugin = () => {
  //plugin object
  return {
    name: "unpkg-path-plugin",
    setup(build: esbuild.PluginBuild) {
      //this function retrieves dependency
      build.onResolve({ filter: /.*/ }, async (args: any) => {
        console.log("onResole", args);

        if (args.path === "index.js") {
          return { path: args.path, namespace: "a" };
        }

        if (args.path.includes("./" || args.path.includes("../"))) {
          return {
            namespace: "a",
            path: new URL(
              args.path,
              "https://unpkg.com" + args.resolveDir + "/"
            ).href,
          };
        }

        return { path: `https://unpkg.com/${args.path}`, namespace: "a" };
      });

      //this function loads dependency based on what's returned from onResolve()
      build.onLoad({ filter: /.*/ }, async (args: any) => {
        console.log("onLoad", args);

        if (args.path === "index.js") {
          return {
            loader: "jsx",
            contents: `
              const message = require('react');
              console.log(message);
            `,
          };
        }

        const { data, request } = await axios.get(args.path);
        return {
          loader: "jsx",
          contents: data,
          resolveDir: new URL("./", request.responseURL).pathname,
        };
      });
    },
  };
};
