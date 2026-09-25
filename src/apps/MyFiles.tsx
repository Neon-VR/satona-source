import Icon from "../components/Icon";

const files = [
  ["Documents", "files"],
  ["Downloads", "files"],
  ["Pictures", "files"],
  ["Music", "files"],
  ["Videos", "files"],
  ["Satona Projects", "files"],
];

export default function MyFiles() {
  return (
    <div className="utility-app files-app">
      <div className="utility-toolbar">
        <div>
          <strong>My Files</strong>
          <span>Home / Satona</span>
        </div>
        <button>
          <Icon name="plus" size={17} />
          New
        </button>
      </div>

      <div className="files-path">This PC / Satona</div>

      <div className="file-grid">
        {files.map(([name, icon]) => (
          <button className="file-card" key={name}>
            <Icon name={icon} size={36} />
            <span>{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
