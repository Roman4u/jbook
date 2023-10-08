import * as esbuild from "esbuild-wasm";
import axios from "axios";
import localForage from "localforage";

//this variable is our local DB
const fileCache = localForage.createInstance({
  name: "fileCache",
});

export const unpkgPathPlugin = () => {
  //plugin object
  return {
    name: "unpkg-path-plugin",
    setup(build: esbuild.PluginBuild) {
      //Handles root entry file of index.js to bundle
      build.onResolve({ filter: /(^index\.js$)/ }, () => {
        return { path: "index.js", namespace: "a" };
      });

      //Handles relative paths to modules in UNPKG
      build.onResolve({ filter: /^\.+\// }, (args: any) => {
        return {
          namespace: "a",
          path: new URL(args.path, "https://unpkg.com" + args.resolveDir + "/")
            .href,
        };
      });

      //Handles main path to main module in UNPKG
      build.onResolve({ filter: /.*/ }, async (args: any) => {
        return { path: `https://unpkg.com/${args.path}`, namespace: "a" };
      });
      
    },
  };
};
