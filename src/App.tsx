import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { create } from "zustand";

import run from "@/client";

const MAX_FILE_SIZE = 512 * 1024 * 1024;

const MAX_FILE_SIZE_NAME = "512MiB";

interface FormModel {
  youtubeUrl: string;
  gameplayVideo: File | null;
  errorMessage: string | null;
  resultUrl: string | null;

  urlTyped: (url: string) => void;
  fileSelected: (element: any) => void;
  sendVideo: () => Promise<void>;
}

const VALID_YOUTUBE_HOSTNAMES = [
  "youtube.com",
  "youtu.be",
  "www.youtube.com",
  "www.youtu.be",
];

const useFormModel = create<FormModel>((set, get) => ({
  youtubeUrl: "",
  gameplayVideo: null,
  errorMessage: null,
  resultUrl: null,

  urlTyped: (urlText: string) => {
    if (urlText === "") {
      set({ errorMessage: null });
      return;
    }

    let urlObject: URL | null = null;

    try {
      urlObject = new URL(urlText);
    } catch {
      urlObject = null;
    }

    if (urlObject == null) {
      set({ errorMessage: "This url is sus" });
      return;
    }

    if (!VALID_YOUTUBE_HOSTNAMES.find((it) => it === urlObject.hostname)) {
      console.log(urlObject.hostname);
      set({ errorMessage: "This url doesn't seem to come from youtube :/" });
      return;
    }

    set({ youtubeUrl: urlText, errorMessage: null });
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

  sendVideo: async() => {
    const model = get();

    if (model.errorMessage !== null) {
      console.log("uhh")
      return;
    }

    console.log("let's go")

    console.log(model.gameplayVideo)
    console.log(model.youtubeUrl)

    const response = await run(model.youtubeUrl, model.gameplayVideo!)

    set({resultUrl: response})
  },
}));

function TopBar() {
  return (
    <div className="flex justify-center pt-2 text-5xl pb-2 text-center">
      <div> PumpSync </div>
    </div>
  );
}

function TheForm() {
  const model = useFormModel()

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
          model.resultUrl !== null ? (
            <a href={model.resultUrl}>
            <Button className="w-full mt-10" variant="success"> Download </Button>
            </a>
          ):(
          <Button className="w-full mt-10" onClick={() => model.sendVideo()}> Send </Button>
          )
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
