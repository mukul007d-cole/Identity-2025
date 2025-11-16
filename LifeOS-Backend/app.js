import express, { urlencoded } from "express";
import cors from "cors";
import routes from "./routes/index.js";
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use("/audio", express.static("public/audio"));
app.use(cors());
app.use(express.json());
app.use(urlencoded({extended : true}));

app.use('/api',routes);

export default app;