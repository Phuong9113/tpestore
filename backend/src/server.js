import dotenv from "dotenv";
import app from "./app.js";
import { startGhnSyncJob } from "./jobs/sync-ghn-status.js";

dotenv.config();

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
	// eslint-disable-next-line no-console
	console.log(`Server listening on http://${HOST}:${PORT}`);
  try {
    startGhnSyncJob();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[Cron][Init] Failed to start GHN sync job:", e?.message || e);
  }
});
