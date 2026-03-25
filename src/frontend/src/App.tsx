import { Toaster } from "@/components/ui/sonner";
import {
  RouterProvider,
  createHashHistory,
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

const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/admin/login" });
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

const adminGalleryDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/gallery/$id",
  component: AdminGalleryDetail,
});

const galleryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/select/$token",
  component: CustomerSelection,
});

const selectionSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/select/$token/success",
  component: SelectionSuccess,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  adminLoginRoute,
  adminRoute,
  adminGalleryDetailRoute,
  galleryRoute,
  selectionSuccessRoute,
]);

const hashHistory = createHashHistory();

const router = createRouter({
  routeTree,
  history: hashHistory,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </>
  );
}
