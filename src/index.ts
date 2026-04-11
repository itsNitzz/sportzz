import express from "express";
import matchRouter from "./routes/match-routes.js";

const app = express();

app.use(express.json());

app.use("/main", matchRouter);

app.listen(8000, () => {
  console.log("Listening to server 8000");
});
