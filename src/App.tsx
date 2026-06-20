import { useEffect } from "react";
import { TitleBar } from "./components/layout/TitleBar";
import { TopBar } from "./components/layout/TopBar";
import { Sidebar } from "./components/layout/Sidebar";
import { CenterPanel } from "./components/layout/CenterPanel";
import { ResponsePanel } from "./components/layout/ResponsePanel";
import { AddServiceWizard } from "./components/wizard/AddServiceWizard";
import { VariablesManager } from "./components/variables/VariablesManager";
import { useUiStore } from "./store/uiStore";
import { useServicesStore } from "./store/servicesStore";
import { useVariablesStore } from "./store/variablesStore";

export default function App() {
  const boot = useUiStore((s) => s.boot);
  const initServices = useServicesStore((s) => s.init);
  const wizardOpen = useServicesStore((s) => s.wizardOpen);
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
        <ResponsePanel />
      </div>
      {wizardOpen && <AddServiceWizard />}
      {variablesOpen && <VariablesManager />}
    </div>
  );
}
