import * as esbuild from "esbuild-wasm";
import axios from "axios";
import localForage from "localforage";

//this variable is our local DB
const fileCache = localForage.createInstance({
  name: "fileCache",
});

export const unpkgPathPlugin = (userInput: string) => {
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

      //this function loads dependency based on what's returned from onResolve()
      build.onLoad({ filter: /.*/ }, async (args: any) => {
        console.log("onLoad", args);

        if (args.path === "index.js") {
          return {
            loader: "jsx",
            contents: userInput,
          };
        }

        //check if data is in user's cache and store in a variable
        const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(
          args.path
        );

        //if in cache return immediately
        if (cachedResult) {
          return cachedResult;
        }

        //if not in cache then make request to UNPKG
        const { data, request } = await axios.get(args.path);
        //create object that holds our data
        const result: esbuild.OnLoadResult = {
          loader: "jsx",
          contents: data,
          resolveDir: new URL("./", request.responseURL).pathname,
        };

        //store response in cache
        await fileCache.setItem(args.path, result);

        return result;
      });
    },
  };
};
