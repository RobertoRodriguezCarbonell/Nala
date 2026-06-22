import { useUiStore } from "../../store/uiStore";
import { TabBar } from "../ui/TabBar";
import type { TabItem } from "../ui/TabBar";

type TabKey = "endpoints" | "diff" | "types" | "smoke" | "sequences" | "history";

const TABS: (TabItem & { key: TabKey })[] = [
  { key: "endpoints", label: "Endpoints", help: "Explora los endpoints del servicio (importados de su OpenAPI) y lánzalos desde el constructor de peticiones." },
  { key: "diff", label: "Diff de esquema", help: "Compara dos snapshots del esquema y resalta los cambios entre ellos (endpoints, params, body y respuesta), marcando cuáles son breaking." },
  { key: "types", label: "Tipos TS", help: "Genera las interfaces TypeScript de los modelos del servicio desde su esquema; puedes copiarlas o guardarlas a un archivo." },
  { key: "smoke", label: "Smoke", help: "Guarda peticiones y ejecútalas en lote contra el entorno activo; comprueba solo el status esperado (verde/rojo)." },
  {
    key: "sequences",
    label: "Secuencias",
    help: "Encadena peticiones guardadas extrayendo datos de cada respuesta (JSONPath) para el siguiente paso; se ejecuta contra el entorno activo.",
  },
  { key: "history", label: "Historial", help: "Registro de las peticiones lanzadas (estado, tiempo y tamaño), con la auth redactada y opción de reenviar." },
];

export function ServiceTabBar() {
  const serviceView = useUiStore((s) => s.serviceView);
  const setServiceView = useUiStore((s) => s.setServiceView);
  return <TabBar tabs={TABS} active={serviceView} onSelect={(k) => setServiceView(k as TabKey)} />;
}
