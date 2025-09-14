import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PlatformLayout from "./components/layout/PlatformLayout";
import Dashboard from "./pages/Dashboard";
import PDFSplitterTool from "./pages/tools/PDFSplitterTool";
import EmailDistributionTool from "./pages/tools/EmailDistributionTool";
import PatternDiscoveryPage from "./pages/tools/PatternDiscoveryTool";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PlatformLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tools/pdf-splitter" element={<PDFSplitterTool />} />
            <Route path="/tools/email-distribution" element={<EmailDistributionTool />} />
            <Route path="/tools/pattern-discovery" element={<PatternDiscoveryPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PlatformLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
