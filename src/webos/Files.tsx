import { useRef, useState } from "react";
import Icon from "../components/Icon";
import { readPreference } from "../lib/preferences";
type Entry = {
  id: string;
  name: string;
  parent: string;
  folder: boolean;
  content: string;
  trashed?: boolean;
};
const initial: Entry[] = [
  { id: "docs", name: "Documents", parent: "root", folder: true, content: "" },
  {
    id: "welcome",
    name: "Welcome.txt",
    parent: "docs",
    folder: false,
    content:
      "Welcome to your Satona desktop.\n\nThese are virtual files saved in this browser. Create folders, write notes, import text files, or download a copy. They are separate from your computer's real files.\n\nMake yourself at home.",
  },
];
export default function Files() {
  const [entries, setEntries] = useState<Entry[]>(() =>
    readPreference("satona.os.files", initial),
  );
  const [folder, setFolder] = useState("root");
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [name, setName] = useState("");
  const [editName, setEditName] = useState("");
  const [status, setStatus] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const item = entries.find((f) => f.id === selected);
  function persist(next: Entry[]) {
    try {
      localStorage.setItem("satona.os.files", JSON.stringify(next));
      setEntries(next);
      setStatus("Saved on this device");
      return true;
    } catch {
      setStatus("Storage full. Download a copy before closing.");
      return false;
    }
  }
  function create(isFolder: boolean) {
    const n = name.trim();
    if (!n) {
      setStatus("Enter a name first.");
      return;
    }
    if (
      entries.some((f) => !f.trashed && f.parent === folder && f.name === n)
    ) {
      setStatus("That name already exists here.");
      return;
    }
    const entry = {
      id: crypto.randomUUID(),
      parent: folder,
      name: n,
      folder: isFolder,
      content: "",
    };
    if (persist([...entries, entry])) setName("");
  }
  function download() {
    if (!item) return;
    const blob = new Blob([draft], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const visible = entries.filter((e) =>
    folder === "trash" ? e.trashed : !e.trashed && e.parent === folder,
  );
  return (
    <div className="os-files">
      <aside>
        <h3>My space</h3>
        <button
          onClick={() => {
            setFolder("root");
            setSelected(null);
          }}
        >
          ⌂ All files
        </button>
        <button
          onClick={() => {
            setFolder("docs");
            setSelected(null);
          }}
        >
          ▱ Documents
        </button>
        <button
          onClick={() => {
            setFolder("trash");
            setSelected(null);
          }}
        >
          ♲ Trash
        </button>
        <p>
          Virtual files
          <br />
          Stored on this device
        </p>
      </aside>
      <main>
        <header>
          <button
            aria-label="Parent folder"
            disabled={folder === "root"}
            onClick={() => {
              setFolder(entries.find((e) => e.id === folder)?.parent || "root");
              setSelected(null);
            }}
          >
            ↑
          </button>
          <strong>
            {folder === "root"
              ? "My files"
              : folder === "trash"
                ? "Trash"
                : entries.find((e) => e.id === folder)?.name}
          </strong>
          <button onClick={() => input.current?.click()}>Import text</button>
          <input
            hidden
            ref={input}
            type="file"
            accept=".txt,.md,.json,.csv,text/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 500000) {
                setStatus("Choose a text file smaller than 500 KB.");
                return;
              }
              const content = await file.text();
              persist([
                ...entries,
                {
                  id: crypto.randomUUID(),
                  name: file.name,
                  parent: folder === "trash" ? "root" : folder,
                  folder: false,
                  content,
                },
              ]);
              e.target.value = "";
            }}
          />
        </header>
        {folder !== "trash" && (
          <div className="os-file-create">
            <input
              aria-label="New file or folder name"
              value={name}
              placeholder="Name a new file or folder…"
              onChange={(e) => setName(e.target.value)}
            />
            <button onClick={() => create(false)}>+ File</button>
            <button onClick={() => create(true)}>+ Folder</button>
          </div>
        )}
        <div className="os-file-list">
          {visible.map((e) => (
            <div key={e.id} className={selected === e.id ? "selected" : ""}>
              <button
                onClick={() => {
                  if (e.folder && !e.trashed) {
                    setFolder(e.id);
                    setSelected(null);
                  } else {
                    setSelected(e.id);
                    setDraft(e.content);
                    setEditName(e.name);
                  }
                }}
              >
                <Icon name="files" size={26} />
                <span>{e.name}</span>
                <small>
                  {e.folder ? "Folder" : `${e.content.length} characters`}
                </small>
              </button>
              <button
                aria-label={`${e.trashed ? "Restore" : "Trash"} ${e.name}`}
                onClick={() => {
                  persist(
                    entries.map((f) =>
                      f.id === e.id ? { ...f, trashed: !f.trashed } : f,
                    ),
                  );
                  setSelected(null);
                }}
              >
                {e.trashed ? "Restore" : "♲"}
              </button>
            </div>
          ))}
        </div>
        {!visible.length && (
          <p className="os-empty">A little space for something new.</p>
        )}
        {item && !item.folder && !item.trashed && (
          <div className="os-file-editor">
            <div>
              <input
                aria-label="File name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <button
                onClick={() => {
                  if (!editName.trim()) {
                    setStatus("A file needs a name.");
                    return;
                  }
                  persist(
                    entries.map((e) =>
                      e.id === item.id
                        ? { ...e, name: editName.trim(), content: draft }
                        : e,
                    ),
                  );
                }}
              >
                Save file
              </button>
              <button onClick={download}>Download</button>
            </div>
            <textarea
              aria-label="File contents"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </div>
        )}
        <p role="status">{status}</p>
      </main>
    </div>
  );
}
