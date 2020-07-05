/// <reference types="monaco-editor-core/monaco"/>

import { listen, MessageConnection } from "vscode-ws-jsonrpc";
import {
  MonacoLanguageClient,
  MonacoServices,
  createConnection,
} from "monaco-languageclient";
import ReconnectingWebSocket from "reconnecting-websocket";

monaco.languages.register({
  id: "sql",
  extensions: [".sql"],
  aliases: ["SQL", "sql"],
  mimetypes: ["application/json"],
});

const value = `SELECT * FROM users`;
const editor = monaco.editor.create(document.getElementById("container")!, {
  model: monaco.editor.createModel(
    value,
    "sql",
    monaco.Uri.parse("inmemory://model.sql")
  ),
  glyphMargin: true,
  lightbulb: {
    enabled: true,
  },
});

MonacoServices.install(editor);

const URL = "ws://localhost:3000/server";
const webSocket = createWebSocket(URL) as WebSocket;
listen({
  webSocket,
  onConnection: (connection) => {
    const languageClient = createLanguageClient(connection);
    const disposable = languageClient.start();
    connection.onClose(() => disposable.dispose());
  },
});

function createLanguageClient(
  connection: MessageConnection
): MonacoLanguageClient {
  return new MonacoLanguageClient({
    name: "SQL Language Server MonacoClient",
    clientOptions: {
      documentSelector: ["sql"],
    },
    connectionProvider: {
      get: (errorHandler, closeHandler) => {
        return Promise.resolve(
          createConnection(connection, errorHandler, closeHandler)
        );
      },
    },
  });
}

function createWebSocket(url: string): ReconnectingWebSocket {
  const socketOptions = {
    maxReconnectionDelay: 10000,
    minReconnectionDelay: 1000,
    reconnectionDelayGrowFactor: 1.3,
    connectionTimeout: 10000,
    maxRetries: Infinity,
    debug: false,
  };
  return new ReconnectingWebSocket(url, [], socketOptions);
}