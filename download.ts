import fs from "node:fs";
import delay from "delay";
import SpotifyWebApi from "spotify-web-api-node";
import { jsonl } from "js-jsonl";
import { got } from "got";

const clientId = process.env.CLIENT_ID!;
const clientSecret = process.env.CLIENT_SECRET!;
const playlistId = process.env.PLAYLIST_ID!;

const spotifyApi = new SpotifyWebApi({
  clientId,
  clientSecret,
});

const formData = new FormData();
formData.append("grant_type", "client_credentials");
formData.append("client_id", clientId);
formData.append("client_secret", clientSecret);

const response = await got.post("https://accounts.spotify.com/api/token", {
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
});

const { access_token } = JSON.parse(response.body);
spotifyApi.setAccessToken(access_token);

if (fs.existsSync("spotify.jsonl")) {
  console.error("Please remove spotify.jsonl");
  process.exit(1);
}

for (let i = 0; i <= 52; i += 1) {
  console.log("fetching", i);
  const result = await spotifyApi.getPlaylistTracks(playlistId, {
    offset: i * 100,
  });
  console.log("fetched", i);
  fs.appendFileSync("spotify.jsonl", jsonl.stringify(result.body.items) + "\n");
  await delay(2000);
}
