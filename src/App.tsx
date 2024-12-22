import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { create } from "zustand";

import run from "@/client";

import { Loader2, Info, Disc } from "lucide-react";

import { match, P } from "ts-pattern";

import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

const MAX_FILE_SIZE = 512 * 1024 * 1024;

const MAX_FILE_SIZE_NAME = "512MiB";

type EditStatus =
  | { status: "none" }
  | { status: "loading" }
  | {
      status: "done";
      url: string;
    }
  | { status: "audio_locate_failed" }
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

function canEdit(model: FormModel): boolean {

  const videoId = extractVideoIdFromYoutubeLink(model.youtubeUrl);

  if (model.errorMessage !== null ||
      model.youtubeUrl == "" ||
      model.gameplayVideo === null ||
      videoId == null) {
    return false;
  }

  return true;
}

const useFormModel = create<FormModel>((set, get) => ({
  editStatus: { status: "none" },
  youtubeUrl: "",
  gameplayVideo: null,
  errorMessage: null,

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
      pipe(
        await run(videoId, model.gameplayVideo!),
        E.match(
          (_err) => set({ editStatus: { status: 'audio_locate_failed' }}),
          (downloadLink) => set({ editStatus: { status: "done", url: downloadLink } })
        )
      );
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
  const base = import.meta.env.BASE_URL;

  return (
    <div className="flex justify-center pt-2 text-5xl pb-2 text-center h-20">

      <img src={`${base}/public/ps_down_left.svg`} className="hidden sm:block"/>
      <img src={`${base}/public/ps_up_left.svg`} className="hidden sm:block"/>

      <div className="mr-10 ml-10 text-yellow-900 font-bold"> PumpSync </div>

      <img src={`${base}/public/ps_up_right.svg` } className="hidden sm:block"/>
      <img src={`${base}/public/ps_down_right.svg`} className="hidden sm:block"/>

    </div>
  );
}

function TheForm() {
  const model = useFormModel();

  return (
    <div className="flex justify-center mt-5 items-center grow">
      <div className="w-full mx-3 sm:max-w-96 lg:min-w-96 bg-zinc-900 rounded-md p-5">
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
          <div className="mt-5 text-red"> 
          {model.errorMessage}
          </div>
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

                <Button className="mt-3" onClick={model.resetStatus} variant="secondary">
                  <small> I want to try again! </small>
                </Button>
              </div>
            ))
            .with({ status: "none" }, () => (
              <Button
                className="w-full mt-10"
                onClick={() => model.sendVideo()}
                disabled={!canEdit(model)}
              >
                Edit
              </Button>
            ))
            .with({ status: "audio_locate_failed"}, () =>
                (<div>
                 <Button
                 className="w-full mt-10"
                 disabled
                 >
                 Not gonna happen.
                 </Button>

                 <div>
                 <small> I tried, but I can't hear the music in the gameplay video at all, sorry. </small>
                 </div>

                <Button className="w-full mt-2" onClick={model.resetStatus} variant="secondary">
                  <small> Try another video </small>
                </Button>
                 </div>


                ))
            .exhaustive()
        }
      </div>
    </div>
  );
}

function BottomBar() {

  return <div className="flex justify-evenly border-t gap-5 py-2">

      <div className="flex flex-col items-center">
      <div>
        <Disc />
      </div>
      <div>
      Sync
      </div>
      </div>

      <div className="flex flex-col items-center">
      <div>
        <Info />
      </div>
      <div>
      About
      </div>
      </div>
      </div>
}

function App() {
  return (
    <div className="h-screen flex flex-col">
      <TopBar />

      <TheForm />

      <BottomBar />
    </div>
  );
}

export default App;
