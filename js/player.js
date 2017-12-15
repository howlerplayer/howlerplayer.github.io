// Кэширование элементов для ускорения загрузки
// Это нужно
// В конце список нужно будет проверить и убрать те элементы, которых нет в коде
var elms = ['track', 'timer', 'duration', 'playBtn', 'pauseBtn', 'prevBtn', 'nextBtn', 'playlistBtn', 'volumeBtn', 'progress', 'bar', 'wave', 'loading', 'playlist', 'list', 'volume', 'barEmpty', 'barFull', 'sliderBtn'];
elms.forEach(function(elm) {
  window[elm] = document.getElementById(elm);
});

// Создаём функцию проигрывания плейлиста

var Player = function(playlist) {
  this.playlist = playlist;
  this.index = 0;

  // Выводим заголовок первого трека
  track.innerHTML = '1. ' + playlist[0].title;

  // Отображение плейлиста на экране
  // Для каждого трека создаётся класс list-song
  // Выводится название трека - song.title
  // При клике по названию трека запускается его проигрывание 
  playlist.forEach(function(song) {
    var div = document.createElement('div');
    div.className = 'list-song';
    div.innerHTML = song.title;
    div.onclick = function() {
      player.skipTo(playlist.indexOf(song));
    };
    list.appendChild(div);
  });
};

Player.prototype = {
  // Проигрывание песни в плейлисте
  // index - порядковый номер песни в плейлисте
  // если index не указан, проигрывается первая или текущая
  play: function(index) {
    var self = this;
    var sound;

    index = typeof index === 'number' ? index : self.index;
    var data = self.playlist[index];

    // Если мы уже загрузили трек, проигрываем его
    // Если нет, загружаем новый трек
    if (data.howl) {
      sound = data.howl;
    } else {
      sound = data.howl = new Howl({

        // Указываем где искать ссылку на трек
        src: [data.file],
        html5: true, // Включаем HTML5 
        onplay: function() {
          // Выводим продолжительность каждого трека.
          // Куда же мы его выводим, раз элемента duration нет?
          duration.innerHTML = self.formatTime(Math.round(sound.duration()));

          // Анимация проигрывания. Не нужно. Потом удалить.
          requestAnimationFrame(self.step.bind(self));

          // Запустите анимацию волны, если мы уже загрузили. 
          // Не нужно. Потом удалить.
          wave.container.style.display = 'block';
          bar.style.display = 'none';
          pauseBtn.style.display = 'block';
        },
        onload: function() {
          // Начало анимации волны.
          wave.container.style.display = 'block';
          bar.style.display = 'none';
          loading.style.display = 'none';
        },
        onend: function() {
          // Конец анимации волны.
          wave.container.style.display = 'none';
          bar.style.display = 'block';
          self.skip('right');
        },
        onpause: function() {
          // Конец анимации волны.
          wave.container.style.display = 'none';
          bar.style.display = 'block';
        },
        onstop: function() {
          // Конец анимации волны.
          wave.container.style.display = 'none';
          bar.style.display = 'block';
        }
      });
    }

    // Начинаем проигрывание трека
    sound.play();

    // Обновляем номер и название трека в хедере
    // Добавить артиста
    track.innerHTML = (index + 1) + '. ' + data.title;

    // Отображаем кнопку Pause
    if (sound.state() === 'loaded') {
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'block';
    } else {
      loading.style.display = 'block';
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'none';
    }

    // Сохраняем индекс проигрываемого трека 
    self.index = index;
  },

  /**
   * Приостановка текущего воспроизведения
   */
  pause: function() {
    var self = this;

    // Получаем трек для проигрывания
    var sound = self.playlist[self.index].howl;

    // Делаем паузу
    sound.pause();

    // Отображаем кнопку Play
    playBtn.style.display = 'block';
    pauseBtn.style.display = 'none';
  },

  /**
   * Переход к следующему или предыдущему треку.
   * @param  {String} direction 'next' or 'prev'.
   */
  skip: function(direction) {
    var self = this;

    // Получаем следующий трек 'next' или 'prev'
    var index = 0;
    if (direction === 'prev') {
      index = self.index - 1;
      if (index < 0) {
        index = self.playlist.length - 1;
      }
    } else {
      index = self.index + 1;
      if (index >= self.playlist.length) {
        index = 0;
      }
    }

    self.skipTo(index);
  },

  /**
   * Переход к определенному треку на основе его индекса в списке воспроизведения.
   * @param  {Number} index Index in the playlist.
   */
  skipTo: function(index) {
    var self = this;

    // Остановка текущей дорожки
    if (self.playlist[self.index].howl) {
      self.playlist[self.index].howl.stop();
    }

    // Сбрасываем прогресс
    progress.style.width = '0%';

    // Переходим к следующему треку
    self.play(index);
  },

  /**
   * Устанавливаем громкость и обновляем дисплей слайдера громкости.
   * @param  {Number} val Volume between 0 and 1.
   */
  volume: function(val) {
    var self = this;

    // Применяем громкость ко всем трекам
    Howler.volume(val);

    // Обновляем отображение громкости на панели звука
    var barWidth = (val * 90) / 100;
    barFull.style.width = (barWidth * 100) + '%';
    sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
  },

  /**
   * Установка новой позиции в текущем треке
   * @param  {Number} per Percentage through the song to skip.
   */
  seek: function(per) {
    var self = this;

    // Получаем текущий трек
    var sound = self.playlist[self.index].howl;

    // Находим новую позицию проигрывания
    if (sound.playing()) {
      sound.seek(sound.duration() * per);
    }
  },

  /**
   * The step called within requestAnimationFrame to update the playback position.
   */
  step: function() {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Determine our current seek position.
    var seek = sound.seek() || 0;
    timer.innerHTML = self.formatTime(Math.round(seek));
    progress.style.width = (((seek / sound.duration()) * 100) || 0) + '%';

    // If the sound is still playing, continue stepping.
    if (sound.playing()) {
      requestAnimationFrame(self.step.bind(self));
    }
  },

  /**
   * Показать/скрыть список воспроизведения
   Надо будет сделать постоянно отображаемым
   */
  togglePlaylist: function() {
    var self = this;
    var display = (playlist.style.display === 'block') ? 'none' : 'block';

    setTimeout(function() {
      playlist.style.display = display;
    }, (display === 'block') ? 0 : 500);
    playlist.className = (display === 'block') ? 'fadein' : 'fadeout';
  },

  /**
   * Показать/скрыть шкалу звука
   Надо будет сделать постоянно отображаемой
   */
  toggleVolume: function() {
    var self = this;
    var display = (volume.style.display === 'block') ? 'none' : 'block';

    setTimeout(function() {
      volume.style.display = display;
    }, (display === 'block') ? 0 : 500);
    volume.className = (display === 'block') ? 'fadein' : 'fadeout';
  },

  /**
   * Перевод времени воспроизведения от секунд к минутам и секундам
   * @param  {Number} secs Seconds to format.
   * @return {String}      Formatted time.
   */
  formatTime: function(secs) {
    var minutes = Math.floor(secs / 60) || 0;
    var seconds = (secs - minutes * 60) || 0;

    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  }
};

// Загружаем плейлист из файла songs.js
var player = new Player(
  CreatePlayer()
);

// Элементы управления плеером
playBtn.addEventListener('click', function() {
  player.play();
});
pauseBtn.addEventListener('click', function() {
  player.pause();
});
prevBtn.addEventListener('click', function() {
  player.skip('prev');
});
nextBtn.addEventListener('click', function() {
  player.skip('next');
});
// Волна. Надо будет удалить
waveform.addEventListener('click', function(event) {
  player.seek(event.clientX / window.innerWidth);
});
// Кнопка Показать плейлист. Надо будет удалить
playlistBtn.addEventListener('click', function() {
  player.togglePlaylist();
});
// Кнопка Показать плейлист. Надо будет удалить
playlist.addEventListener('click', function() {
  player.togglePlaylist();
});
// Кнопка Показать шкалу звука. Надо будет удалить
volumeBtn.addEventListener('click', function() {
  player.toggleVolume();
});
// Кнопка Показать шкалу звука. Надо будет удалить
volume.addEventListener('click', function() {
  player.toggleVolume();
});

// Добавляем слушателей событий.
barEmpty.addEventListener('click', function(event) {
  var per = event.layerX / parseFloat(barEmpty.scrollWidth);
  player.volume(per);
});
sliderBtn.addEventListener('mousedown', function() {
  window.sliderDown = true;
});
sliderBtn.addEventListener('touchstart', function() {
  window.sliderDown = true;
});
volume.addEventListener('mouseup', function() {
  window.sliderDown = false;
});
volume.addEventListener('touchend', function() {
  window.sliderDown = false;
});

var move = function(event) {
  if (window.sliderDown) {
    var x = event.clientX || event.touches[0].clientX;
    var startX = window.innerWidth * 0.05;
    var layerX = x - startX;
    var per = Math.min(1, Math.max(0, layerX / parseFloat(barEmpty.scrollWidth)));
    player.volume(per);
  }
};

volume.addEventListener('mousemove', move);
volume.addEventListener('touchmove', move);

// Setup the "waveform" animation.
var wave = new SiriWave({
    container: waveform,
    width: window.innerWidth,
    height: window.innerHeight * 0.3,
    cover: true,
    speed: 0.03,
    amplitude: 0.7,
    frequency: 2
});
wave.start();

// Update the height of the wave animation.
// These are basically some hacks to get SiriWave.js to do what we want.
var resize = function() {
  var height = window.innerHeight * 0.3;
  var width = window.innerWidth;
  wave.height = height;
  wave.height_2 = height / 2;
  wave.MAX = wave.height_2 - 4;
  wave.width = width;
  wave.width_2 = width / 2;
  wave.width_4 = width / 4;
  wave.canvas.height = height;
  wave.canvas.width = width;
  wave.container.style.margin = -(height / 2) + 'px auto';

  // Update the position of the slider.
  var sound = player.playlist[player.index].howl;
  if (sound) {
    var vol = sound.volume();
    var barWidth = (vol * 0.9);
    sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
  }
};
window.addEventListener('resize', resize);
resize();