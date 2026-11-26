import app from "./app.js";
import env from "./lib/env.js";

const port = Number(env("PORT", "3000"));

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
