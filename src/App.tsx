import React, { useState, useEffect, useRef } from "react";

import * as esbuild from "esbuild-wasm";

function App() {
  //store any value inside App with useRef() instead of state
  const ref = useRef<any>();
  const [input, setInput] = useState("");
  const [code, setCode] = useState("");

  //this will go into the public directory
  //find esbuild-wasm and
  //return a service object that we will use to transpile user code
  const startService = async () => {
    ref.current = await esbuild.startService({
      worker: true,
      wasmURL: "https://unpkg.com/esbuild-wasm@0.8.27/esbuild.wasm",
    });
  };

  //invoke startService() one time when the component is first rendered to the scree
  useEffect(() => {
    startService();
  }, []);

  const onClick = async () => {
    if (!ref.current) {
      return;
    }

    const result = await ref.current.transform(input, {
      loader: "jsx",
      target: "es2015",
    });

    setCode(result.code);
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
      <pre>{code}</pre>
    </div>
  );
}

export default App;
