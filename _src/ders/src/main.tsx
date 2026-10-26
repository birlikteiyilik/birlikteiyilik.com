import { createRoot } from "react-dom/client";
import { LessonHub } from "./LessonHub";
import "./globals.css";
import "./hub.css";
import "./curricula.css";

createRoot(document.getElementById("root")!).render(<LessonHub />);
