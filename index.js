const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const mx = require('musixmatchlyrics');
function toPromise(callback) {
  return function(arg) {
    return new Promise(res => {
      callback(arg, res);
    });
  };
}

const getTracks = toPromise(mx.tracks);
const getLyrics = toPromise(mx.get);

rl.question('Enter artist: ', async answer => {
  console.log(`Getting track list for ${answer}...`);
  let tracks = await getTracks(answer);
  let lyrics = [];
  tracks = tracks.filter(track => track.artist.toLowerCase() === answer.toLowerCase());
  for (let i = 0; i < tracks.length; ++i) {
    console.log(`Getting lyrics for ${tracks[i].title} (${i+1}/${tracks.length})`);
    let lyric = await getLyrics(tracks[i].url);
    lyrics.push(lyric[0].lyric);
  }

  console.log(`Processing lyrics into standard format...`);
  lyrics = lyrics.map(lyric => {
    return lyric.replace(/\\n|\n/g, ' ').replace(/\\([\s\S])/g, '$1');
  });

  console.log(lyrics);

});