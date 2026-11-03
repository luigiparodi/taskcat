import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import { Search } from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global command menu"
      className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 rounded-card border border-border bg-surface-1 p-2 shadow-lg"
    >
      <div className="flex items-center gap-2 border-b border-border px-2 pb-2">
        <Search className="size-4 text-muted-foreground" aria-hidden="true" />
        <Command.Input
          placeholder="Type a command or search..."
          className="h-9 w-full bg-transparent text-body outline-none placeholder:text-muted-foreground"
        />
      </div>
      <Command.List className="max-h-72 overflow-auto p-1">
        <Command.Empty className="px-2 py-6 text-center text-caption text-muted-foreground">
          No results found.
        </Command.Empty>
        <Command.Group heading="Navigation" className="text-caption text-muted-foreground">
          <Command.Item
            onSelect={() => {
              navigate("/projects");
              setOpen(false);
            }}
            className="flex cursor-pointer items-center gap-2 rounded-box px-2 py-1.5 text-body aria-selected:bg-muted"
          >
            Go to Projects
          </Command.Item>
          <Command.Item
            onSelect={() => {
              navigate("/admin");
              setOpen(false);
            }}
            className="flex cursor-pointer items-center gap-2 rounded-box px-2 py-1.5 text-body aria-selected:bg-muted"
          >
            Go to Admin
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
