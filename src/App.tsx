import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { create } from "zustand";

import run from "@/client";

import { Loader2 } from "lucide-react";

import { match, P } from "ts-pattern";
import { executionAsyncId } from "async_hooks";

const MAX_FILE_SIZE = 512 * 1024 * 1024;

const MAX_FILE_SIZE_NAME = "512MiB";

type EditStatus =
  | { status: "none" }
  | { status: "loading" }
  | {
      status: "done";
      url: string;
    }
  | { status: "error" };

interface FormModel {
  youtubeUrl: string;
  gameplayVideo: File | null;
  errorMessage: string | null;
  editStatus: EditStatus;

  urlTyped: (url: string) => void;
  fileSelected: (element: any) => void;
  sendVideo: () => Promise<void>;
  resetStatus: () => void;
}

const useFormModel = create<FormModel>((set, get) => ({
  youtubeUrl: "",
  gameplayVideo: null,
  errorMessage: null,
  editStatus: { status: "none" },

  urlTyped: (link: string) => {
    if (link === "") {
      set({ errorMessage: null });
      return;
    }

    if (!looksLikeYoutubeLink(link)) {
      set({
        errorMessage: "This doesn't look like a valid youtube video link tbh",
      });
      return;
    }

    set({ youtubeUrl: link, errorMessage: null });
  },

  fileSelected: (element: HTMLInputElement) => {
    if (element.files?.length == 1) {
      const file = element.files[0];

      if (file.size > MAX_FILE_SIZE) {
        set({
          errorMessage: `Your file is too big (maximum size is ${MAX_FILE_SIZE_NAME})`,
        });
      } else {
        set({ gameplayVideo: file });
      }
    }
  },

  sendVideo: async () => {
    const model = get();

    const videoId = extractVideoIdFromYoutubeLink(model.youtubeUrl);

    if (
      model.errorMessage !== null ||
      model.youtubeUrl == "" ||
      model.gameplayVideo === null ||
      videoId == null
    ) {
      console.log("uhh");
      return;
    }

    set({ editStatus: { status: "loading" } });

    console.log("LET'S GO");

    try {
      const response = await run(videoId, model.gameplayVideo!);

      set({ editStatus: { status: "done", url: response } });
    } catch (error) {
      console.error(error);
      set({ editStatus: { status: "error" } });
    }
  },

  resetStatus: () => {
    set({ editStatus: { status: "none" } });
  },
}));

function looksLikeYoutubeLink(link: string): boolean {
  return extractVideoIdFromYoutubeLink(link) !== null;
}

function extractVideoIdFromYoutubeLink(link: string): string | null {
  let urlObject: URL;

  try {
    urlObject = new URL(link);
  } catch {
    return null;
  }

  const validHostnames = [
    "youtube.com",
    "youtu.be",
    "www.youtube.com",
    "www.youtu.be",
  ];

  if (!validHostnames.find((it) => it === urlObject.hostname)) {
    return null;
  }

  if (urlObject.pathname === "/watch") {
    return urlObject.searchParams.get("v");
  }

  // TODO: also handle other valid youtube schemes such as /v

  return null;
}

function TopBar() {
  return (
    <div className="flex justify-center pt-2 text-5xl pb-2 text-center">
      <div> PumpSync </div>
    </div>
  );
}

function TheForm() {
  const model = useFormModel();

  return (
    <div className="flex justify-center mt-5 items-center grow">
      <div className="w-full mx-3 sm:max-w-96 lg:min-w-96 bg-zinc-800 rounded-md p-5">
        <div className="mb-5">
          <div> Youtube Video URL </div>
          <Input
            onChange={(e) => model.urlTyped(e.target.value)}
            id="url"
            type="url"
          />
        </div>

        <div>
          <div> Gameplay Video </div>
          <Input
            id="video"
            type="file"
            accept=".mp4,mkv,.avi,.vid"
            onChange={(e) => model.fileSelected(e.target)}
          />
        </div>

        {model.errorMessage !== null ? (
          <div className="mt-5 text-red"> {model.errorMessage} </div>
        ) : (
          <></>
        )}

        {
          // TODO: use pattern matching lib
          match(model.editStatus)
            .with({ status: "done", url: P.select() }, (url) => (
              <a href={url}>
                <Button className="w-full mt-10" variant="success">
                  {" "}
                  Download{" "}
                </Button>
              </a>
            ))
            .with({ status: "loading" }, () => (
              <Button className="w-full mt-10" disabled>
                <Loader2 className="animate-spin" />
                Loading...
              </Button>
            ))
            .with({ status: "error" }, () => (
              <div>
                <Button className="w-full mt-10" disabled variant="destructive">
                  Video Edit Failed x-x
                </Button>

                <Button onClick={model.resetStatus} variant="ghost">
                  <small> I want to try again! </small>
                </Button>
              </div>
            ))
            .with({ status: "none" }, () => (
              <Button
                className="w-full mt-10"
                onClick={() => model.sendVideo()}
              >
                Edit
              </Button>
            ))
            .exhaustive()
        }
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />

      <TheForm />
    </div>
  );
}

export default App;
