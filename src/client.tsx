import { finalization } from "process";

const endpoint = "ws://127.0.0.1:1323/run"

function connect(url: string): Promise<WebSocket> {

    return new Promise((resolve, reject) => {
        const socket = new WebSocket(endpoint);

        const errorListener = (error: any) => {
            socket.removeEventListener("error", errorListener)
            reject(error);
        };

        socket.addEventListener("error", errorListener);

        socket.addEventListener("open", () => {
            socket.removeEventListener("error", errorListener)
            resolve(socket);
        });
    })
}

// Assumes the socket has no 'message' event listener, and adds one that reads
// a single message, and resolves with such message.
function nextMessage(socket: WebSocket): Promise<any> {
    return new Promise((resolve, reject) => {

        let errorListener: null | ((error: any) => void) = null;

        const messageListener = (event: MessageEvent<any>) => {
            socket.removeEventListener('error', errorListener!);
            socket.removeEventListener('message', messageListener);
            resolve(event.data)
        };

        errorListener = (error: any) => {
            socket.removeEventListener('error', errorListener!);
            socket.removeEventListener('message', messageListener);
            reject(error);
        }

        socket.addEventListener('message', messageListener);
        socket.addEventListener('error', errorListener);
    })
}

async function waitForOk(socket: WebSocket) {
    const responseString  = await nextMessage(socket);

    const response = JSON.parse(responseString);

    if (response['status'] != 'ok') {
      throw new Error(response['error']);
    }
}

export default async function run(url: string, video: File): Promise<string> {

    const socket = await connect(url);

    console.log("alright?")

    try {
        socket.send(JSON.stringify({
            type: 'overwrite_audio',
            link: url,
            file_size: video.size
        }))

        socket.send(video);

        await waitForOk(socket);

        const response = JSON.parse(await nextMessage(socket))

        if (response['status'] != 'done') {
          throw new Error('ws error:' + response['error']);
        }

        return response['result_id']
    }
    finally {
        socket.close();
    }


}
