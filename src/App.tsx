import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import Header from "@/components/Header";
import Index from "./pages/Index";
import CartPage from "./pages/CartPage";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <CartProvider>
        <CurrencyProvider>
          <BrowserRouter>
            <Header />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CurrencyProvider>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
