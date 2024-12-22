/**
 * Parses the given url string and finds the ID of the youtube video it expresses.
 *
 * Returns null if the string doesn't look like a valid youtube link
 */
export function parseYoutubeLink(link: string): string | null {
  let url: URL;

  try {
    url = new URL(link);
  } catch {
    return null;
  }

  return parseDefaultYoutubeLink(url) ?? parseSharingYoutubeLink(url);
}

// Parses an youtube link like https://youtube.com/watch?v=id
function parseDefaultYoutubeLink(url: URL): string | null {
  // TODO: use fp-ts option
  const validHostnames = [
    "youtube.com",
    "m.youtube.com",
    "www.youtube.com",
    "www.m.youtube.com",
  ];

  if (!validHostnames.find((it) => it === url.hostname)) {
    return null;
  }

  if (url.pathname === "/watch") {
    const id = url.searchParams.get("v");

    if (id == null) {
      return null;
    }

    return checkId(id);
  }

  return null;
}

// Parses an youtube link like https://youtu.be/id
function parseSharingYoutubeLink(url: URL): string | null {
  const validHostnames = ["youtu.be"];

  if (!validHostnames.find((it) => it === url.hostname)) {
    return null;
  }

  // without the / at the start
  const id = url.pathname.substring(1);

  return checkId(id);
}

// Returns the given string if it is a valid youtube id, otherwise null
function checkId(id: string): string | null {
  const youtubeIdRegex = /^[a-zA-Z0-9\-\_]+$/g;

  if (id?.match(youtubeIdRegex)) {
    return id;
  }

  return null;
}
