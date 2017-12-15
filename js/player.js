var player = new Howl({
  src: ['http://tronis.ru/music/305.mp3'],
  html5: true,
  autoplay: false,
  loop: false,
  volume: 1,
  preload: true,
  onplay: function() {
    console.log('11');

    // Display the title of playable track.
    document.getElementById('artist_top').innerHTML = 'Burito';
    document.getElementById('song_top').innerHTML = ' - Мегахит';
  }
});


playHeader.addEventListener('click', function() {
  player.play();
  document.getElementById('playHeader').style.display = 'none';
  document.getElementById('pauseHeader').style.display = 'block';
});

pauseHeader.addEventListener('click', function() {
  player.pause();
  document.getElementById('pauseHeader').style.display = 'none';
  document.getElementById('playHeader').style.display = 'block';
});

prevHeader.addEventListener('click', function() {
  player.skip('prev');
});
nextHeader.addEventListener('click', function() {
  player.skip('next');
});