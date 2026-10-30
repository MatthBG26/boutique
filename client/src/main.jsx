import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import Admin from "./Admin.jsx";
import AdminProducts from "./AdminProducts.jsx";

const path = window.location.pathname;
const Page = path.startsWith("/admin/products")
  ? AdminProducts
  : path.startsWith("/admin")
  ? Admin
  : App;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Page />
  </StrictMode>
);
