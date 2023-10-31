import { jsonl } from "js-jsonl";
import fs from "node:fs";
import leven from "leven";

const items = jsonl.parse(
  fs.readFileSync("spotify.jsonl", "utf-8")
) as any[];

const tracks: any[] = [];

for (const item of items) {
  tracks.push({
    name: item.track.name,
    id: item.track.id,
    albumName: item.track.album.name,
    albumType: item.track.album.album_type,
    duration: item.track.duration_ms,
		uri: item.track.uri,
  });
}

// Sort tracks by name
tracks.sort((a, b) => a.name.localeCompare(b.name));

const duplicates = {};
for (let i = 1; i < tracks.length; i += 1) {
  if (
    tracks[i - 1].name === tracks[i].name &&
    tracks[i - 1].duration === tracks[i].duration
  ) {
    if (duplicates[tracks[i].name] === undefined) {
      duplicates[tracks[i].name] = [tracks[i - 1], tracks[i]];
    } else {
      duplicates[tracks[i].name].push(tracks[i]);
    }
  }
}

const keep = {};

for (const [trackName, tracks] of Object.entries(duplicates)) {
  // If there's only one track that's a single, choose it
  let numSingles = 0;
  for (const track of tracks) {
    if (track.albumType === "single") {
      numSingles += 1;
    }
  }

  if (numSingles === 1) {
    const singleTrack = tracks.find((track) => track.albumType === "single");
    keep[trackName] = singleTrack;
    continue;
  }

  let singles = tracks.filter((track) => track.albumType === "single");
  if (singles.length === 0) {
    singles = tracks;
  }

  // find the track where the album name is closest to leven of track name
  let closest = singles[0];
  let closestScore = leven(trackName, closest.albumName);
  for (const track of singles) {
    const score = leven(trackName, track.albumName);
    if (score < closestScore) {
      closest = track;
      closestScore = score;
    }
  }

  keep[trackName] = closest;
}

const trackIdsToRemove = [];
const tracksToRemove = [];

// Get tracks to remove
for (const [trackName, tracks] of Object.entries(duplicates)) {
  for (const track of tracks) {
    if (track.id !== keep[trackName].id) {
      trackIdsToRemove.push(track.id);
      tracksToRemove.push(track);
    }
  }
}

fs.writeFileSync("tracks-to-remove.json", JSON.stringify(tracksToRemove));
