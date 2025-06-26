import { Buffer } from 'buffer';
window.Buffer = Buffer;

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./tailwind.css";

//Esta funcion crea la raíz de React en el elemento HTML con id "root"
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
