const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const _ = require("lodash");
const webSockets = {};
const files = {};
io.on("connection", socket => {
  socket.on("host:register", id => {
    console.log(`${id} connected`);
    webSockets[id] = { clients: {}, socket, sharedFiles: {} };
  });
  socket.on("host:addFiles", ({ id, sharedFiles }) => {
    const newSharedFiles = sharedFiles;
    webSockets[id].sharedFiles = newSharedFiles;
    _.forEach(webSockets[id].clients, clientSocket => {
      clientSocket.emit("client:sendFileList", { id, files: newSharedFiles });
    });
  });

  socket.on("host:removeFile", ({ id, fileId }) => {
    delete webSockets[id].sharedFiles[fileId];
    delete files[fileId];
    _.forEach(webSockets[id].clients, clientSocket => {
      clientSocket.emit("client:removeFile", {
        id,
        fileId
      });
    });
  });

  socket.on("client:subscribe", ({ id, clientId }) => {
    if (webSockets[id]) {
      webSockets[id].clients[clientId] = socket;
      socket.emit("client:subscribe", {
        id,
        files: webSockets[id].sharedFiles
      });
    }
  });

  socket.on("client:download", ({ id, clientId, fileId }) => {
    if (webSockets[id]) {
      webSockets[id].socket.emit("host:download", { id, clientId, fileId });
    }
  });

  socket.on("host:download", ({ id, clientId, fileId, file }) => {
    files[fileId] = file;
    if (webSockets[id]) {
      webSockets[id].clients[clientId].emit("client:download", {
        id,
        fileId,
        file
      });
    }
  });

  socket.on("host:changed", ({ id, fileId, file }) => {
    if (files[fileId] === file) {
      return;
    }
    files[fileId] = file;
    _.forEach(webSockets[id].clients, clientSocket => {
      clientSocket.emit("client:changed", { id, fileId, file });
    });
  });

  socket.on("client:changed", ({ id, fileId, file }) => {
    if (files[fileId] === file) {
      return;
    }
    files[fileId] = file;
    if (webSockets[id]) {
      webSockets[id].socket.emit("host:changed", { fileId, file });
    }
  });

  socket.on("host:disconnected", id => {
    console.log(`${id} disconnected`);
    delete webSockets[id];
  });
  socket.on("client:disconnected", ({ id, clientId }) => {
    console.log(`client ${clientId} disconnected`);
    if (webSockets[id]) {
      delete webSockets[id].clients[clientId];
    }
  });
});
http.listen(5000, function() {
  console.log("listening on *:5000");
});
