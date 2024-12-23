export function About() {
  return (
    <div className="grow md:mx-40 mx-2">
      <h1 className="text-4xl mb-5"> What is this </h1>

      <p className="mb-2">
        PumpSync is a simple solution for editing Pump it Up gameplay videos.
      </p>

      <p className="mb-2">
        You can upload a video of someone playing Pump it Up, possibly with
        noisy background audio, and an youtube link that points to a video with
        the music that is played in the gameplay, and we will try our best to
        locate that audio in the video, overwrite it, and send it back to you.
      </p>

      <p className="mb-2">
        It also supports youtube videos with some menu screen and score screen UI audio before
        and after the music (e.g NEVSISTER videos). 

        The service will try to locate those and trim them out, if the UI happens to be fom XX or Phoenix.
      </p>

      <p>
        This project is still early in development, so you can expect plenty of
        bugs and a lot of downtime.
      </p>

      <p className="mt-5">
        {" "}
        Inspired by{" "}
        <a href="https://cobalt.tools/" className="text-blue-400">
          cobalt.tools
        </a>
        .
      </p>

      <h1 className="text-4xl mb-5 mt-5"> Source? </h1>

      <p>
        This project is entirely open source, the souce code for the frontend is
        currently available{" "}
        <a
          href="https://github.com/cosineblast/pumpsync_front"
          className="text-blue-400"
        >
          here
        </a>
        , and the video editing backend is available{" "}
        <a
          href="https://github.com/cosineblast/pumpsync"
          className="text-blue-400"
        >
          {" "}
          here
        </a>
        .
      </p>

      <h1 className="text-4xl mb-5 mt-5"> Please be gentle 🥺 </h1>

      <p>
        {" "}
        This project does not have a robust computing infrastructure, I'd
        appreciate if you didn't overload the backend or things like that.
      </p>

      <p className="mt-5 mb-10"> ~ Renan Ribeiro / manatinho / cosineblast </p>
    </div>
  );
}
