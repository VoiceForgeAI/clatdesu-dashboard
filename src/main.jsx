import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

function App() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "sans-serif",
        fontSize: "2rem",
        background: "linear-gradient(135deg, #00b4db, #0083b0)",
        color: "white",
      }}
    >
      Welcome to CLATDesu Dashboard 🚀
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
