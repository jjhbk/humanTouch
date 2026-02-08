import dotenv from "dotenv";
import app from "./app.js";
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, "../../../.env"),
});
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`HumanLayer API running on port ${PORT}`);
});
