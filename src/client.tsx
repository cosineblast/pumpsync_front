import * as E from "fp-ts/Either";

import * as z from "zod";

import { match, P } from "ts-pattern";

const backendPrefix =
  import.meta.env["VITE_BACKEND_PREFIX"] ?? "ws://127.0.0.1:8000";

const editEndpoint = `${backendPrefix}/api/edit`;

function connectToEditServer(): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    let socket: WebSocket;

    try {
      socket = new WebSocket(editEndpoint);
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

const StatusMessage = z.discriminatedUnion("status", [
  z.object({ status: z.literal("ok") }),

  z.object({
    status: z.literal("error"),
    error: z.enum([
      "file_too_big",
      "parse_error",
      "negative_size",
      "protocol_violation",
      "server_error",
      "edit_failed",
      "edit_locate_failed",
      "edit_download_failed",
    ]),
  }),

  z.object({
    status: z.literal("done"),
    result_id: z.string(),
  }),
]);

type EditAbortedReason = "locate_failed" | "download_failed";


// right now, we are going to go with a generic 'edit' stage,
// but in the future this may be more sophisticated
// (e.g extracting audio, detecting phoenix or XX start etc)
export type UpdateStage = 'upload' | 'edit';

export default async function run(
  videoId: string,
  video: File,
  onStageUpdate: (update: UpdateStage) => void,
): Promise<E.Either<EditAbortedReason, string>> {
  const socket = await connectToEditServer();

  try {
    socket.send(
      JSON.stringify({
        type: "overwrite_audio",
        video_id: videoId,
        file_size: video.size,
      }),
    );

    onStageUpdate('upload');

    socket.send(video);

    await waitForOk(socket);
    
    onStageUpdate('edit');

    const response = StatusMessage.parse(JSON.parse(await nextMessage(socket)));

    return match(response)
      .with({ status: "error", error: "edit_locate_failed" }, () => {
        return E.left("locate_failed" as const);
      })
      .with({ status: "error", error: "edit_download_failed" }, () => {
        return E.left("download_failed" as const);
      })
      .with({ status: "error", error: P.select() }, (tag) => {
        throw new Error("response error:" + tag);
      })
      .with({ status: "ok" }, () => {
        throw new Error("server protocol violation");
      })
      .with({ status: "done", result_id: P.select() }, (id) => {
        return E.right(id);
      })
      .exhaustive();
  } finally {
    socket.close();
  }
}
