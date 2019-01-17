const Markov = require('markovchain');
const readline = require('readline');
const mx = require('musixmatchlyrics');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
  
  if (tracks.length <= 0) {
    console.log(`Could not find tracks for artist ${answer}.`);
    process.exit(0);
    return;
  }

  let lyrics = [];
  tracks = tracks.filter(track => track.artist.toLowerCase() === answer.toLowerCase());
  for (let i = 0; i < tracks.length; ++i) {
    console.log(`Getting lyrics for ${tracks[i].title} (${i+1}/${tracks.length})`);
    let lyric = await getLyrics(tracks[i].url);
    lyrics.push(lyric[0].lyric);
  }

  console.log(`Processing lyrics into standard format...`);

  lyrics = lyrics.map(lyric => {
    lyric = lyric.replace(/\\([\s\S])/g, '$1');
    return lyric.split('\n');
  });

  console.log(`Analyzing lyric structure...`);

  let avgLineLength = 0, totalLines = 0;
  let wordList = new Set();
  let avgLineCount = 0, totalSongs = tracks.length;
  lyrics = lyrics.reduce((acc, el) => {
    avgLineCount += el.length;
    el.forEach(line => {
      let splitLine = line.split(' ');
      avgLineLength += splitLine.length;
      splitLine.forEach(word => wordList.add(word.toLowerCase()));
      ++totalLines;
    });
    return acc.concat(el);
  }, []);
  avgLineLength = Math.round(avgLineLength / totalLines);
  avgLineCount = Math.round(avgLineCount / totalSongs);

  console.log(`Training AI on these lyrics...\n`);
  
  const markov = new Markov(lyrics.join(' '), (word) => {
    return word.replace(/[^a-zA-Z-]/ig, '');
  });
  let output = '', padding = 0;
  const wordArray = [...wordList.values()];
  let lastWord = wordArray[Math.floor(Math.random() * wordList.size)];
  for (let i = 0; i < avgLineCount; ++i) {
    let generated = '';
     while (generated.split(' ').length <= 1) {
      generated = markov.start(lastWord).end(avgLineLength + padding).process();
      lastWord = wordArray[Math.floor(Math.random() * wordList.size)];
     }
    if (i === 0) {
      output += generated + '\n';
      padding = 1;
    }
    else {
      output += generated.split(' ').slice(1).join(' ') + '\n';
    }
    lastWord = generated.split(' ');
    lastWord = lastWord[lastWord.length - 1];
  }
  console.log(output);
  process.exit(0);
});