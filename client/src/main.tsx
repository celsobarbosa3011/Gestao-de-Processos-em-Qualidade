import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("Main.tsx starting...");

try {
  const rootElement = document.getElementById("root");
  console.log("Root element:", rootElement);
  
  if (rootElement) {
    console.log("Creating React root...");
    const root = createRoot(rootElement);
    console.log("Rendering App...");
    root.render(<App />);
    console.log("App rendered successfully");
  } else {
    console.error("Root element not found!");
  }
} catch (error) {
  console.error("Error in main.tsx:", error);
}
