import * as esbuild from "esbuild-wasm";
import axios from "axios";
import localForage from "localforage";

//this variable is our local DB
const fileCache = localForage.createInstance({
  name: "fileCache",
});

export const fetchPlugin = (userInput: string) => {
  return {
    name: "fetch-plugin",
    setup(build: esbuild.PluginBuild) {
      //loads main index.js file
      build.onLoad({ filter: /(^index\.js$)/ }, () => {
        return {
          loader: "jsx",
          contents: userInput,
        };
      });

      //loads CSS files from UNPKG
      build.onLoad({ filter: /.css$/ }, async (args: any) => {
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

        const escaped = data
          .replace(/\n/g, "")
          .replace(/"/g, '\\"')
          .replace(/'/g, "\\'");

        const contents = `
          const style = document.createElement('style');
          style.innerText = '${escaped}';
          document.head.appendChild(style);
          `;

        //create object that holds our data
        const result: esbuild.OnLoadResult = {
          loader: "jsx",
          contents,
          resolveDir: new URL("./", request.responseURL).pathname,
        };

        //store response in cache
        await fileCache.setItem(args.path, result);

        return result;
      });

      //loads all JS files from UNPKG
      build.onLoad({ filter: /.*/ }, async (args: any) => {
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
