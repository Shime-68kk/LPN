/**
 * Mini-Games Collection for Hộp Quà Tình Yêu (LPN)
 * 1. 🎡 Vòng Quay Điều Ước (Wheel of Love)
 * 2. 🎴 Lật Thẻ Trí Nhớ (Memory Match)
 */

// ==================== 1. VÒNG QUAY ĐIỀU ƯỚC ====================
class LoveWheelGame {
  constructor() {
    this.canvas = document.getElementById("love-wheel-canvas");
    this.spinBtn = document.getElementById("btn-spin-wheel");
    this.resultBox = document.getElementById("wheel-result-box");
    this.resultText = document.getElementById("wheel-result-text");
    this.claimBtn = document.getElementById("btn-claim-wish");
    this.spinAgainBtn = document.getElementById("btn-spin-again");

    this.gifts = [
      { text: "Ăn lẩu cùng anh", icon: "🍲", color: "#f43f5e" },
      { text: "Trà sữa full topping", icon: "🧋", color: "#8b5cf6" },
      { text: "100 cái ôm thật ấm", icon: "🤗", color: "#ec4899" },
      { text: "Làm công chúa 1 ngày", icon: "👑", color: "#f59e0b" },
      { text: "Quà bí mật từ anh", icon: "🎁", color: "#a855f7" },
      { text: "Hẹn hò đi ăn kem", icon: "🍦", color: "#06b6d4" },
      { text: "Massage & sấy tóc", icon: "💆", color: "#d946ef" },
      { text: "1 Điều ước bất kỳ", icon: "✨", color: "#eab308" }
    ];

    this.numSlices = this.gifts.length;
    this.sliceAngle = (2 * Math.PI) / this.numSlices;
    this.currentAngle = 0;
    this.isSpinning = false;

    if (this.canvas) {
      this.init();
    }
  }

  init() {
    this.drawWheel();

    if (this.spinBtn) {
      this.spinBtn.addEventListener("click", () => this.spin());
    }

    if (this.spinAgainBtn) {
      this.spinAgainBtn.addEventListener("click", () => {
        if (this.resultBox) this.resultBox.classList.add("hidden");
        this.spin();
      });
    }

    if (this.claimBtn) {
      this.claimBtn.addEventListener("click", () => {
        const currentWish = this.resultText ? this.resultText.innerText : "";
        const wishPanel = document.getElementById("wish-form-panel");
        const wishTextarea = document.getElementById("wish-textarea");
        if (wishPanel && wishTextarea) {
          wishTextarea.value = `Anh ơi, em vừa quay trúng phần thưởng: "${currentWish}"! Anh nhớ thực hiện cho em nha 💖✨`;
          wishPanel.classList.remove("hidden");
        }
      });
    }
  }

  drawWheel() {
    if (!this.canvas) return;
    const ctx = this.canvas.getContext("2d");
    const width = this.canvas.width;
    const height = this.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 12;

    ctx.clearRect(0, 0, width, height);

    // Bàn quay bóng bẩy
    for (let i = 0; i < this.numSlices; i++) {
      const angle = this.currentAngle + i * this.sliceAngle;
      const gift = this.gifts[i];

      // Nan quạt
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + this.sliceAngle);
      ctx.closePath();
      ctx.fillStyle = gift.color;
      ctx.fill();

      // Viền phân cách
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Text và icon
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + this.sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 4;
      ctx.font = "bold 13px 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(`${gift.icon} ${gift.text}`, radius - 20, 5);
      ctx.restore();
    }

    // Viền ngoài ánh kim
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#ffffff";
    ctx.shadowColor = "rgba(147, 51, 234, 0.5)";
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Các chấm đính đá phát sáng
    for (let i = 0; i < this.numSlices * 2; i++) {
      const dotAngle = (i * Math.PI) / this.numSlices;
      const dotX = centerX + (radius + 2) * Math.cos(dotAngle);
      const dotY = centerY + (radius + 2) * Math.sin(dotAngle);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 3, 0, 2 * Math.PI);
      ctx.fillStyle = i % 2 === 0 ? "#ffd700" : "#ffffff";
      ctx.fill();
    }
  }

  spin() {
    if (this.isSpinning) return;
    this.isSpinning = true;
    if (this.resultBox) this.resultBox.classList.add("hidden");

    // Chọn ngẫu nhiên ô thắng
    const winningIndex = Math.floor(Math.random() * this.numSlices);
    const sliceDeg = 360 / this.numSlices;

    // Kim chỉ nằm ở đỉnh (góc 270 độ / -90 độ trong Canvas)
    // Để ô trúng thưởng nằm ở đỉnh:
    const targetDeg = 270 - (winningIndex * sliceDeg + sliceDeg / 2);
    // Quay thêm từ 5 đến 7 vòng đầy đủ
    const extraRounds = (Math.floor(Math.random() * 3) + 5) * 360;
    const finalAngleDeg = extraRounds + targetDeg;

    const startAngle = this.currentAngle;
    const totalChange = (finalAngleDeg * Math.PI) / 180 - (startAngle % (2 * Math.PI));
    const duration = 4800; // 4.8 giây
    const startTime = performance.now();

    const popSound = document.getElementById("pop-sound");

    const animateSpin = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing cubic-out
      const ease = 1 - Math.pow(1 - progress, 3);
      this.currentAngle = startAngle + totalChange * ease;
      this.drawWheel();

      if (progress < 1) {
        requestAnimationFrame(animateSpin);
      } else {
        this.isSpinning = false;
        this.onSpinEnd(winningIndex);
      }
    };

    requestAnimationFrame(animateSpin);
  }

  onSpinEnd(index) {
    const gift = this.gifts[index];

    // Âm thanh ăn mừng
    const popSound = document.getElementById("pop-sound");
    if (popSound) {
      const clone = popSound.cloneNode();
      clone.play().catch(() => {});
    }

    // Nổ pháo hoa trái tim
    if (typeof triggerHeartConfetti === "function") {
      triggerHeartConfetti();
    }

    // Hiển thị phần thưởng
    if (this.resultBox && this.resultText) {
      this.resultText.innerHTML = `Chúc mừng công chúa Lệ Thủy! 💖<br><strong>${gift.icon} ${gift.text}</strong>`;
      this.resultBox.classList.remove("hidden");
    }
  }
}

// ==================== 2. LẬT THẺ TRÍ NHỚ (MEMORY MATCH) ====================
class MemoryMatchGame {
  constructor() {
    this.grid = document.getElementById("memory-cards-grid");
    this.movesEl = document.getElementById("memory-moves-count");
    this.pairsEl = document.getElementById("memory-pairs-count");
    this.timerEl = document.getElementById("memory-timer");
    this.restartBtn = document.getElementById("btn-restart-memory");
    this.winModal = document.getElementById("memory-win-modal");
    this.winMsg = document.getElementById("memory-win-message");
    this.playAgainBtn = document.getElementById("btn-memory-play-again");

    this.icons = [
      { id: "bear", icon: "🧸", name: "Bé Gấu" },
      { id: "heart", icon: "💖", name: "Trái Tim" },
      { id: "rose", icon: "🌹", name: "Hoa Hồng" },
      { id: "letter", icon: "💌", name: "Thư Tình" },
      { id: "crown", icon: "👑", name: "Vương Miện" },
      { id: "strawberry", icon: "🍓", name: "Dâu Tây" },
      { id: "bow", icon: "🎀", name: "Nơ Lụa" },
      { id: "star", icon: "🌟", name: "Ngôi Sao" }
    ];

    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.moves = 0;
    this.timer = null;
    this.seconds = 0;
    this.isLocked = false;

    if (this.grid) {
      this.init();
    }
  }

  init() {
    if (this.restartBtn) {
      this.restartBtn.addEventListener("click", () => this.restart());
    }
    if (this.playAgainBtn) {
      this.playAgainBtn.addEventListener("click", () => {
        if (this.winModal) this.winModal.classList.add("hidden");
        this.restart();
      });
    }
    this.restart();
  }

  restart() {
    clearInterval(this.timer);
    this.seconds = 0;
    this.moves = 0;
    this.matchedPairs = 0;
    this.flippedCards = [];
    this.isLocked = false;

    if (this.movesEl) this.movesEl.innerText = "0";
    if (this.pairsEl) this.pairsEl.innerText = "0/8";
    if (this.timerEl) this.timerEl.innerText = "00:00";
    if (this.winModal) this.winModal.classList.add("hidden");

    // Tạo 8 cặp (16 thẻ) và xáo trộn
    const deck = [...this.icons, ...this.icons]
      .map((item, index) => ({ ...item, uniqueId: index }))
      .sort(() => Math.random() - 0.5);

    this.cards = deck;
    this.renderCards();

    // Khởi động đồng hồ đếm giây
    this.timer = setInterval(() => {
      this.seconds++;
      const mins = Math.floor(this.seconds / 60).toString().padStart(2, "0");
      const secs = (this.seconds % 60).toString().padStart(2, "0");
      if (this.timerEl) this.timerEl.innerText = `${mins}:${secs}`;
    }, 1000);
  }

  renderCards() {
    if (!this.grid) return;
    this.grid.innerHTML = "";

    this.cards.forEach((cardData) => {
      const cardEl = document.createElement("div");
      cardEl.className = "memory-card";
      cardEl.dataset.id = cardData.id;
      cardEl.dataset.uniqueId = cardData.uniqueId;

      cardEl.innerHTML = `
        <div class="memory-card-inner">
          <div class="memory-card-front">
            <span class="card-q">💜</span>
          </div>
          <div class="memory-card-back">
            <span class="card-icon">${cardData.icon}</span>
          </div>
        </div>
      `;

      cardEl.addEventListener("click", () => this.onCardClick(cardEl, cardData));
      this.grid.appendChild(cardEl);
    });
  }

  onCardClick(cardEl, cardData) {
    if (this.isLocked) return;
    if (cardEl.classList.contains("flipped") || cardEl.classList.contains("matched")) return;

    // Âm thanh lật thẻ
    const popSound = document.getElementById("pop-sound");
    if (popSound) {
      const clone = popSound.cloneNode();
      clone.play().catch(() => {});
    }

    cardEl.classList.add("flipped");
    this.flippedCards.push({ el: cardEl, data: cardData });

    if (this.flippedCards.length === 2) {
      this.moves++;
      if (this.movesEl) this.movesEl.innerText = this.moves;
      this.checkMatch();
    }
  }

  checkMatch() {
    this.isLocked = true;
    const [card1, card2] = this.flippedCards;

    if (card1.data.id === card2.data.id) {
      // Khớp cặp!
      setTimeout(() => {
        card1.el.classList.add("matched");
        card2.el.classList.add("matched");
        this.matchedPairs++;
        if (this.pairsEl) this.pairsEl.innerText = `${this.matchedPairs}/8`;
        this.flippedCards = [];
        this.isLocked = false;

        if (this.matchedPairs === 8) {
          this.onGameWon();
        }
      }, 400);
    } else {
      // Không khớp, lật lại
      setTimeout(() => {
        card1.el.classList.remove("flipped");
        card2.el.classList.remove("flipped");
        this.flippedCards = [];
        this.isLocked = false;
      }, 900);
    }
  }

  onGameWon() {
    clearInterval(this.timer);

    if (typeof triggerHeartConfetti === "function") {
      triggerHeartConfetti();
    }

    setTimeout(() => {
      if (this.winModal && this.winMsg) {
        const mins = Math.floor(this.seconds / 60);
        const secs = this.seconds % 60;
        const timeStr = mins > 0 ? `${mins} phút ${secs} giây` : `${secs} giây`;
        this.winMsg.innerHTML = `Lệ Thủy của anh xuất sắc quá! 🎉<br>Em đã tìm trọn vẹn 8 cặp trong <strong>${this.moves}</strong> lượt mở và <strong>${timeStr}</strong>!<br>Trí nhớ tuyệt đỉnh thế này thì nhớ anh Quang suốt đời nhé! 💑💖`;
        this.winModal.classList.remove("hidden");
      }
    }, 500);
  }
}

// ==================== 3. KHỞI TẠO VÀ TAB SWITCHER ====================
let loveWheelInstance = null;
let memoryGameInstance = null;

function initGiftMiniGames() {
  const tabBtns = document.querySelectorAll(".gift-tab-btn");
  const tabContents = document.querySelectorAll(".gift-tab-content");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");

      // Cập nhật nút active
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      try {
        btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      } catch (e) {}

      // Cập nhật nội dung active
      tabContents.forEach((content) => {
        if (content.id === `tab-${targetTab}`) {
          content.classList.add("active");
        } else {
          content.classList.remove("active");
        }
      });

      // Lazy init các game khi mở tab
      if (targetTab === "wheel") {
        if (!loveWheelInstance) {
          loveWheelInstance = new LoveWheelGame();
        } else {
          loveWheelInstance.drawWheel();
        }
      } else if (targetTab === "memory") {
        if (!memoryGameInstance) {
          memoryGameInstance = new MemoryMatchGame();
        }
      }
    });
  });
}

// Chạy khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
  initGiftMiniGames();
});

// Export ra window
window.LoveWheelGame = LoveWheelGame;
window.MemoryMatchGame = MemoryMatchGame;
