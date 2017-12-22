// Кэширование элементов для ускорения загрузки
var elms = ['track', 'timer', 'duration', 'playBtn', 'pauseBtn', 'prevBtn', 'nextBtn', 'progress', 'playlist', 'list', 'volume'];
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
  playlist.forEach(function(song) {
    var div = document.createElement('div');
    // Для каждого трека создаём див с классом list-song
    div.className = 'list-song';
    // Выводим название трека - song.artist + song.title и т.д
    div.innerHTML = song.artist + ' - ' + song.title + ' | ' + song.duration;
 // Добавляем каждому диву ссылку на скачивание трека   
    var aDownload = document.createElement('a');
    aDownload.className = 'download';
    div.appendChild(aDownload);
    aDownload.href=song.file;
    // Атрибут download поддерживают не все браузеры
    aDownload.download = 'file.mp3';    
    // Предотвращаем дальнейшее распространение событий при клике на кнопку "Download"
    aDownload.addEventListener("click", function(e) {  
      e.stopPropagation();
    });
    
    // Отключаем воспроизведение трека, если у него есть класс list-song1
    // И проигрываем, если этого класса нет
    // Научим плеер сохранять позицию проигрывания
    // Создаём переменную в которой сохраняем время проигрывания трека
    var timeSound;
    div.onclick = function() {      
      if(div.classList.contains("list-song1")) {
        player.pause();
        // Это наша песня, которая сейчас проигрывается
        var soundPlaylist = playlist[playlist.indexOf(song)].howl;
        // Устанавливаем новую позицию воспроизведения
        var seekPlaylist = soundPlaylist.seek() || 0;
        // Переводим значение в доли единицы разделив время уже проигранной части трека на общее время трека
        timeSound = seekPlaylist / soundPlaylist.duration();
        div.classList.remove("list-song1");
        div.classList.add("list-song");
      } else {  
        // Находим трек в плейлисте
        player.skipTo(playlist.indexOf(song));
        // Устанавливаем новую позицию воспроизведения
        player.seek(timeSound);
        // И новое значение полосы прогресса
        progress.style.width = ((timeSound * 100) || 0) + '%';
      }     
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
          // Выводим продолжительность каждого трека
          duration.innerHTML = self.formatTime(Math.round(sound.duration()));
          // Отображаем проигрывание трека в шкале прогресса
          requestAnimationFrame(self.step.bind(self));
          // Отображаем кнопку Pause
          pauseBtn.style.display = 'flex';
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
      pauseBtn.style.display = 'flex';
    } else {      
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'flex';
    }
    
    // Для всех треков в плейлисте проверяем наличие класса list-song1 и удаляем его
    // list-song1 это кнопка Пауза у трека в плейлисте
    var songLists = document.querySelectorAll("#list div");
    for(var i = 0; i < songLists.length; i++) {
      if(songLists[i].classList.contains("list-song1")) {
        songLists[i].classList.remove("list-song1");
        songLists[i].classList.add("list-song");
      }
      // index - индекс трека который сейчас проигрывается
      // По нему стилизуем кнопку трека, который проигрывается, в плейлисте добавляя ей класс list-song1
      if(i == index) {
        songLists[i].classList.remove("list-song");
        songLists[i].classList.add("list-song1");
      }
    }
    
    // Стилизуем кнопку трека при клике на кнопку Pause плеера
    pauseBtn.addEventListener("click", function() {
      for(var i = 0; i < songLists.length; i++) {
        if(songLists[i].classList.contains("list-song1")) {
          songLists[i].classList.remove("list-song1");
          songLists[i].classList.add("list-song");
        }
      }
    });  
            
    // Сохраняем индекс проигрываемого трека 
    self.index = index;
    
    // Перемещение полосы прогресса по шкале, если перемещать её мышкой и перемотка трека
    // Здесь будет ошибка в консоли, если трек ставить на паузу, потом запускать и перемещать ползунок
    // Описание ошибка по ссылке https://github.com/goldfire/howler.js/issues/718
    // Автор утверждает что пофиксил её 3 дня назад 
    // На самом деле он просто запретил перемещение ползунка после паузы, что не есть хорошо
    // Пока ошибку оставила из соображений: лучше ошибка в консоли, чем неработающий функционал
    var progressBar = document.querySelector(".duration-player");
    progressBar.addEventListener("click", function(e) {
      
      // Проверяем, что речь идёт об одном и том же треке
      if (self.index == index)  {
        progressValue = e.offsetX;  
        progressValueWidth = progressValue/(progressBar.offsetWidth);
        // Проверяем, что не вышли за границы времени трека
        if(progressValueWidth > 0 && progressValueWidth < 1) {        
          progress.style.width = (((progressValueWidth) * 100) || 0) + '%';
            player.seek(progressValueWidth);  
        }        
      }
    });
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
    playBtn.style.display = 'flex';
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
    
    // index - номер песни, которая сейчас проигрывается
    // По нему стилизуем кнопку в плейлисте при переходе к следующему/предыдущему треку
    // Этот фрагмент кода уже был выше, нужно было бы его в отдельную функцию вывести
    var songLists = document.querySelectorAll("#list div");
    for(var i = 0; i < songLists.length; i++) {
      if(songLists[i].classList.contains("list-song1")) {
        songLists[i].classList.remove("list-song1");
        songLists[i].classList.add("list-song");
      }
      if(i == index) {
        songLists[i].classList.remove("list-song");
        songLists[i].classList.add("list-song1");
      }
    }

  },

  /**
   * Устанавливаем громкость.
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
   * Обновление позиции воспроизведения
   */
  step: function() {
    var self = this;

    // Получаем трек, который сейчас проигрывается
    var sound = self.playlist[self.index].howl;
    // Определяем текущую позицию проигрывания
    var seek = sound.seek() || 0;
    
    // Отображаем время проигрывания в таймере и на шкале прогресса
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
// Здесь можно было сделать проще, у плеера есть функция mute()
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