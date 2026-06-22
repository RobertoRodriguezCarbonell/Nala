import {
  FileJson, FormInput, KeyRound, GitCompareArrows, Braces,
  FlaskConical, ListOrdered, Radar, ShieldCheck, type LucideIcon,
} from "lucide-react";

export const LINKS = {
  download: "https://github.com/RobertoRodriguezCarbonell/Nala/releases/latest",
  github: "https://github.com/RobertoRodriguezCarbonell/Nala",
};

export interface Feature {
  icon: LucideIcon;
  title: string;
  text: string;
}

export const FEATURES: Feature[] = [
  { icon: FileJson, title: "Autoimportación OpenAPI", text: "Pega la URL de tu API y Nala lista sus endpoints desde el openapi.json, agrupados por tag. Refresca cuando quieras." },
  { icon: FormInput, title: "Formularios desde el esquema", text: "Inputs tipados por operación: enum → select, bool → toggle, array → repetible, objeto anidado. Con fallback a JSON crudo." },
  { icon: KeyRound, title: "Autenticación", text: "Bearer, API key y flujo de login. El token se guarda cifrado, con caducidad, y se inyecta solo en cada petición." },
  { icon: GitCompareArrows, title: "Diff de esquemas", text: "Compara dos snapshots y resalta los cambios — endpoints, params, tipos — marcando cuáles son breaking." },
  { icon: Braces, title: "Tipos + cliente TS", text: "Genera las interfaces de tus modelos y un cliente fetch tipado por operación. Sin dependencias de Node." },
  { icon: FlaskConical, title: "Smoke tests", text: "Marca peticiones como smoke y ejecútalas en lote contra el entorno activo. Resumen verde/rojo por status." },
  { icon: ListOrdered, title: "Secuencias multi-paso", text: "Encadena peticiones extrayendo datos de cada respuesta con JSONPath para el siguiente paso." },
  { icon: Radar, title: "Descubrimiento de localhost", text: "Detecta tus backends FastAPI corriendo en localhost y dalos de alta con un clic." },
  { icon: ShieldCheck, title: "Local-first", text: "Todo en tu máquina, sin cloud ni cuentas. Los secretos viajan cifrados al Credential Manager de Windows." },
];

export interface Step {
  n: string;
  title: string;
  text: string;
}

export const STEPS: Step[] = [
  { n: "01", title: "Da de alta tu API", text: "Pega la URL de tu backend FastAPI. Nala descarga su OpenAPI y lista todos los endpoints, agrupados por tag." },
  { n: "02", title: "Explora y prueba", text: "Rellena params y body con formularios tipados, autentícate y lanza la petición. Ves status, tiempo y respuesta al instante." },
  { n: "03", title: "Genera y automatiza", text: "Emite tipos y un cliente TypeScript, compara snapshots para cazar breaking changes, y automatiza con smoke tests y secuencias." },
];
