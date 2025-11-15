import http from "http";
import app from "./app.js";
import connectDB from "./db/index.js";

const port = process.env.PORT || 3000

const server = http.createServer(app);
connectDB();

server.listen(port, ()=>{
    console.log("Server Running On Port ", port);
})
