import { AuditsProvider } from "../contexts/AuditsContext";
import { WorkspacePage } from "./WorkspacePage";

export function AppLayout() {
  return (
    <AuditsProvider>
      <WorkspacePage />
    </AuditsProvider>
  );
}
