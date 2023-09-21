import React, { useState, useEffect } from "react";

import * as esbuild from "esbuild-wasm";

function App() {
  const [input, setInput] = useState("");
  const [code, setCode] = useState("");

  //this will go into the public directory
  //find esbuild-wasm and
  //return a service object that we will use to transpile user code
  const startService = async () => {
    const service = await esbuild.startService({
      worker: true,
      wasmURL: "/esbuild.wasm",
    });
    console.log(service);
  };

  //invoke startService() one time when the component is first rendered to the scree
  useEffect(() => {
    startService();
  }, []);

  const onClick = () => {
    console.log(input);
  };

  return (
    <div className="App">
      <textarea
        onChange={(e) => {
          setInput(e.target.value);
        }}
      ></textarea>
      <div>
        <button onClick={onClick}>Submit</button>
      </div>
      <pre></pre>
    </div>
  );
}

export default App;
