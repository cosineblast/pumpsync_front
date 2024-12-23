import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { create } from "zustand";

import run, { UpdateStage } from "@/client";

import { Loader2, TriangleAlert } from "lucide-react";

import { match, P } from "ts-pattern";

import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import { parseYoutubeLink } from "./parseYoutube";

const MAX_FILE_SIZE = 512 * 1024 * 1024;

const MAX_FILE_SIZE_NAME = "512MiB";

type EditStatus =
  | { status: "none" }
  | { status: "loading", stage: UpdateStage | null }
  | {
      status: "done";
      url: string;
    }
  | { status: "audio_locate_failed" }
  | { status: "download_failed" }
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
  resetStatusAndLink: () => void;
}

function canEdit(model: FormModel): boolean {
  const videoId = parseYoutubeLink(model.youtubeUrl);

  if (
    model.errorMessage !== null ||
    model.youtubeUrl == "" ||
    model.gameplayVideo === null ||
    videoId == null
  ) {
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
        errorMessage: "This doesn't look like a valid youtube video link",
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
        set({ gameplayVideo: file, errorMessage: null });
      }
    }
  },

  sendVideo: async () => {
    const model = get();

    const videoId = parseYoutubeLink(model.youtubeUrl);

    if (
      model.errorMessage !== null ||
      model.youtubeUrl == "" ||
      model.gameplayVideo === null ||
      videoId == null
    ) {
      console.log("uhh");
      return;
    }

    set({ editStatus: { status: "loading", stage: null } });

    console.log("LET'S GO");

    try {
      pipe(
        await run(videoId, 
                  model.gameplayVideo,
                 (stage) => {
                     set({ editStatus: { status: 'loading', stage: stage }})
                 }),
        E.match(
          reason => 
          match(reason)
            .with('locate_failed', () => set({ editStatus: { status: "audio_locate_failed" } }))
            .with('download_failed', () => set({ editStatus: { status: "download_failed" } }))
            .exhaustive()
          ,
          (downloadLink) =>
            set({ editStatus: { status: "done", url: downloadLink } }),
        ),
      );
    } catch (error) {
      console.error(error);
      set({ editStatus: { status: "error" } });
    }
  },

  resetStatus: () => {
    set({ editStatus: { status: "none" } });
  },

  resetStatusAndLink: () => {
      set({editStatus: {status: 'none'}, youtubeUrl: ''})
  }
}));

function looksLikeYoutubeLink(link: string): boolean {
  return parseYoutubeLink(link) !== null;
}

export function TheForm() {
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

          <small> Max filesize: 500MB </small>
        </div>

        {model.errorMessage !== null ? (
          <div className="mt-5 text-red">
            <Alert>
              <TriangleAlert className="h-4 w-4" />
              <AlertDescription> {model.errorMessage} </AlertDescription>
            </Alert>
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

                <div className="text-center">
                  <small>Note: This link will expire after 20 minutes.</small>
                </div>
              </a>
            ))
            .with({ status: "loading", stage: P.select() }, stage => (
              <Button className="w-full mt-10" disabled>
                <Loader2 className="animate-spin" />

                {
                    match(stage)
                    .with(null, () => '...')
                    .with('upload', () => 'Uploading...')
                    .with('edit', () => 'Editing...')
                    .exhaustive()
                }
              </Button>
            ))
            .with({ status: "error" }, () => (
              <div>
                <Button className="w-full mt-10" disabled variant="destructive">
                  Video Edit Failed x-x
                </Button>

                <Button
                  className="mt-3"
                  onClick={model.resetStatus}
                  variant="secondary"
                >
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
            .with({ status: "audio_locate_failed" }, () => (
              <div>
                <Button className="w-full mt-10" disabled>
                  Not gonna happen.
                </Button>

                <div>
                  <small>
                    {" "}
                    I tried, but I can't hear the music in the gameplay video at
                    all, sorry.{" "}
                  </small>
                </div>

                <Button
                  className="w-full mt-2"
                  onClick={model.resetStatus}
                  variant="secondary"
                >
                  <small> Try another video </small>
                </Button>
              </div>
            ))
            .with({ status: "download_failed" }, () => (
              <div>
                <Button className="w-full mt-10" disabled>
                  Nuh uh
                </Button>

                <div>
                  <small> I've tried but can't download from the youtube link you provided, sorry. </small>
                </div>

                <Button
                  className="w-full mt-2"
                  onClick={model.resetStatusAndLink}
                  variant="secondary"
                >
                  <small> Try again </small>
                </Button>
              </div>
            ))
            .exhaustive()
        }
      </div>
    </div>
  );
}
