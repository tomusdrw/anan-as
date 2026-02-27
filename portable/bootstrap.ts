// Portable bootstrap for globals that must exist before assembly/portable executes.
const g = globalThis as Record<string, unknown>;
if (g.ASC_TARGET === undefined) {
  g.ASC_TARGET = 0;
}
