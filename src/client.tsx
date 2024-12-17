const endpoint = "ws://127.0.0.1:1323/api/edit";

function connectToEditServer(): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    let socket: WebSocket;

    try {
      socket = new WebSocket(endpoint);
    } catch (error) {
      reject(error);
      return;
    }

    const errorListener = (error: any) => {
      socket.removeEventListener("error", errorListener);
      reject(error);
    };

    socket.addEventListener("error", errorListener);

    socket.addEventListener("open", () => {
      socket.removeEventListener("error", errorListener);
      resolve(socket);
    });
  });
}

// Assumes the socket has no 'message' event listener, and adds one that reads
// a single message, and resolves with such message.
function nextMessage(socket: WebSocket): Promise<any> {
  return new Promise((resolve, reject) => {
    let errorListener: null | ((error: any) => void) = null;

    const messageListener = (event: MessageEvent<any>) => {
      socket.removeEventListener("error", errorListener!);
      socket.removeEventListener("message", messageListener);
      socket.removeEventListener("close", closeListener);
      resolve(event.data);
    };

    errorListener = (error: any) => {
      socket.removeEventListener("error", errorListener!);
      socket.removeEventListener("message", messageListener);
      socket.removeEventListener("close", closeListener);
      reject(error);
    };

    const closeListener = () => {
      socket.removeEventListener("error", errorListener!);
      socket.removeEventListener("message", messageListener);
      socket.removeEventListener("close", closeListener);
      reject(new Error("Websocket connection was closed abruptly"));
    };

    socket.addEventListener("message", messageListener);
    socket.addEventListener("error", errorListener);
    socket.addEventListener("close", closeListener);
  });
}

async function waitForOk(socket: WebSocket) {
  const responseString = await nextMessage(socket);

  const response = JSON.parse(responseString);

  if (response["status"] != "ok") {
    throw new Error(response["error"]);
  }
}

export default async function run(url: string, video: File): Promise<string> {
  const socket = await connectToEditServer();

  try {
    socket.send(
      JSON.stringify({
        type: "overwrite_audio",
        link: url,
        file_size: video.size,
      }),
    );

    socket.send(video);

    await waitForOk(socket);

    const response = JSON.parse(await nextMessage(socket));

    if (response["status"] != "done") {
      throw new Error("ws error:" + response["error"]);
    }

    return response["result_id"];
  } finally {
    socket.close();
  }
}
