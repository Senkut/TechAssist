
import { AuthProvider } from "./context/AuthContext.jsx";
import AppRouter from "./routes/AppRouter";
import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
