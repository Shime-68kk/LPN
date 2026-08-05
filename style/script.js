// Cấu hình ngày bắt đầu yêu nhau (định dạng: YYYY-MM-DD hoặc YYYY-MM-DDTHH:MM:SS)
// Bạn có thể chỉnh sửa ngày này tùy ý nhé!
const ANNIVERSARY_DATE = "2024-03-08T00:00:00";

// Cấu hình Discord Webhook URL để nhận thông báo thời gian thật khi bấm nút đồng ý
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1534358624040910971/Cbckwdq-vB9yQmYaqNcHHFAbEVKfOdxe4G4NpF6q3kJDLmAopR92o-QP66dddtZe-Gg8";

function sendDiscordNotification(timeString) {
  if (DISCORD_WEBHOOK_URL) {
    fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: `💖 **Lệ Thủy đã đồng ý làm người yêu lúc:** ${timeString} \n👉 Hãy cập nhật ngày kỉ niệm cố định này vào file script.js để đồng bộ mọi thiết bị nhé!`
      })
    }).catch(err => console.error("Webhook notification failed:", err));
  }
}

const heartsContainer=document["body"],imageFiles=Array["from"]( {
'length':0x12
}
,(_0x4ee15e,_0x5c96d8)=>"style/img/Anh ("+(_0x5c96d8+0x1)+').jpg');
let letterText=[];
async function loadLetter() {
const _0x178f31= {
'CTevf':function(_0x1d57f3,_0x5a1f48) {
return _0x1d57f3(_0x5a1f48);
}
,'mtCfz':"Error loading letter.txt:",'thdbK':'Mãi yêu em ❤️'
}
;
try {
const _0x2fec4f=await _0x178f31["CTevf"](fetch,"style/letter.txt"),_0x2739ab=await _0x2fec4f['text']();
letterText=_0x2739ab['split'](/\n\s*\n/)["map"](_0x22ac78=>_0x22ac78["trim"]())["filter"](_0x3e16f3=>_0x3e16f3!=='');
}
catch(_0x305229) {
console["error"](_0x178f31["mtCfz"],_0x305229),letterText=[_0x178f31["thdbK"]];
}
}
loadLetter();
const songs=[ {
'title':"Ai Ngoài Anh",'cover':"style/sound/Anh (1).jpg",'src':"style/sound/Ai Ngoài Anh.mp3"
}
, {
'title':'In Love x Có Đôi Điều','cover':"style/sound/Anh (2).jpg",'src':"style/sound/In Love x Có Đôi Điều.mp3"
}
, {
'title':'Track 06 x Nơi Này Có Anh','cover':'style/sound/Anh (3).jpg','src':"style/sound/Track 06 x Nơi Này Có Anh.mp3"
}
, {
'title':'Lỡ Say Bye Là Bye','cover':"style/sound/Anh (4).jpg",'src':"style/sound/Lỡ Say Bye Là Bye.mp3"
}
, {
'title':"MISSING YOU",'cover':"style/sound/Anh (5).jpg",'src':"style/sound/MISSING YOU.mp3"
}
, {
'title':"Anh Là Ai ?",'cover':"style/sound/Anh (6).jpg",'src':"style/sound/Anh là ai.mp3"
}
];
function createHeart() {
const _0xddc5c= {
'cWOnN':"active",'bZiTV':function(_0x5d3ccd,_0x504457) {
return _0x5d3ccd===_0x504457;
}
,'PRkrX':'jidWT','NdNkA':'RAxTl','LVeRV':"div",'pXgoO':"heart",'FroYT':'https://i.pinimg.com/originals/b9/67/4f/b9674f3f995aba177250894d57f42bbf.gif','vRmLx':"https://i.pinimg.com/originals/4e/89/d3/4e89d3e4ec4b1f59b1664e880a875c65.gif",'CUpEy':'https://i.pinimg.com/originals/b6/6b/1b/b66b1bfe70a9ad4f69dea3b620011222.gif','PQqUC':function(_0x5815d9,_0x1a547e) {
return _0x5815d9>_0x1a547e;
}
,'KbtSI':function(_0x5ab539,_0x52dd09) {
return _0x5ab539!==_0x52dd09;
}
,'cgBFV':"YpNNN",'CRacQ':"auPcr",'JewYx':"img",'IKUTU':function(_0x14e2e0,_0x455f10) {
return _0x14e2e0*_0x455f10;
}
,'OXzFO':function(_0x1782b3,_0x10e386) {
return _0x1782b3+_0x10e386;
}
,'xwgvu':function(_0x18b673,_0x4db54d) {
return _0x18b673*_0x4db54d;
}
,'ngpfM':"auto",'rWvvv':function(_0x39a26f,_0x55b221) {
return _0x39a26f*_0x55b221;
}
,'BBQYn':function(_0x1cddbf,_0x301506) {
return _0x1cddbf+_0x301506;
}
,'itpTt':function(_0x131651,_0x4e1b32) {
return _0x131651+_0x4e1b32;
}
,'uIGdR':function(_0x4fc744,_0x12476c,_0x9126b0) {
return _0x4fc744(_0x12476c,_0x9126b0);
}
}
,_0x252665=document["createElement"](_0xddc5c["LVeRV"]);
_0x252665['classList']["add"](_0xddc5c['pXgoO']);
const _0x2fb601=['❤','💖','💗','💓','💕','🌸'],_0x2f1b08=['https://i.pinimg.com/originals/88/23/82/882382f97862c72e60fc06822e36eb55.gif',_0xddc5c["FroYT"],_0xddc5c["vRmLx"],_0xddc5c["CUpEy"]],_0x50fd96=_0xddc5c["PQqUC"](Math['random'](),0.5);
if(_0x50fd96) {
if(_0xddc5c["KbtSI"](_0xddc5c["cgBFV"],_0xddc5c["CRacQ"])) {
const _0x4b6dc9=document['createElement'](_0xddc5c["JewYx"]);
_0x4b6dc9['src']=_0x2f1b08[Math["floor"](_0xddc5c['IKUTU'](Math['random'](),_0x2f1b08['length']))];
const _0x495e91=_0xddc5c["OXzFO"](_0xddc5c["xwgvu"](Math["random"](),0x1e),0x1e);
_0x4b6dc9["style"]["width"]=_0x495e91+'px',_0x4b6dc9["style"]['height']=_0xddc5c["ngpfM"],_0x252665['appendChild'](_0x4b6dc9);
}
else _0x712e75["classList"]["remove"](_0xddc5c["cWOnN"]);
}
else {
_0x252665['innerText']=_0x2fb601[Math["floor"](Math["random"]()*_0x2fb601["length"])];
const _0x2b0746=_0xddc5c["OXzFO"](_0xddc5c["rWvvv"](Math["random"](),0x14),0xa);
_0x252665['style']['fontSize']=_0x2b0746+'px';
}
const _0x1cc769=_0xddc5c['IKUTU'](Math['random'](),0x64),_0x18d3ab=_0xddc5c["BBQYn"](_0xddc5c["xwgvu"](Math["random"](),0x3),0x3),_0x3acc99=_0xddc5c["itpTt"](_0xddc5c["IKUTU"](Math["random"](),0.5),0.5);
_0x252665["style"]["left"]=_0x1cc769+'%',_0x252665["style"]["animationDuration"]=_0x18d3ab+'s',_0x252665["style"]["opacity"]=_0x3acc99,heartsContainer["appendChild"](_0x252665),_0xddc5c["uIGdR"](setTimeout,()=> {
_0xddc5c['bZiTV'](_0xddc5c["PRkrX"],_0xddc5c["NdNkA"])?_0x51fa05["classList"]['add'](_0xddc5c['cWOnN']):_0x252665["remove"]();
}
,_0x18d3ab*0x3e8);
}
for(let i=0x0;
i<0xa;
i++) {
setTimeout(createHeart,Math["random"]()*0xbb8);
}
setInterval(createHeart,0x190);
const btnLetter = document.getElementById("btn-letter");
const letterOverlay = document.getElementById("letter-overlay");
const closeLetter = document.getElementById("close-letter");
const letterBody = document.getElementById("letter-body");

let typingInterval;
let paragraphIndex = 0;
let charIndex = 0;
let isTyping = false;

function typeWriter() {
  if (paragraphIndex < letterText.length) {
    isTyping = true;
    let currentParagraph = letterBody.lastElementChild;
    if (!currentParagraph || charIndex === 0) {
      currentParagraph = document.createElement("p");
      if (paragraphIndex === letterText.length - 1) {
        currentParagraph.classList.add("letter-footer");
      }
      letterBody.appendChild(currentParagraph);
    }
    currentParagraph.textContent += letterText[paragraphIndex][charIndex];
    charIndex++;
    letterBody.scrollTop = letterBody.scrollHeight;
    
    if (charIndex < letterText[paragraphIndex].length) {
      typingInterval = setTimeout(typeWriter, 30);
    } else {
      paragraphIndex++;
      charIndex = 0;
      typingInterval = setTimeout(typeWriter, 500);
    }
  } else {
    isTyping = false;
  }
}

if (btnLetter) {
  btnLetter.addEventListener("click", () => {
    if (letterOverlay) {
      letterOverlay.classList.add("active");
    }
    
    // Clear and reset typing pointers so it types clean from start on every reopen!
    clearTimeout(typingInterval);
    if (letterBody) {
      letterBody.innerHTML = "";
    }
    paragraphIndex = 0;
    charIndex = 0;
    isTyping = false;
    
    setTimeout(typeWriter, 500);
  });
}

if (closeLetter) {
  closeLetter.addEventListener("click", () => {
    if (letterOverlay) {
      letterOverlay.classList.remove("active");
    }
    clearTimeout(typingInterval);
    isTyping = false;
  });
}
const btnMusic=document["getElementById"]("btn-music"),musicOverlay=document["getElementById"]("music-overlay"),closeMusic=document["getElementById"]("close-music"),audioPlayer=document["getElementById"]("audio-player"),playPauseBtn=document['getElementById']("play-pause-btn"),prevBtn=document['getElementById']("prev-btn"),nextBtn=document["getElementById"]('next-btn'),progressBar=document["getElementById"]("progress-bar"),progress=document["getElementById"]("progress"),currentTimeEl=document["getElementById"]('current-time'),durationEl=document["getElementById"]("duration"),songTitle=document["getElementById"]('song-title'),songArtist=document["getElementById"]("song-artist"),albumArt=document["querySelector"]("#album-art img"),songListContainer=document["getElementById"]("song-list-container");
let songIndex=0x0,isPlaying=![];
function loadSong(_0x4a22c8) {
const _0x2cf4ca= {
'HJfPF':"4|1|3|2|0",'llkji':function(_0x24623d) {
return _0x24623d();
}
,'kgSuI':"none"
}
,_0x269526=_0x2cf4ca["HJfPF"]["split"]('|');
let _0x1750e9=0x0;
while(!![]) {
switch(_0x269526[_0x1750e9++]) {
case'0':_0x2cf4ca["llkji"](updateSongListUI);
continue;
case'1':songArtist["style"]["display"]=_0x2cf4ca["kgSuI"];
continue;
case'2':audioPlayer["src"]=_0x4a22c8['src'];
continue;
case'3':albumArt["src"]=_0x4a22c8["cover"] + "?v=" + Date.now();
continue;
case'4':songTitle['innerText']=_0x4a22c8["title"];
continue;
}
break;
}
}
function updateSongListUI() {
  // Empty since vertical song list is removed
}
function playSong() {
const _0x281c0c= {
'dCmpP':"Tiktok: https://www.tiktok.com/@dr.gifter306",'IAReZ':"<i class=\"fa-solid fa-pause\"></i>",'eZfUc':"Bản quyền thuộc về Dr.Gifter"
}
,_0x5162fc='0|3|5|4|1|2'["split"]('|');
let _0x52584d=0x0;
while(!![]) {
switch(_0x5162fc[_0x52584d++]) {
case'0':isPlaying=!![];
continue;
case'1':console["log"](_0x281c0c["dCmpP"]);
continue;
case'2':console["log"]("Github: https://github.com/DrGifter");
continue;
case'3':playPauseBtn["innerHTML"]=_0x281c0c["IAReZ"];
continue;
case'4':console["log"](_0x281c0c["eZfUc"]);
continue;
case'5':audioPlayer["play"]();
continue;
}
break;
}
}
function pauseSong() {
isPlaying=![],playPauseBtn["innerHTML"]="<i class=\"fa-solid fa-play\"></i>",audioPlayer["pause"]();
}
function prevSong() {
  const total = songs.length;
  songIndex = (songIndex - 1 + total) % total;
  loadSong(songs[songIndex]);
  playSong();
  updateSongCarousel();
}
function nextSong() {
  const total = songs.length;
  songIndex = (songIndex + 1) % total;
  loadSong(songs[songIndex]);
  playSong();
  updateSongCarousel();
}
function updateProgress(_0x6b1c5f) {
const _0x33cb37= {
'cwqpa':function(_0x2ea90e,_0x5247d0) {
return _0x2ea90e*_0x5247d0;
}
,'bWSoY':function(_0x1f7724,_0x5d295a) {
return _0x1f7724/_0x5d295a;
}
,'Tfbod':function(_0x4c0b10,_0x338fed) {
return _0x4c0b10(_0x338fed);
}
,'VvxdG':function(_0x53c097,_0x3c20fe) {
return _0x53c097(_0x3c20fe);
}
}
, {
duration:_0x2cb3d2,currentTime:_0x42ec76
}
=_0x6b1c5f["srcElement"];
if(isNaN(_0x2cb3d2))return;
const _0x27d5f4=_0x33cb37["cwqpa"](_0x33cb37["bWSoY"](_0x42ec76,_0x2cb3d2),0x64);
progress["style"]['width']=_0x27d5f4+'%',currentTimeEl["innerText"]=_0x33cb37["Tfbod"](formatTime,_0x42ec76),durationEl["innerText"]=_0x33cb37["VvxdG"](formatTime,_0x2cb3d2);
}
function formatTime(_0x135f7d) {
const _0x5d137c= {
'rtTMy':function(_0x5a679d,_0xc6dcc3) {
return _0x5a679d/_0xc6dcc3;
}
,'PRxKK':function(_0xc45983,_0x8f7191) {
return _0xc45983%_0x8f7191;
}
}
,_0x24ed51=Math["floor"](_0x5d137c["rtTMy"](_0x135f7d,0x3c)),_0x484b0c=Math['floor'](_0x5d137c["PRxKK"](_0x135f7d,0x3c));
return _0x24ed51+':'+(_0x484b0c<0xa?'0':'')+_0x484b0c;
}
function setProgress(_0x143182) {
const _0x16c7d7= {
'gweDC':function(_0x4e6144,_0x107963) {
return _0x4e6144/_0x107963;
}
}
,_0x1f0eff=this['clientWidth'],_0x340a33=_0x143182['offsetX'],_0x482364=audioPlayer["duration"];
audioPlayer["currentTime"]=_0x16c7d7["gweDC"](_0x340a33,_0x1f0eff)*_0x482364;
}
// 3D Song Carousel Implementation
const songCarouselStage = document.getElementById("song-carousel-stage");
const songCarouselContainer = document.getElementById("song-carousel-container");

function getCarouselOffset(index, selectedIndex, total) {
  let offset = index - selectedIndex;
  if (offset > total / 2) offset -= total;
  if (offset < -total / 2) offset += total;
  return offset;
}

function updateSongCarousel() {
  if (!songCarouselStage) return;
  const cards = songCarouselStage.querySelectorAll(".song-carousel-card");
  const total = songs.length;
  
  cards.forEach((card, index) => {
    const offset = getCarouselOffset(index, songIndex, total);
    card.setAttribute("data-offset", offset);
    
    if (offset === 0) {
      card.classList.add("active");
    } else {
      card.classList.remove("active");
    }
  });
}

function populateSongCarousel() {
  if (!songCarouselStage) return;
  songCarouselStage.innerHTML = "";
  
  songs.forEach((song, index) => {
    const card = document.createElement("div");
    card.className = "song-carousel-card";
    
    card.innerHTML = `
      <img src="${song.cover}?v=${Date.now()}" alt="${song.title}" />
      <div class="song-card-title">${song.title}</div>
    `;
    
    card.addEventListener("click", () => {
      if (songIndex !== index) {
        songIndex = index;
        loadSong(songs[songIndex]);
        playSong();
        updateSongCarousel();
      }
    });
    
    songCarouselStage.appendChild(card);
  });
  
  updateSongCarousel();
  initCarouselDrag();
}

function initCarouselDrag() {
  if (!songCarouselContainer) return;
  
  let dragStartX = 0;
  let isDragging = false;
  
  function handleStart(e) {
    isDragging = true;
    dragStartX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
  }
  
  function handleEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    
    const dragEndX = e.type === "touchend" ? e.changedTouches[0].clientX : e.clientX;
    const diffX = dragEndX - dragStartX;
    const swipeThreshold = 50;
    
    if (Math.abs(diffX) > swipeThreshold) {
      const total = songs.length;
      if (diffX > 0) {
        songIndex = (songIndex - 1 + total) % total;
      } else {
        songIndex = (songIndex + 1) % total;
      }
      loadSong(songs[songIndex]);
      playSong();
      updateSongCarousel();
    }
  }
  
  songCarouselContainer.addEventListener("mousedown", handleStart);
  document.addEventListener("mouseup", handleEnd);
  
  songCarouselContainer.addEventListener("touchstart", handleStart, { passive: true });
  document.addEventListener("touchend", handleEnd);

  // Left/Right Arrow button click handlers
  const btnCarouselPrev = document.getElementById("btn-carousel-prev");
  const btnCarouselNext = document.getElementById("btn-carousel-next");
  
  if (btnCarouselPrev) {
    btnCarouselPrev.onclick = (e) => {
      e.stopPropagation();
      prevSong();
    };
  }
  
  if (btnCarouselNext) {
    btnCarouselNext.onclick = (e) => {
      e.stopPropagation();
      nextSong();
    };
  }
}
const btnImage = document.getElementById("btn-image");
const imageOverlay = document.getElementById("image-overlay");
const closeImage = document.getElementById("close-image");
const polaroidStackContainer = document.getElementById("polaroid-stack-container");
const lightboxOverlay = document.getElementById("lightbox-overlay");
const lightboxImg = document.getElementById("lightbox-img");
const closeLightbox = document.getElementById("close-lightbox");

let polaroidZIndex = 100;
let bottomZIndex = 1;

function populatePolaroidStack() {
  if (!polaroidStackContainer) return;
  polaroidStackContainer.innerHTML = "";
  
  polaroidZIndex = 100;
  bottomZIndex = 1;
  
  const captions = [
    "Lệ Thủy đáng yêu 💕",
    "Nụ cười của em là nắng ấm ☀️",
    "Mãi yêu em bé nhà anh 💜",
    "Công chúa của anh 👑",
    "Bông hoa đẹp nhất 🌹",
    "Mỗi ngày bên em là niềm vui 💑",
    "Thương em nhiều lắm 🥺💕",
    "Ánh mắt lấp lánh như sao 🌟",
    "Công chúa nhỏ của anh 🧸",
    "Anh siu siu thương em ạaa 💗",
    "Cùng anh đi muôn nơi nhé 🗺️",
    "Nụ cười tỏa nắng của LPN 🌸",
    "Công chúa Lệ Thủy xinh đẹp 👸",
    "Chỉ dành riêng cho LPN 💜",
    "Thương em bé nhất trần đời 🌎💞",
    "Cảm ơn em đã ở bên anh 💑",
    "Trái tim anh chỉ có LPN thôi 💖",
    "Mãi yêu công chúa nhỏ của anh 💜"
  ];
  
  imageFiles.forEach((src, index) => {
    const card = document.createElement("div");
    card.className = "polaroid-card";
    
    // Random offsets and rotations
    const rotate = Math.random() * 20 - 10;
    const offsetX = Math.random() * 10 - 5;
    const offsetY = Math.random() * 10 - 5;
    
    card.style.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${rotate}deg)`;
    // Reverse zIndex so index 0 (Anh (1).jpg) starts on top!
    card.style.zIndex = imageFiles.length - index;
    
    const captionText = captions[index % captions.length];
    // Cache bust image src to bypass browser cache
    const cacheBustedSrc = `${src}?v=${Date.now()}`;
    
    card.innerHTML = `
      <div class="polaroid-img-wrapper">
        <img src="${cacheBustedSrc}" alt="Photo" loading="lazy" />
      </div>
      <div class="polaroid-caption">${captionText}</div>
    `;
    
    // Attach Drag logic
    initPolaroidDrag(card, src, offsetX, offsetY, rotate);
    
    polaroidStackContainer.appendChild(card);
  });
  
  polaroidZIndex = imageFiles.length + 5;
}

function initPolaroidDrag(card, src, initialX, initialY, initialRotate) {
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let rafId = null;
  
  function dragStart(e) {
    isDragging = true;
    card.classList.add("dragging");
    
    polaroidZIndex++;
    card.style.zIndex = polaroidZIndex;
    
    const clientX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
    
    startX = clientX - currentX;
    startY = clientY - currentY;
    
    // Dynamically bind document listeners ONLY when drag starts
    document.addEventListener("mousemove", dragMove);
    document.addEventListener("mouseup", dragEnd);
    document.addEventListener("touchmove", dragMove, { passive: false });
    document.addEventListener("touchend", dragEnd);
    
    if (e.type !== "touchstart") {
      e.preventDefault();
    }
  }
  
  function dragMove(e) {
    if (!isDragging) return;
    
    const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
    
    currentX = clientX - startX;
    currentY = clientY - startY;
    
    // Request animation frame for smooth dragging
    if (!rafId) {
      rafId = requestAnimationFrame(() => {
        const tilt = initialRotate + (currentX * 0.05);
        card.style.transform = `translate(${initialX + currentX}px, ${initialY + currentY}px) rotate(${tilt}deg)`;
        rafId = null;
      });
    }
    
    if (e.cancelable) {
      e.preventDefault();
    }
  }
  
  function dragEnd() {
    if (!isDragging) return;
    isDragging = false;
    card.classList.remove("dragging");
    
    // Cancel any pending animation frame
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    
    // Unbind document listeners when dragging stops
    document.removeEventListener("mousemove", dragMove);
    document.removeEventListener("mouseup", dragEnd);
    document.removeEventListener("touchmove", dragMove);
    document.removeEventListener("touchend", dragEnd);
    
    const swipeThreshold = 120;
    
    // Tap detection: if dragged very little, open fullscreen lightbox!
    if (Math.abs(currentX) < 10 && Math.abs(currentY) < 10) {
      openLightbox(src);
      currentX = 0;
      currentY = 0;
      return;
    }
    
    if (Math.abs(currentX) > swipeThreshold || Math.abs(currentY) > swipeThreshold) {
      const velocityX = currentX === 0 ? 0 : (currentX > 0 ? 1 : -1) * 800;
      const velocityY = currentY === 0 ? 0 : (currentY > 0 ? 1 : -1) * 800;
      
      card.style.transition = "transform 0.5s ease-out";
      card.style.transform = `translate(${initialX + velocityX}px, ${initialY + velocityY}px) rotate(${initialRotate + (currentX * 0.1)}deg)`;
      
      setTimeout(() => {
        card.style.transition = "none";
        
        // Reset positions
        currentX = 0;
        currentY = 0;
        card.style.transform = `translate(${initialX}px, ${initialY}px) rotate(${initialRotate}deg)`;
        
        // Loop: Decr bottomZIndex to send card behind all others
        bottomZIndex--;
        card.style.zIndex = bottomZIndex;
        
        setTimeout(() => {
          card.style.transition = "";
        }, 50);
      }, 500);
      
    } else {
      card.style.transition = "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
      card.style.transform = `translate(${initialX}px, ${initialY}px) rotate(${initialRotate}deg)`;
      currentX = 0;
      currentY = 0;
      
      setTimeout(() => {
        card.style.transition = "";
      }, 300);
    }
  }
  
  card.addEventListener("mousedown", dragStart);
  card.addEventListener("touchstart", dragStart, { passive: true });
}

function openLightbox(src) {
  if (lightboxImg && lightboxOverlay) {
    lightboxImg.src = `${src}?v=${Date.now()}`;
    lightboxOverlay.classList.add("active");
  }
}

if (closeLightbox && lightboxOverlay) {
  closeLightbox.addEventListener("click", () => {
    lightboxOverlay.classList.remove("active");
  });
}

if (lightboxOverlay) {
  lightboxOverlay.addEventListener("click", (e) => {
    if (e.target === lightboxOverlay) {
      lightboxOverlay.classList.remove("active");
    }
  });
}

if (btnImage) {
  btnImage.addEventListener("click", () => {
    populatePolaroidStack();
    if (imageOverlay) {
      imageOverlay.classList.add("active");
    }
  });
}

if (closeImage) {
  closeImage.addEventListener("click", () => {
    if (imageOverlay) {
      imageOverlay.classList.remove("active");
    }
  });
}
const btnGift=document["getElementById"]("btn-gift"),giftOverlay=document["getElementById"]('gift-overlay'),closeGift=document["getElementById"]("close-gift"),fullscreenGiftBtn=document["getElementById"]("fullscreen-gift"),giftModalElement=document["getElementById"]("gift-modal-element"),giftIframe=document["querySelector"]('.gift-iframe');
btnGift["addEventListener"]('click',()=> {
const _0x3ed208= {
'JbihG':function(_0x417f90,_0x42d8ec) {
return _0x417f90===_0x42d8ec;
}
,'CvZFX':"WNeDm",'GKphg':"active"
}
;
if(giftIframe) {
if(_0x3ed208["JbihG"](_0x3ed208["CvZFX"],_0x3ed208["CvZFX"]))giftIframe['src']=giftIframe["src"];
else {
const _0x2af33e=_0x365cf3['cloneNode']();
_0x2af33e['play']();
}
}
giftOverlay["classList"]["add"](_0x3ed208["GKphg"]);
}
),closeGift['addEventListener']("click",()=> {
const _0x46c231= {
'JahPy':"active"
}
;
giftOverlay['classList']["remove"](_0x46c231["JahPy"]);
}
),fullscreenGiftBtn["addEventListener"]("click",()=> {
const _0x3032f0= {
'SRlfU':"active",'AGHGN':function(_0x1e019c,_0x1e8c74) {
return _0x1e019c(_0x1e8c74);
}
,'tmmzo':function(_0x3c3273,_0x586f31) {
return _0x3c3273===_0x586f31;
}
,'AgEJR':function(_0x300d52) {
return _0x300d52();
}
,'UroFO':function(_0x205a8c,_0x94a7b) {
return _0x205a8c===_0x94a7b;
}
,'WTgjj':"XVLqw",'mriyt':"opwfU",'xpxuI':'QtMzr','bAKYa':'nTXQa','KXsCx':"<i class=\"fa-solid fa-compress\"></i>",'qPkiu':function(_0x3662e0,_0x172f20) {
return _0x3662e0===_0x172f20;
}
,'kObgO':"MSeRs",'zzKzP':"<i class=\"fa-solid fa-expand\"></i>"
}
;
if(!document["fullscreenElement"]) {
if(_0x3032f0['UroFO']('acIVn',_0x3032f0['WTgjj']))_0x14e694["classList"]["remove"](dGpxdR['SRlfU']),dGpxdR['AGHGN'](_0x3e01cc,_0xcc1809),_0x1a5e35=![];
else {
if(giftModalElement["requestFullscreen"])giftModalElement['requestFullscreen']();
else {
if(giftModalElement['webkitRequestFullscreen'])_0x3032f0["mriyt"]===_0x3032f0["xpxuI"]?_0x3032f0["tmmzo"](_0x3426f3,_0x5c36c8)?_0x3032f0['AgEJR'](_0x241eb7):_0x3032f0["AgEJR"](_0x32b053):giftModalElement["webkitRequestFullscreen"]();
else giftModalElement["msRequestFullscreen"]&&(_0x3032f0["bAKYa"]===_0x3032f0["bAKYa"]?giftModalElement["msRequestFullscreen"]():_0x45249d['classList']["remove"](_0x3032f0["SRlfU"]));
}
fullscreenGiftBtn["innerHTML"]=_0x3032f0["KXsCx"];
}
}
else {
if(_0x3032f0["qPkiu"](_0x3032f0['kObgO'],_0x3032f0["kObgO"])) {
if(document["exitFullscreen"])document["exitFullscreen"]();
else {
if(document["webkitExitFullscreen"])document["webkitExitFullscreen"]();
else document["msExitFullscreen"]&&document["msExitFullscreen"]();
}
fullscreenGiftBtn["innerHTML"]=_0x3032f0["zzKzP"];
}
else _0x363253["classList"]["remove"]("shake"),_0x54f340='',_0x38ba6d();
}
}
),document["addEventListener"]("fullscreenchange",()=> {
!document["fullscreenElement"]&&(fullscreenGiftBtn['innerHTML']="<i class=\"fa-solid fa-expand\"></i>");
}
),btnMusic['addEventListener']("click",()=>{
  musicOverlay['classList']["add"]("active");
  populateSongCarousel();
}),closeMusic["addEventListener"]('click',()=> {
const _0x116eb1= {
'OeNXb':'active'
}
;
musicOverlay["classList"]["remove"](_0x116eb1["OeNXb"]);
}
),playPauseBtn["addEventListener"]("click",()=> {
const _0x562058= {
'NcgMW':function(_0x38029f,_0x4ea65b) {
return _0x38029f>=_0x4ea65b;
}
,'NfGuu':function(_0x3c0bdd,_0x187b7c) {
return _0x3c0bdd<=_0x187b7c;
}
,'aRZRZ':function(_0x224406,_0x1783b6) {
return _0x224406(_0x1783b6);
}
,'wqkZq':function(_0x246227,_0x7c6f30) {
return _0x246227===_0x7c6f30;
}
,'KzcaJ':"Backspace",'TgSnM':function(_0x56fdf1) {
return _0x56fdf1();
}
,'sAIhv':function(_0x370c32) {
return _0x370c32();
}
,'swqiF':function(_0x3b8e38,_0x72f41a) {
return _0x3b8e38===_0x72f41a;
}
,'KJzlS':"dHxYj",'WHFUZ':'jQhrG'
}
;
if(isPlaying) {
if(_0x562058["swqiF"](_0x562058["KJzlS"],"dHxYj"))pauseSong();
else {
if(!_0xa7fcd0||_0x24f7b6["classList"]['contains']("unlocked"))return;
if(_0x562058['NcgMW'](_0x22972c["key"],'0')&&_0x562058["NfGuu"](_0x1a8dcb["key"],'9'))_0x562058["aRZRZ"](_0x3fdfe0,_0x434bf8["key"]);
else _0x562058["wqkZq"](_0x2b313c["key"],_0x562058["KzcaJ"])&&_0x562058["TgSnM"](_0x13e9f7);
}
}
else _0x562058["wqkZq"](_0x562058["WHFUZ"],_0x562058["WHFUZ"])?_0x562058["TgSnM"](playSong):_0x562058['sAIhv'](_0xf1a3b4);
}
),prevBtn['addEventListener']("click",prevSong),nextBtn["addEventListener"]("click",nextSong),audioPlayer["addEventListener"]("timeupdate",updateProgress),audioPlayer["addEventListener"]('ended',nextSong),progressBar["addEventListener"]("click",setProgress);
const popSound=document["getElementById"]('pop-sound');
window['addEventListener']('click',()=> {
const _0xb20478= {
'epBjv':function(_0x12e23e,_0xe2a1e3) {
return _0x12e23e(_0xe2a1e3);
}
,'IFZFm':function(_0x2a2a11,_0x407ef7) {
return _0x2a2a11!==_0x407ef7;
}
,'toWSH':"TQrUL"
}
;
if(popSound) {
if(_0xb20478["IFZFm"](_0xb20478['toWSH'],_0xb20478["toWSH"]))_0x1a6324['stopPropagation'](),cITZvU['epBjv'](_0x3556fa,_0x12b298);
else {
const _0x4f1e9d=popSound["cloneNode"]();
_0x4f1e9d["play"]();
}
}
}
,!![]),loadSong(songs[songIndex]);
const lockScreen=document["getElementById"]("lock-screen"),mainContent=document['getElementById']('main-content'),passDots=document["querySelectorAll"](".dot"),numBtns=document["querySelectorAll"](".num-btn[data-value]"),deleteBtn=document["querySelector"](".num-btn.delete-btn");
let enteredPin='';
const correctPin="4680";
function updateDots() {
const _0x479bee= {
'nIkaK':"div",'wtNih':'heart','JZNsj':"https://i.pinimg.com/originals/b9/67/4f/b9674f3f995aba177250894d57f42bbf.gif",'uFFAj':"https://i.pinimg.com/originals/4e/89/d3/4e89d3e4ec4b1f59b1664e880a875c65.gif",'JFmXZ':function(_0x221e9b,_0x5d830a) {
return _0x221e9b>_0x5d830a;
}
,'VSJoQ':"img",'mFpFS':function(_0x1b5322,_0x1bf3c2) {
return _0x1b5322*_0x1bf3c2;
}
,'eHHdf':function(_0x1bb09f,_0x273a84) {
return _0x1bb09f*_0x273a84;
}
,'UKsCX':function(_0x58b7b3,_0x3f43f9) {
return _0x58b7b3+_0x3f43f9;
}
,'bTniV':function(_0x458b9e,_0xfeb127) {
return _0x458b9e+_0xfeb127;
}
,'bdCHG':function(_0x54124d,_0x2f649a,_0x217670) {
return _0x54124d(_0x2f649a,_0x217670);
}
,'UmxRb':function(_0x14a2b7,_0xf1c2fc) {
return _0x14a2b7*_0xf1c2fc;
}
,'FEAIj':"GMxMH",'opMpw':'QopZJ','nlGOJ':function(_0x13895d,_0xc64f51) {
return _0x13895d<_0xc64f51;
}
,'vpQRg':function(_0x3f6d19,_0x554673) {
return _0x3f6d19!==_0x554673;
}
,'npBGt':'PXHbS','maSJv':'MdAdv','FuCtf':"qPXaQ",'HamtB':"active"
}
;
passDots["forEach"]((_0x3b0a96,_0x453706)=> {
if(_0x479bee["FEAIj"]===_0x479bee['opMpw']) {
const _0x4b163b=_0x4d5f81["createElement"](YlNoPE["nIkaK"]);
_0x4b163b['classList']["add"](YlNoPE["wtNih"]);
const _0x59f6d9=['❤','💖','💗','💓','💕','🌸'],_0x169ae2=["https://i.pinimg.com/originals/88/23/82/882382f97862c72e60fc06822e36eb55.gif",YlNoPE["JZNsj"],YlNoPE["uFFAj"],"https://i.pinimg.com/originals/b6/6b/1b/b66b1bfe70a9ad4f69dea3b620011222.gif"],_0x1349b2=YlNoPE["JFmXZ"](_0x2109ae["random"](),0.5);
if(_0x1349b2) {
const _0x43b2fc=_0x17dfc7["createElement"](YlNoPE["VSJoQ"]);
_0x43b2fc["src"]=_0x169ae2[_0x1e26c6["floor"](YlNoPE["mFpFS"](_0x3ffed['random'](),_0x169ae2["length"]))];
const _0x565b00=YlNoPE["mFpFS"](_0x394695["random"](),0x1e)+0x1e;
_0x43b2fc["style"]["width"]=_0x565b00+'px',_0x43b2fc["style"]["height"]='auto',_0x4b163b["appendChild"](_0x43b2fc);
}
else {
_0x4b163b["innerText"]=_0x59f6d9[_0x233186["floor"](YlNoPE["eHHdf"](_0xb9bb82["random"](),_0x59f6d9["length"]))];
const _0x5b574f=YlNoPE["UKsCX"](_0x596889['random']()*0x14,0xa);
_0x4b163b['style']["fontSize"]=_0x5b574f+'px';
}
const _0x57648a=_0xc729a0["random"]()*0x64,_0x553c02=YlNoPE["eHHdf"](_0x4fe822['random'](),0x3)+0x3,_0x58fc82=YlNoPE["bTniV"](YlNoPE["mFpFS"](_0x4eb454["random"](),0.5),0.5);
_0x4b163b['style']["left"]=_0x57648a+'%',_0x4b163b['style']["animationDuration"]=_0x553c02+'s',_0x4b163b['style']["opacity"]=_0x58fc82,_0x358e13['appendChild'](_0x4b163b),YlNoPE["bdCHG"](_0x5c64fa,()=> {
_0x4b163b['remove']();
}
,YlNoPE["UmxRb"](_0x553c02,0x3e8));
}
else _0x479bee['nlGOJ'](_0x453706,enteredPin['length'])?_0x479bee["vpQRg"](_0x479bee["npBGt"],'PXHbS')?_0x407aee["addEventListener"]("click",()=> {
_0x576f26['location']["reload"]();
}
):_0x3b0a96["classList"]['add']("active"):_0x479bee["maSJv"]===_0x479bee["FuCtf"]?_0x3621ac['vibrate'](0xc8):_0x3b0a96["classList"]["remove"](_0x479bee['HamtB']);
}
);
}
function handleInput(_0x5a76b5) {
const _0x5117dd= {
'QqVsH':"unlocked",'QTTJY':function(_0x87b763,_0x156c50) {
return _0x87b763<_0x156c50;
}
,'XLUUm':function(_0x305db1,_0x303638) {
return _0x305db1===_0x303638;
}
,'tStFS':function(_0x13427e,_0x53f214,_0x48937a) {
return _0x13427e(_0x53f214,_0x48937a);
}
}
;
if(!lockScreen||lockScreen["classList"]["contains"](_0x5117dd["QqVsH"]))return;
if(localStorage.getItem("lockoutEndTime") && Date.now() < parseInt(localStorage.getItem("lockoutEndTime"))) return;
_0x5117dd["QTTJY"](enteredPin['length'],0x4)&&(enteredPin+=_0x5a76b5,updateDots(),_0x5117dd["XLUUm"](enteredPin["length"],0x4)&&_0x5117dd["tStFS"](setTimeout,checkPin,0x12c));
}
function checkPin() {
const _0x256456= {
'ltwot':"data-value",'oiLEJ':function(_0x186220,_0x43f57a) {
return _0x186220===_0x43f57a;
}
,'XAgML':function(_0x4429f4,_0x4620cc) {
return _0x4429f4!==_0x4620cc;
}
,'XBwBT':'nVHue','qZezb':function(_0x363efd) {
return _0x363efd();
}
}
;
_0x256456["oiLEJ"](enteredPin,correctPin)?_0x256456["XAgML"](_0x256456["XBwBT"],"nVHue")?(_0x20254a["stopPropagation"](),_0x58df60(_0x53cff6["getAttribute"](_0x256456["ltwot"]))):_0x256456['qZezb'](unlock):_0x256456["qZezb"](fail);
}
function unlock() {
  const _0x356950 = {
    'GOTIf': "unlocked", 'hOsPv': 'main-content-hidden', 'ChhTz': 'main-content-visible'
  };
  lockScreen["classList"]["add"](_0x356950["GOTIf"]);
  mainContent["classList"]['remove'](_0x356950["hOsPv"]);
  mainContent["classList"]["add"](_0x356950["ChhTz"]);
  enteredPin = '';
  updateDots();
  
  // Trigger Heart Confetti Rain on successful password unlock!
  triggerHeartConfetti();
  
  // Clear wrong count and lockout values
  localStorage.removeItem("wrongPassCount");
  localStorage.removeItem("lockoutEndTime");

  // If secret was already completed on this browser, show the 4 icons directly and hide the secret option
  if (localStorage.getItem("secretUnlocked") === "true") {
    const btnSecretEl = document.getElementById("btn-secret");
    if (btnSecretEl) btnSecretEl.classList.add("hidden");
    
    const loveCounter = document.getElementById("love-counter-floating");
    if (loveCounter) loveCounter.classList.remove("hidden");
    
    const mascot = document.getElementById("mascot-widget");
    if (mascot) mascot.classList.remove("hidden");
    
    const lockedItems = document.querySelectorAll(".locked-item");
    lockedItems.forEach((item) => {
      item.classList.remove("hidden");
      item.style.animation = "none";
      item.style.opacity = "1";
      item.style.transform = "scale(1)";
    });
  } else {
    const btnSecretEl = document.getElementById("btn-secret");
    if (btnSecretEl) btnSecretEl.classList.remove("hidden");
    
    const lockedItems = document.querySelectorAll(".locked-item");
    lockedItems.forEach((item) => {
      item.classList.add("hidden");
    });
  }
}
function fail() {
  const _0x3da771 = {
    'kDHal': 'shake', 'HoQHK': function (_0x323053) {
      return _0x323053();
    }
    , 'pYKEp': "pass-dots", 'JwSMN': function (_0x55cb9c, _0x47d35a, _0xcba1f7) {
      return _0x55cb9c(_0x47d35a, _0xcba1f7);
    }
  };
  const _0x4a8e47 = document["getElementById"](_0x3da771["pYKEp"]);
  _0x4a8e47["classList"]["add"]("shake");
  if (navigator["vibrate"]) {
    navigator["vibrate"](200);
  }
  
  _0x3da771["JwSMN"](setTimeout, () => {
    _0x4a8e47["classList"]["remove"](_0x3da771["kDHal"]);
    enteredPin = '';
    _0x3da771['HoQHK'](updateDots);
    
    let wrongCount = parseInt(localStorage.getItem("wrongPassCount") || "0") + 1;
    localStorage.setItem("wrongPassCount", wrongCount);
    
    if (wrongCount === 4) {
      // Show custom romantic purple alert instead of dry system alert
      const customAlert = document.getElementById("custom-alert-overlay");
      if (customAlert) {
        customAlert.classList.remove("hidden");
      }
    } else if (wrongCount >= 5) {
      const lockoutEnd = Date.now() + 10 * 60 * 1000;
      localStorage.setItem("lockoutEndTime", lockoutEnd);
      startLockoutTimer(lockoutEnd);
    }
  }, 500);
}

let lockoutTimerInterval = null;

function startLockoutTimer(lockoutEndTime) {
  const hintEl = document.getElementById("lock-message-hint");
  if (hintEl) {
    hintEl.classList.remove("hidden");
  }

  if (lockoutTimerInterval) clearInterval(lockoutTimerInterval);

  enteredPin = '';
  updateDots();

  function updateTimerText() {
    const timeLeft = lockoutEndTime - Date.now();
    if (timeLeft <= 0) {
      clearInterval(lockoutTimerInterval);
      if (hintEl) {
        hintEl.classList.add("hidden");
        hintEl.innerHTML = "";
      }
      localStorage.removeItem("lockoutEndTime");
      localStorage.setItem("wrongPassCount", "0");
    } else {
      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      const secondsStr = seconds < 10 ? "0" + seconds : seconds;
      const minutesStr = minutes < 10 ? "0" + minutes : minutes;
      if (hintEl) {
        hintEl.innerHTML = `Vui lòng thử lại sau ${minutesStr}:${secondsStr}`;
      }
    }
  }

  updateTimerText();
  lockoutTimerInterval = setInterval(updateTimerText, 1000);
}
function deleteLastDigit() {
const _0x265f42= {
'BbEuJ':function(_0x4da478,_0x1191d4) {
return _0x4da478>_0x1191d4;
}
,'oyZCf':function(_0x20ccf3) {
return _0x20ccf3();
}
}
;
_0x265f42["BbEuJ"](enteredPin['length'],0x0)&&(enteredPin=enteredPin['slice'](0x0,-0x1),_0x265f42["oyZCf"](updateDots));
}
numBtns&&numBtns["forEach"](_0x2329b6=> {
const _0x1df0f8= {
'cdfMU':function(_0x56919c,_0x493a42) {
return _0x56919c(_0x493a42);
}
,'gxjhn':"click"
}
;
_0x2329b6["addEventListener"](_0x1df0f8["gxjhn"],_0x58b51b=> {
_0x58b51b["stopPropagation"](),_0x1df0f8['cdfMU'](handleInput,_0x2329b6["getAttribute"]("data-value"));
}
);
}
);
deleteBtn&&deleteBtn["addEventListener"]('click',_0x2b9e61=> {
const _0x1b6c8f= {
'oxdOl':function(_0x4f61ab) {
return _0x4f61ab();
}
}
;
_0x2b9e61["stopPropagation"](),_0x1b6c8f['oxdOl'](deleteLastDigit);
}
);
document['addEventListener']("keydown",_0x36d45e=> {
const _0x1a0b85= {
'YRGxp':"unlocked",'KwBVm':function(_0x535fb2,_0x268543) {
return _0x535fb2>=_0x268543;
}
,'bxRji':function(_0x2b00c2,_0x5e5f50) {
return _0x2b00c2<=_0x5e5f50;
}
,'whyEj':function(_0xadf891,_0x4a8033) {
return _0xadf891(_0x4a8033);
}
,'bbZwY':function(_0xfa3318,_0x440f35) {
return _0xfa3318===_0x440f35;
}
,'WSVgA':"Backspace",'aojzr':function(_0x5b9762) {
return _0x5b9762();
}
}
;
if(!lockScreen||lockScreen["classList"]["contains"](_0x1a0b85["YRGxp"]))return;
if(_0x1a0b85["KwBVm"](_0x36d45e["key"],'0')&&_0x1a0b85["bxRji"](_0x36d45e["key"],'9'))_0x1a0b85["whyEj"](handleInput,_0x36d45e["key"]);
else _0x1a0b85["bbZwY"](_0x36d45e["key"],_0x1a0b85["WSVgA"])&&_0x1a0b85["aojzr"](deleteLastDigit);
}
);
const resetLockBtn=document["getElementById"]("btn-reset-lock");
resetLockBtn&&resetLockBtn["addEventListener"]("click",()=> {
localStorage.clear();
window["location"]["reload"]();
}
);

// Secret overlay interaction
const btnSecret = document.getElementById("btn-secret");
const secretOverlay = document.getElementById("secret-overlay");
const closeSecret = document.getElementById("close-secret");
const btnAccept = document.getElementById("btn-accept");
const btnReject = document.getElementById("btn-reject");
const secretProposal = document.getElementById("secret-proposal");
const secretSuccess = document.getElementById("secret-success");

let clickCount = 0;
const acceptLefts = ["25%", "31%", "37%", "43%", "50%"];
const rejectLefts = ["75%", "80%", "85%", "90%", "90%"];
const acceptScales = [1.0, 1.4, 1.8, 2.2, 2.6];
const rejectScales = [1.0, 0.75, 0.50, 0.25, 0];
let proposalCompleted = false;

if (btnSecret && secretOverlay) {
  btnSecret.addEventListener("click", () => {
    clickCount = 0;
    
    if (btnAccept) {
      btnAccept.style.left = acceptLefts[0];
      btnAccept.style.transform = `translate(-50%, -50%) scale(${acceptScales[0]})`;
    }
    if (btnReject) {
      btnReject.style.left = rejectLefts[0];
      btnReject.style.transform = `translate(-50%, -50%) scale(${rejectScales[0]})`;
      btnReject.style.opacity = "1";
      btnReject.style.pointerEvents = "auto";
      btnReject.classList.remove("hidden");
    }
    
    if (secretProposal) secretProposal.classList.remove("hidden");
    if (secretSuccess) secretSuccess.classList.add("hidden");
    
    secretOverlay.classList.add("active");
  });
}

if (btnReject) {
  btnReject.addEventListener("click", (e) => {
    e.stopPropagation();
    
    // Shake the modal to indicate "wrong choice" feedback
    const secretModal = document.querySelector(".secret-modal");
    if (secretModal) {
      secretModal.classList.add("shake");
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
      setTimeout(() => {
        secretModal.classList.remove("shake");
      }, 500);
    }

    if (clickCount < 4) {
      clickCount++;
      
      if (btnAccept) {
        btnAccept.style.left = acceptLefts[clickCount];
        btnAccept.style.transform = `translate(-50%, -50%) scale(${acceptScales[clickCount]})`;
      }
      
      if (btnReject) {
        if (clickCount === 4) {
          btnReject.style.transform = `translate(-50%, -50%) scale(0)`;
          btnReject.style.opacity = "0";
          btnReject.style.pointerEvents = "none";
          btnReject.classList.add("hidden");
        } else {
          btnReject.style.left = rejectLefts[clickCount];
          btnReject.style.transform = `translate(-50%, -50%) scale(${rejectScales[clickCount]})`;
          btnReject.style.opacity = `${rejectScales[clickCount]}`;
        }
      }
    }
  });
}

if (btnAccept) {
  btnAccept.addEventListener("click", (e) => {
    e.stopPropagation();
    // Switch to success screen
    if (secretProposal) secretProposal.classList.add("hidden");
    if (secretSuccess) secretSuccess.classList.remove("hidden");
    proposalCompleted = true; // Mark proposal flow as completed
    
    // Save anniversary start date as the exact moment she accepts
    const acceptTime = new Date();
    localStorage.setItem("anniversaryStartDate", acceptTime.getTime().toString());
    
    // Send Discord Webhook notification with exact timestamp
    const timeString = acceptTime.toLocaleTimeString("vi-VN") + " ngày " + acceptTime.toLocaleDateString("vi-VN");
    sendDiscordNotification(timeString);
    
    // Trigger Heart Confetti Rain!
    triggerHeartConfetti();
    
    // Instantly show the vibrating envelope indicator in the top right
    const envelope = document.getElementById("envelope-indicator");
    if (envelope) {
      envelope.classList.remove("hidden");
    }
  });
}

// Envelope indicator click handler to trigger final unlock sequence
const envelope = document.getElementById("envelope-indicator");
const unlockOverlay = document.getElementById("unlock-notification-overlay");
const popSoundEffect = document.getElementById("pop-sound");

if (envelope) {
  envelope.addEventListener("click", () => {
    if (popSoundEffect) {
      popSoundEffect.play();
    }
    envelope.classList.add("hidden");
    
    // Trigger Heart Confetti Rain on envelope open!
    triggerHeartConfetti();
    
    // Automatically close the secret modal overlay
    if (secretOverlay) {
      secretOverlay.classList.remove("active");
    }
    
    if (unlockOverlay) {
      unlockOverlay.classList.remove("hidden");
      
      // Keep notification for 2.5 seconds, then trigger fade out
      setTimeout(() => {
        unlockOverlay.classList.add("fade-out");
      }, 2500);
      
      // After 3.0 seconds, clean up overlay and staggered reveal the remaining items
      setTimeout(() => {
        unlockOverlay.classList.add("hidden");
        unlockOverlay.classList.remove("fade-out");
        
        // Hide "Bí Mật" button and save state
        const btnSecretEl = document.getElementById("btn-secret");
        if (btnSecretEl) {
          btnSecretEl.classList.add("hidden");
        }
        localStorage.setItem("secretUnlocked", "true");
        
        // Show love counter
        const loveCounter = document.getElementById("love-counter-floating");
        if (loveCounter) {
          loveCounter.classList.remove("hidden");
        }
        
        // Show mascot widget
        const mascot = document.getElementById("mascot-widget");
        if (mascot) {
          mascot.classList.remove("hidden");
        }
        
        const lockedItems = document.querySelectorAll(".locked-item");
        lockedItems.forEach((item, index) => {
          item.classList.remove("hidden");
          item.style.animationDelay = `${index * 0.15}s`;
          item.classList.add("scale-in");
        });
      }, 3000);
    }
  });
}
// Floating background music controls
const floatingMusicBtn = document.getElementById("music-control-floating");
const musicFloatingOverlay = document.getElementById("music-floating-overlay");

if (floatingMusicBtn && audioPlayer) {
  // Sync button status with audio element's actual play status
  audioPlayer.addEventListener("play", () => {
    floatingMusicBtn.classList.remove("hidden");
    floatingMusicBtn.classList.add("playing");
    floatingMusicBtn.classList.remove("paused");
    if (musicFloatingOverlay) {
      musicFloatingOverlay.innerHTML = '<i class="fa-solid fa-pause"></i>';
    }
  });
  
  audioPlayer.addEventListener("pause", () => {
    floatingMusicBtn.classList.add("paused");
    floatingMusicBtn.classList.remove("playing");
    if (musicFloatingOverlay) {
      musicFloatingOverlay.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
  });
  
  // Click handler to toggle play/pause state
  floatingMusicBtn.addEventListener("click", () => {
    if (isPlaying) {
      pauseSong();
    } else {
      playSong();
    }
  });
}

// Check for lockout status on page load
const savedLockoutTime = localStorage.getItem("lockoutEndTime");
if (savedLockoutTime && Date.now() < parseInt(savedLockoutTime)) {
  startLockoutTimer(parseInt(savedLockoutTime));
}

// Close custom alert modal listener
const closeCustomAlertBtn = document.getElementById("close-custom-alert");
if (closeCustomAlertBtn) {
  closeCustomAlertBtn.addEventListener("click", () => {
    const alertOverlay = document.getElementById("custom-alert-overlay");
    if (alertOverlay) {
      alertOverlay.classList.add("hidden");
    }
  });
}

// Love Counter logic
function updateLoveCounter() {
  const loveDaysEl = document.getElementById("love-days-count");
  const detailsTimeEl = document.getElementById("details-time");
  
  if (!loveDaysEl && !detailsTimeEl) return;
  
  let startMs = localStorage.getItem("anniversaryStartDate");
  if (!startMs) {
    // Fallback if not accepted yet (e.g. testing)
    startMs = new Date(ANNIVERSARY_DATE).getTime();
  } else {
    startMs = parseInt(startMs);
  }
  
  const now = Date.now();
  const diffTime = Math.max(0, now - startMs);
  
  // Calculate days, hours, minutes, seconds
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
  const diffSeconds = Math.floor((diffTime % (1000 * 60)) / 1000);
  
  if (loveDaysEl) {
    loveDaysEl.innerText = `${diffDays} ngày`;
  }
  
  if (detailsTimeEl) {
    detailsTimeEl.innerText = `${diffDays} ngày ${diffHours} giờ ${diffMinutes} phút ${diffSeconds} giây`;
  }

  // Update birthday countdown
  updateUpcomingEvent();
}

function updateUpcomingEvent() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();
  
  // Check if today is a birthday!
  const isUserBdayToday = (currentMonth === 7 && currentDate === 6); // Aug 6
  const isThuyBdayToday = (currentMonth === 10 && currentDate === 24); // Nov 24
  
  const countdownTitleEl = document.getElementById("countdown-title");
  const countdownTimeEl = document.getElementById("countdown-time");
  
  if (isUserBdayToday) {
    if (countdownTitleEl) countdownTitleEl.innerText = "🎉 Chúc Mừng Sinh Nhật Anh Iu!";
    if (countdownTimeEl) countdownTimeEl.innerText = "Hôm nay là ngày đặc biệt của anh ❤️";
    return;
  }
  
  if (isThuyBdayToday) {
    if (countdownTitleEl) countdownTitleEl.innerText = "🎉 Chúc Mừng Sinh Nhật Công Chúa LPN!";
    if (countdownTimeEl) countdownTimeEl.innerText = "Chúc em tuổi mới luôn hạnh phúc rực rỡ 👑💖";
    return;
  }
  
  // Otherwise, calculate upcoming birthday
  let userBday = new Date(currentYear, 7, 6, 0, 0, 0);
  let thuyBday = new Date(currentYear, 10, 24, 0, 0, 0);
  
  if (now > userBday) userBday.setFullYear(currentYear + 1);
  if (now > thuyBday) thuyBday.setFullYear(currentYear + 1);
  
  let targetDate, titleText;
  if (userBday < thuyBday) {
    targetDate = userBday;
    titleText = "🎂 Sinh Nhật Anh Iu";
  } else {
    targetDate = thuyBday;
    titleText = "👑 Sinh Nhật Công Chúa LPN";
  }
  
  const diffMs = targetDate - now;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  if (countdownTitleEl) countdownTitleEl.innerText = titleText;
  if (countdownTimeEl) {
    countdownTimeEl.innerText = `Còn ${diffDays} ngày ${diffHours} giờ ${diffMinutes} phút ${diffSeconds} giây`;
  }
}

// Mobile tap compatibility to toggle detailed view
const loveCounterBadge = document.getElementById("love-counter-badge");
const loveCounterFloating = document.getElementById("love-counter-floating");
if (loveCounterBadge && loveCounterFloating) {
  loveCounterBadge.addEventListener("click", (e) => {
    e.stopPropagation();
    loveCounterFloating.classList.toggle("active");
  });
  
  document.addEventListener("click", () => {
    loveCounterFloating.classList.remove("active");
  });
}

// Start love counter ticks
setInterval(updateLoveCounter, 1000);
updateLoveCounter();

// Diary Feature Implementation
const btnDiary = document.getElementById("btn-diary");
const diaryOverlay = document.getElementById("diary-overlay");
const closeDiary = document.getElementById("close-diary");
const diaryInput = document.getElementById("diary-input");
const diaryPhotoInput = document.getElementById("diary-photo-input");
const btnSaveDiary = document.getElementById("btn-save-diary");
const diaryImagePreviewContainer = document.getElementById("diary-image-preview-container");
const diaryImagePreview = document.getElementById("diary-image-preview");
const btnRemovePreview = document.getElementById("btn-remove-preview");
const diaryEntriesList = document.getElementById("diary-entries-list");

let selectedDiaryImageBase64 = null;

// Open/Close Modal
if (btnDiary && diaryOverlay) {
  btnDiary.addEventListener("click", () => {
    diaryOverlay.classList.add("active");
    renderDiaryEntries();
  });
}

if (closeDiary && diaryOverlay) {
  closeDiary.addEventListener("click", () => {
    diaryOverlay.classList.remove("active");
    resetDiaryForm();
  });
}

// Handle Image Selection and Compression
if (diaryPhotoInput) {
  diaryPhotoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        // Create canvas for compression
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        
        // Resize to max 600px
        const maxDim = 600;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with 0.7 quality
        selectedDiaryImageBase64 = canvas.toDataURL("image/jpeg", 0.7);
        
        // Update Preview UI
        if (diaryImagePreview) diaryImagePreview.src = selectedDiaryImageBase64;
        if (diaryImagePreviewContainer) diaryImagePreviewContainer.classList.remove("hidden");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Remove Image Preview
if (btnRemovePreview) {
  btnRemovePreview.addEventListener("click", () => {
    selectedDiaryImageBase64 = null;
    if (diaryPhotoInput) diaryPhotoInput.value = "";
    if (diaryImagePreviewContainer) diaryImagePreviewContainer.classList.add("hidden");
    if (diaryImagePreview) diaryImagePreview.src = "";
  });
}

// Reset Form fields
function resetDiaryForm() {
  if (diaryInput) diaryInput.value = "";
  if (diaryPhotoInput) diaryPhotoInput.value = "";
  selectedDiaryImageBase64 = null;
  if (diaryImagePreviewContainer) diaryImagePreviewContainer.classList.add("hidden");
  if (diaryImagePreview) diaryImagePreview.src = "";
}

// Save Entry
if (btnSaveDiary) {
  btnSaveDiary.addEventListener("click", () => {
    const text = diaryInput ? diaryInput.value.trim() : "";
    if (!text && !selectedDiaryImageBase64) {
      alert("Em hãy viết gì đó hoặc thêm ảnh nhé! 💕");
      return;
    }

    const entries = JSON.parse(localStorage.getItem("loveDiaryEntries") || "[]");
    const newEntry = {
      text: text,
      image: selectedDiaryImageBase64,
      timestamp: Date.now()
    };
    
    entries.unshift(newEntry); // Add to the top of the list
    localStorage.setItem("loveDiaryEntries", JSON.stringify(entries));
    
    resetDiaryForm();
    renderDiaryEntries();
  });
}

// Render Diary Entries
function renderDiaryEntries() {
  if (!diaryEntriesList) return;
  
  const entries = JSON.parse(localStorage.getItem("loveDiaryEntries") || "[]");
  diaryEntriesList.innerHTML = "";
  
  if (entries.length === 0) {
    diaryEntriesList.innerHTML = `
      <div style="text-align: center; color: #c084fc; font-style: italic; margin-top: 30px; font-size: 0.95rem;">
        Chưa có nhật ký nào... Hãy viết dòng nhật ký đầu tiên để lưu giữ kỉ niệm nhé! 💕
      </div>
    `;
    return;
  }
  
  entries.forEach((entry, index) => {
    const dateObj = new Date(entry.timestamp);
    const timeStr = dateObj.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
    const dateStr = dateObj.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    const diaryItem = document.createElement("div");
    diaryItem.className = "diary-item";
    
    let imageHtml = "";
    if (entry.image) {
      imageHtml = `<img class="diary-item-img" src="${entry.image}" alt="Diary Image" />`;
    }
    
    diaryItem.innerHTML = `
      <div class="diary-item-date">
        <i class="fa-regular fa-clock"></i> ${timeStr} ngày ${dateStr}
      </div>
      <div class="diary-item-text">${entry.text}</div>
      ${imageHtml}
      <button class="delete-entry-btn" data-index="${index}"><i class="fa-solid fa-trash-can"></i></button>
    `;
    
    // Add delete listener
    const deleteBtn = diaryItem.querySelector(".delete-entry-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => {
        if (confirm("Em có chắc chắn muốn xóa dòng nhật ký này không? 🥺")) {
          deleteDiaryEntry(index);
        }
      });
    }
    
    diaryEntriesList.appendChild(diaryItem);
  });
}

// Delete Diary Entry
function deleteDiaryEntry(index) {
  const entries = JSON.parse(localStorage.getItem("loveDiaryEntries") || "[]");
  entries.splice(index, 1);
  localStorage.setItem("loveDiaryEntries", JSON.stringify(entries));
  renderDiaryEntries();
}

// Mascot Daily Notes logic
function getMascotMessages() {
  const now = new Date();
  const hour = now.getHours();
  let primaryNotes = [];

  if (hour >= 6 && hour < 8) {
    // Mục 1: 6h - 8h
    primaryNotes = [
      "Em dạy chưaaaaaa, em nhớ đánh răng rửa đi nhé, thúi rình lên kìa!!! 🪥🦷😷",
      "Sáng ra vào đây xem à, chả nhắn tin với anh... 🥺📱",
      "Chào buổi sáng nhé Lệ Phu Nhân, chúc em một ngày thật rực rỡ và tràn đầy niềm vui nhée! ☀️🌸💖",
      "Qua em có ngủ ngon không, dạy rồi đừng lướt điện thoại nhiều nhé! 🛌📱",
      "Vào đây mà xem lời iu thưn hở, thế thì nhắn tin báo anh, anh cho 1 tỷ lời iu thưn! 💌💑",
      "Đọc được cái này thì lo mà đi ăn sáng đi nhé Lệ Thủy, em gấu quan sát đấy! 🍳🐻"
    ];
  } else if (hour >= 8 && hour < 12) {
    // Mục 2: 8h - 12h
    primaryNotes = [
      "Nay em có mệt không, mệt thì vẫn giữ sức khỏe đều nhé, không được bỏ bữa đâu đấy! 🍲🥤",
      "Vào đây chắc thằng chó già chưa nhắn tin cho chị nhỉ, không sao em gấu ở đây an ủi chị nhé! 🐶🐻🥺",
      "Đấy học hay đang làm gì mà lướt điện thoại đấy, nhớ anh rồi đúng khôngg? 📖📱😏"
    ];
  } else if (hour >= 12 && hour < 18) {
    // Mục 3: 12h - 18h
    primaryNotes = [
      "Buổi trưa em thế nào rồi, nhớ đừng cố quá, ăn nghỉ đúng giờ đấy, nghe chửa? 🍱💤",
      "Chạ thấy chụp ảnh gửi anh nhỉiiii, quên người ta rồi à... 📸🥺",
      "Nay em học có vui không, có gì kể cho anh nghe với nhé! 🏫🎒💬"
    ];
  } else if (hour >= 18 && hour < 21) {
    // Mục 4: 18h - 21h
    primaryNotes = [
      "Em đang làm gì đó, có nấu cơm chưa, hay là ăn cơm ngoài, nhớ ăn uống đảm bảo nhé! 🍚🍳",
      "Ngày hôm nay em thế nào rồi, ngó vào thì chào em gấu một tiếng, anh giao cho em ý trông chừng em đấyy! 🐻👀",
      "Em nhớ học bài điiiii, chứ mà cứ \"kệ mẹ\" thì cuối kì khóc đấyyy! 📚😭✍️"
    ];
  } else if (hour >= 21 && hour < 24) {
    // Mục 5: 21h - 24h
    primaryNotes = [
      "Thằng cha già lại bận rồi, chị đừng buồn em ở đây chơi cùng chị ạ, gấu gấu! 🐻🎮",
      "Em xong công việc chưa, em nhớ để ý giờ ngủ nhé, đừng thức muộn quá thành gấu trúc đấy! 🐼💤",
      "Một buổi tối muộn này mà được nghe giọng em thì anh vui lắm, nhớ voice hay gọi cho anh nhé! 📞🗣️❤️",
      "Nhớ nàng quá nàng ơi, chỉ muốn nói rằng anh siuu yêu em ạaa! 💑💖"
    ];
  } else {
    // Mục 6: 0h - 6h
    primaryNotes = [
      "Sao giờ em còn chưa ngủ??, cất ngay điện thoại đi cho anh làm ơn ngủ luôn nhó! 🛌💤📱",
      "Điều gì khiến nàng trằn trọc vậy, tâm sự cùng anh nhé! 💬🌙",
      "Đêm hôm rồi, thế mà nghe anh chúc ngủ ngon xong vẫn còn thức, gấu gấu xem chị có thấy ghét không? 🐻😒💤",
      "Em mất ngủ ạ, ship cho em 1 cái ôm sang Thái Nguyên nhé. 🚚🤗",
      "Em ngủ ngonn, muộn rồi, anh yêu em! 🌙😴💖"
    ];
  }

  const secondaryNotes = [
    "Hôm nay em cười rất đẹp đấy! Hãy cười nhiều hơn nhé Lệ Thủy của anh! 😊💖",
    "Hôm nay anh lại yêu em nhiều hơn hôm qua rồi! Mãi yêu em! 💑💗",
    "Gửi tới Lệ Thủy ngàn nụ hôn ngọt ngào nhất thế gian! 💋💖",
    "Hôm nay hãy tự hào về bản thân nhé, em đã làm rất tốt rồi! Yêu em nhiều! 🏆💗",
    "Bất cứ khi nào em buồn, hãy nhớ là có một người luôn yêu em hơn tất cả mọi thứ! 💑💜"
  ];

  return primaryNotes.concat(secondaryNotes);
}

const mascotWidget = document.getElementById("mascot-widget");
const mascotSpeechBubble = document.getElementById("mascot-speech-bubble");
const mascotBubbleText = document.getElementById("mascot-bubble-text");
const mascotNoteOverlay = document.getElementById("mascot-note-overlay");
const mascotNoteContent = document.getElementById("mascot-note-content");
const closeMascotNote = document.getElementById("close-mascot-note");

// Click Mascot to see a random sweet message
if (mascotWidget) {
  mascotWidget.addEventListener("click", () => {
    const combinedNotes = getMascotMessages();
    const randomIndex = Math.floor(Math.random() * combinedNotes.length);
    if (mascotNoteContent) {
      mascotNoteContent.innerText = combinedNotes[randomIndex];
    }
    if (mascotNoteOverlay) {
      mascotNoteOverlay.classList.add("active");
    }
    // Hide speech bubble immediately when clicked
    if (mascotSpeechBubble) {
      mascotSpeechBubble.classList.add("hidden");
    }
  });
}

// Close Note modal
if (closeMascotNote && mascotNoteOverlay) {
  closeMascotNote.addEventListener("click", () => {
    mascotNoteOverlay.classList.remove("active");
  });
}

// Periodic Mascot Interactions (shows speech bubble every 15s, hides after 5s)
const mascotSpeeches = [
  "Cần lời yêu thương không? Nhấp vào tớ nhé! 💕",
  "Hôm nay em thế nào rồi? Kể tớ nghe đi! 🧸",
  "Có điều ngọt ngào đang chờ em đó! Click me! 💖",
  "Nhớ uống nước và nghỉ ngơi nhé bé iu! 🥛",
  "Nhấp vào tớ để nạp năng lượng yêu thương nha! 🌟"
];

function triggerMascotBubble() {
  if (!mascotSpeechBubble || !mascotBubbleText || !mascotWidget) return;
  // If mascot is hidden or overlay is open, don't show bubble
  if (mascotWidget.classList.contains("hidden") || (mascotNoteOverlay && mascotNoteOverlay.classList.contains("active"))) return;

  const randomIndex = Math.floor(Math.random() * mascotSpeeches.length);
  mascotBubbleText.innerText = mascotSpeeches[randomIndex];
  mascotSpeechBubble.classList.remove("hidden");

  // Auto hide after 5 seconds
  setTimeout(() => {
    mascotSpeechBubble.classList.add("hidden");
  }, 5000);
}

// Trigger speech bubble every 15 seconds
setInterval(triggerMascotBubble, 15000);
// Initial delay trigger
setTimeout(triggerMascotBubble, 6000);

// Heart Confetti Rain implementation
function triggerHeartConfetti() {
  const colors = ["#f43f5e", "#ec4899", "#d946ef", "#c084fc", "#a855f7", "#fda4af", "#e9d5ff"];
  const container = document.body;
  
  // Spawn 80 hearts
  for (let i = 0; i < 80; i++) {
    const heart = document.createElement("div");
    heart.className = "heart-confetti";
    
    const size = Math.random() * 15 + 12; // 12px to 27px
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100; // 0% to 100%
    const delay = Math.random() * 1.5; // Staggered delay up to 1.5s
    const duration = Math.random() * 2 + 2; // 2s to 4s fall time
    const rotate = Math.random() * 360;
    
    heart.style.width = `${size}px`;
    heart.style.height = `${size}px`;
    heart.style.left = `${left}%`;
    heart.style.top = `-30px`;
    heart.style.color = color;
    heart.style.animationDelay = `${delay}s`;
    heart.style.animationDuration = `${duration}s`;
    heart.style.transform = `rotate(${rotate}deg)`;
    
    heart.innerHTML = `
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    `;
    
    container.appendChild(heart);
    
    // Clean up after animation finishes
    setTimeout(() => {
      heart.remove();
    }, (delay + duration) * 1000);
  }
}

// Floating Fireflies Background implementation
function initFireflies() {
  const firefliesContainer = document.getElementById("fireflies-bg");
  if (!firefliesContainer) return;
  
  const count = 25;
  for (let i = 0; i < count; i++) {
    const firefly = document.createElement("div");
    firefly.className = "firefly";
    
    const size = Math.random() * 6 + 6; // 6px to 12px size
    const top = Math.random() * 100; // 0% to 100% height
    const left = Math.random() * 100; // 0% to 100% width
    const duration = Math.random() * 8 + 6; // 6s to 14s floating animation duration
    const delay = Math.random() * -10; // Negative delay so they start at different phases!
    
    firefly.style.width = `${size}px`;
    firefly.style.height = `${size}px`;
    firefly.style.top = `${top}%`;
    firefly.style.left = `${left}%`;
    firefly.style.animationDuration = `${duration}s`;
    firefly.style.animationDelay = `${delay}s`;
    
    // Custom glowing particle colors (warm yellow, soft cream, lavender, bright purple)
    const colors = [
      "rgba(254, 240, 138, 0.7)", // warm yellow
      "rgba(253, 244, 201, 0.7)", // soft cream
      "rgba(233, 213, 255, 0.7)", // lavender
      "rgba(192, 132, 252, 0.6)"  // bright purple
    ];
    const selectedColor = colors[Math.floor(Math.random() * colors.length)];
    firefly.style.background = selectedColor;
    firefly.style.boxShadow = `0 0 15px 8px ${selectedColor}`;
    
    firefliesContainer.appendChild(firefly);
  }
}

// Start fireflies background on page load
initFireflies();

// Check and apply Midnight Constellation Mode (Night Mode)
function checkNightMode() {
  const hour = new Date().getHours();
  // Night Mode triggers between 9 PM (21h) and 6 AM (6h)
  const isNight = (hour >= 21 || hour < 6);
  
  if (isNight) {
    document.body.classList.add("night-mode");
    const sleepingHat = document.getElementById("mascot-sleeping-hat");
    if (sleepingHat) {
      sleepingHat.classList.remove("hidden");
    }
  } else {
    document.body.classList.remove("night-mode");
    const sleepingHat = document.getElementById("mascot-sleeping-hat");
    if (sleepingHat) {
      sleepingHat.classList.add("hidden");
    }
  }
}

// Apply night mode check on page load
checkNightMode();

// Wish Card Implementation
const btnWishToggle = document.getElementById("btn-wish-toggle");
const wishFormPanel = document.getElementById("wish-form-panel");
const btnCloseWishPanel = document.getElementById("btn-close-wish-panel");
const wishTextarea = document.getElementById("wish-textarea");
const btnSendWish = document.getElementById("btn-send-wish");

if (btnWishToggle && wishFormPanel) {
  btnWishToggle.addEventListener("click", () => {
    wishFormPanel.classList.remove("hidden");
  });
}

if (btnCloseWishPanel && wishFormPanel) {
  btnCloseWishPanel.addEventListener("click", () => {
    wishFormPanel.classList.add("hidden");
    if (wishTextarea) wishTextarea.value = "";
  });
}

// Send Wish to Discord Webhook
if (btnSendWish) {
  btnSendWish.addEventListener("click", () => {
    const wishText = wishTextarea ? wishTextarea.value.trim() : "";
    if (!wishText) {
      alert("Em hãy ghi điều ước vào đây nhé! ✨💕");
      return;
    }

    if (DISCORD_WEBHOOK_URL) {
      fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: `🌟 **ĐIỀU ƯỚC CỦA LỆ THỦY:**\n> "${wishText}"\n👉 Hãy thực hiện cho cô ấy nhé!`
        })
      })
      .then(() => {
        alert("Điều ước của em đã được gửi đi rồi! Hãy chờ điều kỳ diệu nhé! 😉💜");
        wishFormPanel.classList.add("hidden");
        if (wishTextarea) wishTextarea.value = "";
      })
      .catch((err) => {
        console.error("Failed to send wish:", err);
        alert("Gửi điều ước thất bại, em kiểm tra kết nối mạng nhé! 🥺");
      });
    } else {
      alert("Chức năng gửi điều ước đang bận, em báo lại anh nhé! 💕");
    }
  });
}

// Keyboard Arrow Navigation for Music Player on Desktop
document.addEventListener("keydown", (e) => {
  const musicOverlay = document.getElementById("music-overlay");
  const isMusicOpen = musicOverlay && musicOverlay.classList.contains("active");
  
  if (isMusicOpen) {
    if (e.key === "ArrowLeft") {
      prevSong();
    } else if (e.key === "ArrowRight") {
      nextSong();
    }
  }
});

