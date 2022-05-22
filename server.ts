import * as http from "http";

function requestListener(req: http.IncomingMessage, res: http.ServerResponse) {
    res.writeHead(200);
    res.end("Pong!");
}

function startServer(): void {
    const server = http.createServer(requestListener);
    const port = process.env.PORT || 8080;
    server.listen(port);
    console.log("Server started at port %s", port);
}

export default { startServer };
