
const STORAGE_KEYS = [
  "universe-stars-v1",
  "universe-connections-v1",
  "universe-timeline-v1",
  "universe-snapshots-v1"
];

export function downloadUniverseBackup() {
  // Collect our existing browser data
  const storage = {};

  for (const key of STORAGE_KEYS) {
    storage[key] = localStorage.getItem(key);
  }

  // Build our backup package
  const backup = {
    format: "universe-backup-v1",
    exportedAt: new Date().toISOString(),
    storage
  };

  // Convert the backup into a JSON file
  const blob = new Blob(
    [JSON.stringify(backup, null, 2)],
    { type: "application/json" }
  );

  // Create a temporary download URL
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;

  link.download =
    `universe-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  // Clean up the temporary URL
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
