import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import AdminGalleries from "./pages/AdminGalleries";
import AdminGalleryDetail from "./pages/AdminGalleryDetail";
import AdminLogin from "./pages/AdminLogin";
import CustomerSelection from "./pages/CustomerSelection";
import SelectionSuccess from "./pages/SelectionSuccess";

const rootRoute = createRootRoute({
  component: () => (
    <div className="dark min-h-screen bg-background font-sans">
      <Outlet />
      <Toaster theme="dark" richColors />
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/admin" });
  },
});

const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/login",
  component: AdminLogin,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminGalleries,
});

const adminGalleryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/gallery/$id",
  component: AdminGalleryDetail,
});

const selectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/select/$token",
  component: CustomerSelection,
});

const selectSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/select/$token/success",
  component: SelectionSuccess,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  adminLoginRoute,
  adminRoute,
  adminGalleryRoute,
  selectRoute,
  selectSuccessRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
