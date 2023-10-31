import SpotifyWebApi from "spotify-web-api-node";
import fs from "node:fs";
import { jsonl } from "js-jsonl";
import delay from "delay";
import { got } from "got";
import queryString from "query-string";
import open from "open";
import inquirer from "inquirer";

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

var state = "sanetohusanteohu";
var scope = "playlist-modify-public";
await open(
  "https://accounts.spotify.com/authorize?" +
    queryString.stringify({
      response_type: "code",
      client_id: clientId,
      scope: scope,
      redirect_uri: "https://leondreamed.com",
      state: state,
    })
);

const { code } = await inquirer.prompt({
  name: "code",
  type: "input",
});

const iresponse = await got.post("https://accounts.spotify.com/api/token", {
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization:
      "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
  },
  body: `grant_type=authorization_code&redirect_uri=https://leondreamed.com&code=${code}`,
});
spotifyApi.setAccessToken(JSON.parse(iresponse.body).access_token);

const tracksToRemove = JSON.parse(
  fs.readFileSync("tracks-to-remove.json", "utf-8")
);

// chunk the tracks in 50s
for (let i = 0; i < tracksToRemove.length; i += 50) {
  const chunk = tracksToRemove.slice(i, i + 50);
  console.log("removing", i);
  await spotifyApi.removeTracksFromPlaylist(
    playlistId,
    chunk.map((track) => ({
      uri: track.uri,
    }))
  );
  console.log("removed", i);
  await delay(2000);
}
