import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { AuthProvider } from "../contexts/AuthContext";
import { DataProvider } from "../contexts/DataContext";

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <AuthProvider>
        <DataProvider>
          <RouterProvider router={router} />
          <Toaster position="top-right" richColors />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
