import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { LoadingSpinner } from "./LoadingStates";

function lazyNamed<TModule, TExport extends keyof TModule>(
  loader: () => Promise<TModule>,
  exportName: TExport,
) {
  return lazy(async () => {
    const module = await loader();
    const Component = module[exportName];

    if (!Component) {
      throw new Error(`Failed to load component "${String(exportName)}"`);
    }

    return { default: Component as ComponentType<unknown> };
  });
}

export const LazyMazeRunner = lazyNamed(
  () => import("../games/maze/MazeRunner"),
  "MazeRunner",
);

export const LazyLEDRunner = lazyNamed(
  () => import("../games/led/LEDRunner"),
  "LEDRunner",
);

export const LazySettingsPage = lazyNamed(
  () => import("../pages/SettingsPage"),
  "SettingsPage",
);

export const LazyConsentsPage = lazyNamed(
  () => import("../pages/ConsentsPage"),
  "ConsentsPage",
);

export const LazyMyClassesPage = lazyNamed(
  () => import("../pages/MyClassesPage"),
  "MyClassesPage",
);

interface LazyComponentWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  minHeight?: string;
}

export function LazyComponentWrapper({
  children,
  fallback,
  minHeight = "200px",
}: LazyComponentWrapperProps) {
  return (
    <Suspense
      fallback={
        fallback || (
          <div
            style={{
              minHeight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LoadingSpinner text="加载中..." />
          </div>
        )
      }
    >
      {children}
    </Suspense>
  );
}
