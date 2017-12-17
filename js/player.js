// Кэширование элементов для ускорения загрузки
// Это нужно
// В конце список нужно будет проверить и убрать те элементы, которых нет в коде
var elms = ['track', 'timer', 'duration', 'playBtn', 'pauseBtn', 'prevBtn', 'nextBtn', 'progress', 'playlist', 'list', 'volume', 'barEmpty', 'barFull', 'sliderBtn'];
elms.forEach(function(elm) {
  window[elm] = document.getElementById(elm);
});

// Создаём функцию проигрывания плейлиста
var Player = function(playlist) {
  this.playlist = playlist;
  this.index = 0;

  // Выводим заголовок первого трека
  track.innerHTML = '1. ' + playlist[0].artist + ' - ' + playlist[0].title;

  // Отображение плейлиста на экране
  // Для каждого трека создаётся класс list-song
  // Выводится название трека - song.title
  // При клике по названию трека запускается его проигрывание 
  playlist.forEach(function(song) {
    var div = document.createElement('div');
    div.className = 'list-song';
    div.innerHTML = song.artist + ' - ' + song.title + ' | ' + song.duration;
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
        // Функция проигрывания трека
        onplay: function() {
          // Выводим продолжительность каждого трека.
          // Куда же мы его выводим, раз элемента duration нет?
          duration.innerHTML = self.formatTime(Math.round(sound.duration()));
          // Отображаем проигрывание трека в шкале прогресса
        requestAnimationFrame(self.step.bind(self));
          // Отображаем кнопку Pause
          pauseBtn.style.display = 'block';
        },
        onload: function() {
        },
        onend: function() {
          self.skip('right');
        },
        onpause: function() {
        },
        onstop: function() {
        }
      });
    }

    // Начинаем проигрывание трека
    sound.play();

    // Обновляем номер и название трека в хедере
    
    track.innerHTML = (index + 1) + '. ' + data.artist + ' - ' + data.title;

    // Отображаем кнопку Pause
    if (sound.state() === 'loaded') {
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'block';
    } else {      
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'block';
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
    progress.style.width = '15%';

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

// Регулируем громкость
var soundVolume = document.getElementById("soundVolume");
soundVolume.addEventListener('input', function() { 
  player.volume(soundVolume.value);
});

// Включаем/выключаем звук кнопкой Mute

function muter() {
  if (soundVolume.value == 0) {
    player.volume(restoreValue);
    soundVolume.value = restoreValue;
    muteButton.style.opacity = 1;
  } else {
    player.volume(0);
    restoreValue = soundVolume.value;
    soundVolume.value = 0;
    muteButton.style.opacity = 0.4;
  }
}

var muteButton = document.getElementById("muteButton");
muteButton.addEventListener("click", muter);