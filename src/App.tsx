import { useEffect } from "react";
import { TitleBar } from "./components/layout/TitleBar";
import { TopBar } from "./components/layout/TopBar";
import { Sidebar } from "./components/layout/Sidebar";
import { CenterPanel } from "./components/layout/CenterPanel";
import { ResponsePanel } from "./components/layout/ResponsePanel";
import { ResizeHandle } from "./components/layout/ResizeHandle";
import { AddServiceWizard } from "./components/wizard/AddServiceWizard";
import { DiscoverModal } from "./components/discover/DiscoverModal";
import { VariablesManager } from "./components/variables/VariablesManager";
import { ConfirmModal } from "./components/common/ConfirmModal";
import { useUiStore } from "./store/uiStore";
import { useServicesStore } from "./store/servicesStore";
import { useVariablesStore } from "./store/variablesStore";

export default function App() {
  const boot = useUiStore((s) => s.boot);
  const serviceView = useUiStore((s) => s.serviceView);
  const initServices = useServicesStore((s) => s.init);
  const wizardOpen = useServicesStore((s) => s.wizardOpen);
  const discoverOpen = useServicesStore((s) => s.discoverOpen);
  const variablesOpen = useVariablesStore((s) => s.open);

  useEffect(() => {
    void boot();
    void initServices();
  }, [boot, initServices]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--bg-app)" }}>
      <TitleBar />
      <TopBar />
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <Sidebar />
        <CenterPanel />
        {serviceView === "endpoints" && (
          <>
            <ResizeHandle />
            <ResponsePanel />
          </>
        )}
      </div>
      {wizardOpen && <AddServiceWizard />}
      {discoverOpen && <DiscoverModal />}
      {variablesOpen && <VariablesManager />}
      <ConfirmModal />
    </div>
  );
}
