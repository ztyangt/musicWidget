(function () {

  const musicBg = document.querySelector(".music-bg-cover")
  const Audio = document.createElement('audio')
  const SliderBar = document.querySelector("#time-slider-box")
  const SliderFill = document.querySelector("#time-slider-line")
  const musicTitle = document.querySelector(".music-title")
  const musicSinger = document.querySelector(".music-singer")
  const endTime = document.querySelector(".music-time-end")
  const startTime = document.querySelector(".music-time-start")
  const playBtn = document.querySelector("#music-play")
  const pauseBtn = document.querySelector("#music-pause")
  const prevBtn = document.querySelector("#music-prev")
  const nextBtn = document.querySelector("#music-next")
  const lyricUl = document.querySelector("#lyric-wrapper")
  const songListUl = document.querySelector("#song-list")
  const playMode = document.querySelector("#music-play-mode")
  const modeIcon = document.querySelector("#play-mode-icon")
  const showMode = document.querySelector("#music-show-mode")

  const size = {
    liHeight: 25,
    containerHeight: 125
  }

  const modeIconArr = ["icon-xunhuanbofang", "icon-suijibofang", "icon-danquxunhuan"]
  const showModeArr = ["icon-bofangliebiao", "icon-geciweidianji"]

  let hasLyric = false
  let showIndex = 0
  let modeIndex = 0
  let lyricList = null
  let songList = null
  let currentSong = null
  let currentIndex = 0

  musicConfig = window.musicList

  initMusic(musicConfig[0].id, musicConfig[0].type)

  async function initMusic(id, server) {
    const musicData = await getMusic(id, server)

    if (musicData.code === 200) {
      songList = musicData.data.song_list

      currentSong = musicData.data.song_list[0]

      const listHtml = songList.map((song, index) => `<li data-index="${index}">${song.name}-<cite>${song.artist.map(artist => artist + " ").join(" ")}</cite></li>`).join("")
      songListUl.innerHTML = listHtml

      initSong()
    }
  }

  function getMusic(id, server) {
    return fetchGet("music/playlist", { id, server })
  }

  function getUrl(id, server) {
    return fetchGet("music/url", { id, server })
  }

  function getLyric(id, server) {
    return fetchGet("music/lyric", { id, server })
  }

  function initSong() {
    currentSong = songList[currentIndex]
    SliderFill.style.width = 0;
    musicBg.style.backgroundImage = `url(${currentSong.pic_url})`
    document.querySelector("body").style.backgroundImage = `url(${currentSong.pic_url})`
    musicTitle.innerHTML = currentSong.name
    musicSinger.innerHTML = currentSong.artist.map(artist => artist + " ")
    getUrl(currentSong.id, currentSong.source).then(res => {
      if (res.code === 200) {
        if (res.data.url === "") {
          nextBtn.click()
        } else {
          Audio.src = res.data.url
          if (playBtn.classList.contains("disnone")) {
            Audio.play()
          }
        }
      }
    })

    getLyric(currentSong.id, currentSong.source).then(res => {
      if (res.code === 200) {
        if (res.data.lyric === "") {
          hasLyric = false
          lyricUl.innerHTML = "<li class='no-lyric'>暂无歌词</li>"
          lyricUl.style.transform = `translateY(60px)`
        } else {
          hasLyric = true
          lyricList = res.data.lyric.split("\n").filter(s => s).map(s => {
            const parts = s.split(']')
            const timeParts = parts[0].replace('[', '').split(":");
            return {
              time: +timeParts[0] * 60 + +timeParts[1],
              words: parts[1]
            }
          }).filter(item => {
            if (item.time >= 0 && item.words !== '') return item
          })
          lyricUl.innerHTML = lyricList.map(item => `<li><span>${item.words}</span></li>`).join("")
        }
      }
    })
  }

  async function fetchGet(url, parms) {
    const baseUrl = "https://api.ztyang.cn/api/"
    const queryString = Object.keys(parms).map((key) => `${key}=${parms[key]}`).join('&');
    const fetchUrl = queryString ? `${url}?${queryString}` : url;
    try {
      const response = await fetch(baseUrl + fetchUrl, { method: 'GET' });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`请求 ${url} 失败:`, error);
      return Promise.reject(error);
    }
  }

  const toTime = (sec) => {
    sec = Math.floor(sec)
    let s = sec % 60 < 10 ? ('0' + sec % 60) : sec % 60
    let min = Math.floor(sec / 60) < 10 ? ('0' + Math.floor(sec / 60)) : Math.floor(sec / 60)
    return min + ':' + s
  }

  function setStatus(time) {
    const activeLi = document.querySelector(".on")
    activeLi && activeLi.classList.remove("on")
    const index = lyricList.findIndex(lrc => lrc.time > time + 0.6) - 1
    lyricUl.children[index] && lyricUl.children[index].classList.add("on")
    let top = -(size.liHeight * index + size.liHeight / 2 - size.containerHeight / 2)
    if (top > 0) {
      top = 0
    }
    lyricUl.style.transform = `translateY(${top}px)`
  }

  SliderBar.addEventListener("click", function (e) {
    const barRect = SliderBar.getBoundingClientRect();
    const fillWidth = e.clientX - barRect.left;
    const barWidth = barRect.right - barRect.left;
    const pregress = (fillWidth / barWidth * 100).toFixed(2) + '%';
    SliderFill.style.width = pregress;
    Audio.currentTime = (fillWidth / barWidth) * Audio.duration
  });

  Audio.addEventListener("canplay", function () {
    endTime.innerHTML = toTime(Audio.duration)
  })

  Audio.addEventListener("timeupdate", function () {
    const pregress = (Audio.currentTime / Audio.duration * 100).toFixed(2) + '%';
    startTime.innerHTML = toTime(Audio.currentTime)
    SliderFill.style.width = pregress;
    hasLyric && setStatus(Audio.currentTime)
  })

  Audio.addEventListener("ended", function () {
    if (modeIndex === 1) {
      currentIndex = Math.floor(Math.random() * songList.length)
    } else {
      if (currentIndex + 1 === songList) {
        currentIndex = 0
      } else {
        currentIndex = currentIndex + 1
      }
    }
    initSong()
  })

  playBtn.addEventListener("click", function () {
    playBtn.className = "disnone"
    pauseBtn.className = ""
    Audio.play()
  })

  pauseBtn.addEventListener("click", function () {
    playBtn.className = ""
    pauseBtn.className = "disnone"
    Audio.pause()
  })

  prevBtn.addEventListener("click", function () {
    if (currentIndex === 0) {
      currentIndex = songList.length - 1
    } else {
      currentIndex = currentIndex - 1
    }
    currentSong = songList[currentIndex]
    initSong()
  })

  nextBtn.addEventListener("click", function () {
    if (currentIndex === songList.length - 1) {
      currentIndex = 0
    } else {
      currentIndex = currentIndex + 1
    }
    currentSong = songList[currentIndex]
    initSong()
  })

  playMode.addEventListener("click", function () {
    if (modeIndex === 2) {
      modeIndex = 0
    } else {
      modeIndex += 1
    }
    modeIcon.className = `iconfont ${modeIconArr[modeIndex]}`
    if (modeIndex === 2) {
      Audio.loop = true
    } else {
      Audio.loop = false
    }
  })

  showMode.addEventListener("click", function () {
    showIndex = showIndex ? 0 : 1;
    showMode.className = `iconfont ${showModeArr[showIndex]}`
    if (showIndex === 1) {
      document.querySelector(".lyric-wrapper").classList.add("disnone")
      document.querySelector(".song-list-wrapper").classList.remove("disnone")

    } else {
      document.querySelector(".song-list-wrapper").classList.add("disnone")
      document.querySelector(".lyric-wrapper").classList.remove("disnone")
    }
  })

  songListUl.addEventListener("click", function (e) {
    if (e.target.tagName == 'LI') {
      currentIndex = Number(e.target.dataset.index)
      initSong()
    }
  })



})();