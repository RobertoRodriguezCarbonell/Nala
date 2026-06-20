import { useEffect } from "react";
import { TitleBar } from "./components/layout/TitleBar";
import { TopBar } from "./components/layout/TopBar";
import { Sidebar } from "./components/layout/Sidebar";
import { CenterPanel } from "./components/layout/CenterPanel";
import { ResponsePanel } from "./components/layout/ResponsePanel";
import { AddServiceWizard } from "./components/wizard/AddServiceWizard";
import { useUiStore } from "./store/uiStore";
import { useServicesStore } from "./store/servicesStore";

export default function App() {
  const boot = useUiStore((s) => s.boot);
  const initServices = useServicesStore((s) => s.init);
  const wizardOpen = useServicesStore((s) => s.wizardOpen);

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
    </div>
  );
}
