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
      //this function loads dependency based on what's returned from onResolve()
      build.onLoad({ filter: /.*/ }, async (args: any) => {
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
        const fileType = args.path.match(/.css$/) ? "css" : "jsx";
        const escaped = data
          .replace(/\n/g, "")
          .replace(/"/g, '\\"')
          .replace(/'/g, "\\'");

        const contents =
          fileType === "css"
            ? `
        const style = document.createElement('style');
        style.innerText = '${escaped}';
        document.head.appendChild(style);
        `
            : data;

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
    },
  };
};
