// Băng số 1: trước khi xem phải tìm đúng cuộn băng trong căn phòng tối.
// Có 5 cuộn, chỉ 1 cuộn thật. Mỗi cuộn giả cho TV chiếu một đoạn chữ ngắn (lấy ý từ các chương đã viết),
// trong đó giấu manh mối dẫn tới cuộn sau:
//   đèn → mẩu giấy → nóc tủ (băng 01) → bình sen, khoá 15 (băng 02) → giá sách, "Từ điển tiếng em" (chìa khoá)
//   → tủ quần áo (băng 03) → vali, khoá 2338 (băng "Băng số 1" giả) → gối (băng thật) → công tắc TV.
// Tiến độ lưu trên máy (lpn:bang1); đã tìm ra rồi thì lần sau băng thật nằm sẵn trong đầu băng.
// Thử lại từ đầu: thêm ?moi=1 vào địa chỉ.
'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const KEY = 'lpn:bang1';
  const TV = window.HoiUc;
  if (!TV) return;
  try { if (/[?&]moi=1\b/.test(location.search)) localStorage.removeItem(KEY); } catch (e) { /* bỏ qua */ }
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const S = Object.assign({ lamp: false, note: false, have: {}, used: {}, seen: {}, open: {}, inVcr: null }, load());
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* bỏ qua */ } };
  // Thoát ra giữa lúc đang chiếu băng giả: lần sau băng đó nằm lại trong khay, không kẹt trong máy.
  if (S.inVcr && S.inVcr !== 'E') S.inVcr = null;

  // ===== Các cuộn băng =====
  const TAPES = {
    A: { label: 'Băng 01 · Mưa', ch: 'CH 01', date: '05.2026', lines: [
      'Mưa gõ trên mái tôn, đều đều.',
      '5 giờ 30 chiều. Có người ngủ thiếp đi sau bốn mươi tiếng thức trắng.',
      'Ít lâu sau, người ấy chạy khắp một thành phố, gom từ ba cửa hàng, cho đủ một bó hoa.',
      '…',
      'Bó hoa ấy đang ở trong phòng này. Mở nó bằng con số của ngày hôm đó.',
    ] },
    B: { label: 'Băng 02 · Sen', ch: 'CH 02', date: '06.08.2026', lines: [
      'Một bó sen hồng gói vụng. Một chiếc bánh kem. Một người quên mất sinh nhật mình.',
      'Có một cuốn sổ, ngày đầu viết ra để thay đổi bản thân.',
      'Rồi một đêm, nó được đổi tên. Tên mới có chữ em.',
      '…',
      'Tìm nó trên giá. Đừng mở nhầm cuốn còn mang tên cũ.',
    ] },
    C: { label: 'Băng 03 · Tủ', ch: 'CH 03', date: '23.10.2026', lines: [
      'Cái tủ hôm thứ Sáu nhẹ đi một nửa.',
      'Có người hỏi: “Có nặng không anh?”',
      'Có người đáp: “Không nặng đâu.” Lời nói dối nhẹ nhàng nhất.',
      '…',
      'Cuộn tiếp theo nằm trong thứ hôm ấy được xách ra cửa.',
      'Mật mã không phải một ngày. Là cái phút em gật đầu.',
    ] },
    D: { label: 'Băng số 1 · 100 ngày', ch: 'CH 06', date: '13.11.2026', lines: [
      'Băng số 1.',
      '…',
      'Ơ. Băng trống trơn.',
      'Vali hôm ấy nhẹ tênh, vì trong đó không còn gì của anh. Cuộn băng này cũng vậy.',
      'Cuộn thật không nằm ở chỗ nào có khoá.',
      'Nó ở chỗ vẫn còn giữ mùi tóc em, sau khi em đi.',
    ] },
    E: { label: 'Băng số 1 ♥', real: true },
  };
  const tapeIcon = '<svg viewBox="0 0 40 24" aria-hidden="true"><rect class="tape-b" x="1" y="1" width="38" height="22" rx="3" /><rect class="tape-l" x="5" y="4" width="30" height="6" rx="1" /><circle class="tape-r" cx="13" cy="16" r="3.5" /><circle class="tape-r" cx="27" cy="16" r="3.5" /></svg>';
  const keyIcon = '<svg viewBox="0 0 40 24" aria-hidden="true"><circle cx="11" cy="12" r="6" fill="none" stroke="#E9C77B" stroke-width="3" /><path d="M17 12h19M30 12v5M35 12v4" stroke="#E9C77B" stroke-width="3" fill="none" /></svg>';

  // ===== Lời nhắc ở dưới, nói khẽ một câu rồi trở về gợi ý của bước hiện tại =====
  let sayTimer = 0;
  function say(text, ms) {
    const h = $('hint');
    h.textContent = text;
    h.classList.remove('out');
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => { h.textContent = stepHint(); }, ms || 4200);
  }

  // ===== Bước hiện tại: đồ vật cần chạm tiếp và câu gợi ý =====
  function step() {
    if (!S.lamp) return { obj: 'lamp', hint: 'Tối quá… tìm cái đèn trước đã.' };
    if (!S.note) return { obj: 'note', hint: 'Hình như trên kệ TV có mẩu giấy.' };
    if (!S.have.A) return { obj: 'tapeA', hint: 'Chỗ cao nhất trong phòng…' };
    if (!S.seen.A) return { obj: S.inVcr === 'A' ? 'vcr' : 'inv', hint: 'Cho cuộn băng vào đầu băng dưới TV.' };
    if (!S.have.B) return { obj: 'vase', hint: 'Bó hoa trên kệ. Hôm ấy có bao nhiêu bông?' };
    if (!S.seen.B) return { obj: 'inv', hint: 'Xem cuộn băng mới tìm được.' };
    if (!S.have.key) return { obj: 'shelf', hint: 'Cuốn sổ đã được đổi tên.' };
    if (!S.have.C) return { obj: 'wardrobe', hint: 'Chiếc chìa khoá nhỏ này mở cái gì nhỉ?' };
    if (!S.seen.C) return { obj: 'inv', hint: 'Xem cuộn băng thứ ba.' };
    if (!S.have.D) return { obj: 'case', hint: 'Không phải ngày. Là phút.' };
    if (!S.seen.D) return { obj: 'inv', hint: 'Cuối cùng cũng thấy “Băng số 1”…' };
    if (!S.have.E) return { obj: 'pillow', hint: 'Thứ vẫn còn giữ mùi tóc em.' };
    if (S.inVcr !== 'E') return { obj: 'inv', hint: 'Cho cuộn băng thật vào máy.' };
    return { obj: 'power', hint: 'Bấm công tắc để bật' };
  }
  const stepHint = () => step().hint;

  // Đứng yên lâu: 35 giây thì đồ cần chạm khẽ sáng, 80 giây thì hiện thêm câu gợi ý.
  let idle = 0;
  function poke() { idle = 0; for (const n of document.querySelectorAll('.glow')) n.classList.remove('glow'); }
  setInterval(() => {
    if (TV.busy() || !$('look').hidden || $('room').hidden) return;
    idle++;
    const st = step();
    if (idle === 35) {
      const target = st.obj === 'inv' ? $('inv').querySelector('button') : st.obj === 'power' ? $('power') : document.querySelector('[data-obj="' + st.obj + '"]');
      if (target) target.classList.add('glow');
    }
    if (idle === 80) say('Gợi ý: ' + st.hint, 9000);
  }, 1000);
  addEventListener('pointerdown', poke);

  // ===== Vẽ lại phòng theo tiến độ =====
  function render() {
    $('room').classList.toggle('lit', !!S.lamp);
    $('scene').querySelector('[data-obj="note"]').hidden = !S.lamp;
    $('scene').querySelector('[data-obj="tapeA"]').classList.toggle('gone', !!S.have.A);
    const inv = $('inv');
    inv.replaceChildren();
    for (const id of ['A', 'B', 'C', 'D', 'E']) {
      if (!S.have[id] || S.inVcr === id) continue;
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = tapeIcon + '<span></span>';
      b.querySelector('span').textContent = TAPES[id].label;
      if (!S.seen[id] && !TAPES[id].real) b.classList.add('new');
      b.addEventListener('click', () => insert(id));
      inv.appendChild(b);
    }
    if (S.have.key && !S.open.wardrobe) {
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = keyIcon + '<span>Chìa khoá nhỏ</span>';
      b.addEventListener('click', () => say('Chìa khoá bé xíu. Chắc mở được cái gì đó có cánh.'));
      inv.appendChild(b);
    }
    $('vcr-label').textContent = S.inVcr ? TAPES[S.inVcr].label : '';
    $('vcr-led').classList.toggle('on', !!S.inVcr);
    TV.armReal(S.inVcr === 'E');
    if (!TV.busy()) $('hint').textContent = stepHint();
  }

  // ===== Cho băng vào máy =====
  async function insert(id) {
    if (TV.busy()) return;
    TV.audioOn();
    TV.sfx.click();
    S.inVcr = id;
    save();
    render();
    if (TAPES[id].real) { say('Cạch. Băng thật đã vào máy.', 3000); return; }
    await TV.playFake(TAPES[id]);
    S.seen[id] = true;
    S.inVcr = null; // băng giả chiếu xong thì nhả ra
    save();
    render();
  }

  // ===== Nhìn gần =====
  function look(title, html, setup) {
    $('look-title').textContent = title;
    $('look-body').innerHTML = html;
    $('look').hidden = false;
    if (setup) setup($('look-body'));
  }
  function closeLook() { $('look').hidden = true; render(); }
  $('look-close').addEventListener('click', closeLook);
  $('look').addEventListener('click', (e) => { if (e.target === $('look')) closeLook(); });

  // Khoá số dạng bánh xe: chạm ▲ ▼ để đổi từng số.
  function lock(n, onTry) {
    const digits = Array(n).fill(0);
    const wrap = document.createElement('div');
    wrap.className = 'lock';
    digits.forEach((_, i) => {
      const w = document.createElement('div');
      w.className = 'wheel';
      w.innerHTML = '<button type="button" aria-label="Tăng">▲</button><b>0</b><button type="button" aria-label="Giảm">▼</button>';
      const [up, , down] = w.children;
      const show = () => { w.querySelector('b').textContent = digits[i]; TV.sfx.click(); };
      up.addEventListener('click', () => { digits[i] = (digits[i] + 1) % 10; show(); });
      down.addEventListener('click', () => { digits[i] = (digits[i] + 9) % 10; show(); });
      wrap.appendChild(w);
    });
    const go = document.createElement('div');
    go.className = 'lk-btns';
    go.innerHTML = '<button type="button" class="primary">Thử mở</button>';
    go.firstChild.addEventListener('click', () => onTry(digits.join('')));
    const box = document.createElement('div');
    box.append(wrap, go);
    return box;
  }
  const msg = (body, text, cls) => {
    let p = body.querySelector('.msg');
    if (!p) { p = document.createElement('p'); body.appendChild(p); }
    p.className = 'msg ' + (cls || 'say');
    p.textContent = text;
  };

  // ===== Đồ vật =====
  const OBJ = {
    lamp() {
      if (!S.lamp) {
        S.lamp = true;
        save();
        TV.audioOn();
        TV.sfx.click();
        render();
        say('Sáng rồi. Căn phòng này… quen quen.', 3500);
        return;
      }
      say('Để đèn sáng thôi. Tối em sợ.');
    },
    note() {
      S.note = true;
      save();
      look('Mẩu giấy', '<p class="hand">Gửi thám tử Thủy,\nTrong phòng này có năm cuộn băng. Chỉ một cuộn là phim thật.\nBốn cuộn kia không có hình, nhưng cuộn nào cũng chỉ đường tới cuộn sau.\nCuộn đầu tiên ở chỗ cao nhất trong phòng.\nNhớ quy tắc thứ ba của thám tử nhé.</p><p class="say">(Quy tắc thứ ba: manh mối quan trọng nhất đôi khi không nằm dưới lá, mà nằm trong trí nhớ.)</p>');
    },
    tapeA() {
      if (S.have.A) return;
      S.have.A = true;
      save();
      TV.sfx.click();
      render();
      say('Một cuộn băng trên nóc tủ: “Băng 01 · Mưa”. Chạm vào nó ở góc dưới để cho vào máy.', 6000);
    },
    shelf() {
      if (!S.seen.B) { say(S.note ? 'Không, còn chỗ cao hơn giá sách.' : 'Toàn sách là sách. Chưa biết tìm cuốn nào.'); return; }
      if (S.have.key) { say('Cuốn sổ đã mở rồi. Các cuốn khác cứ để yên đó.'); return; }
      const books = [
        ['Nhật ký thay đổi bản thân', '#5E4B3C', 'Cuốn này đổi tên lâu rồi mà. Tên cũ không còn dùng nữa.'],
        ['Kỹ thuật Viễn thông', '#3E5C76', 'Toàn công thức sóng. Khô khan lắm, đọc chắc ngủ mất.'],
        ['Từ điển Anh – Việt', '#4F6B4A', 'Từ điển này dày thật, nhưng không có tiếng em.'],
        ['Sóng · Xuân Quỳnh', '#8C3B3B', 'Thơ hay. Nhưng cuốn cần tìm không phải thơ.'],
        ['Từ điển tiếng em', '#B5462F', null],
        ['Truyện Kiều', '#6A4428', 'Dày quá, nhét băng không vừa đâu.'],
      ];
      look('Giá sách', '<p>Sáu cuốn xếp cạnh nhau. Chạm vào gáy để rút ra.</p><div class="books"></div>', (body) => {
        const row = body.querySelector('.books');
        for (const [name, color, no] of books) {
          const b = document.createElement('button');
          b.type = 'button';
          b.textContent = name;
          b.style.background = color;
          b.addEventListener('click', () => {
            TV.sfx.click();
            if (no) { msg(body, no); return; }
            S.have.key = true;
            save();
            $('look-title').textContent = 'Từ điển tiếng em ❤️';
            body.innerHTML = '<p class="hand">Từ lúc này, xin được nói trong nhật kí là Anh Yêu Em.</p><p>Kẹp giữa hai trang là một chiếc chìa khoá nhỏ.</p>';
          });
          row.appendChild(b);
        }
      });
    },
    wardrobe() {
      if (!S.have.key) { say(S.lamp ? 'Tủ khoá rồi. Cần chìa.' : 'Tối quá, chưa thấy gì.'); return; }
      const take = () => {
        S.open.wardrobe = true;
        S.have.C = true;
        save();
        TV.sfx.click();
        $('look-body').innerHTML = '<p>Em gỡ cuộn băng xuống: “Băng 03 · Tủ”.</p>';
      };
      if (S.have.C) { look('Tủ quần áo', '<p>Một nửa cái tủ trống trơn. Cái móc em hay treo áo vẫn ở đó, trống không.</p>'); return; }
      look('Tủ quần áo', '<p>Chìa khoá vừa khít. Cánh tủ mở ra.</p><p>Một nửa cái tủ trống trơn. Bên kia là áo của anh. Trên cái móc em hay treo áo, có thứ gì đó đang đung đưa.</p><div class="lk-btns"><button type="button" class="t-hang">Cái móc trống</button><button type="button" class="t-shirt">Mấy cái áo của anh</button></div>', (body) => {
        TV.sfx.click();
        body.querySelector('.t-hang').addEventListener('click', take);
        body.querySelector('.t-shirt').addEventListener('click', () => msg(body, 'Áo anh. Chẳng có gì, chỉ có mùi phòng thí nghiệm.'));
      });
    },
    vase() {
      if (S.have.B) { look('Bình sen', '<p>Ổ khoá nhỏ đã bật ra. Mấy bông sen vẫn hồng như hôm ấy.</p>'); return; }
      look('Bình sen', '<p>Bình cắm mười bốn bông sen hồng. Dưới đáy bình gắn một ổ khoá nhỏ, hai số.</p>', (body) => {
        body.appendChild(lock(2, (code) => {
          if (code === '15') {
            S.have.B = true;
            save();
            TV.sfx.click();
            body.innerHTML = '<p>Tách. Ngăn bí mật dưới đáy bình bật ra.</p><p>Bên trong: “Băng 02 · Sen”.</p>';
            return;
          }
          msg(body, code === '14' ? 'Trong bình đúng là mười bốn bông. Nhưng hôm ấy anh gom được bao nhiêu bông?' : 'Khoá không nhúc nhích.');
        }));
      });
    },
    case() {
      if (S.have.D) { look('Chiếc vali', '<p>Vali mở rồi. Bên trong trống, nhẹ tênh.</p>'); return; }
      look('Chiếc vali', '<p>Chiếc vali đã cùng đi Sa Pa, rồi về Thái Nguyên, rồi Yên Bái. Khoá số bốn chữ.</p>', (body) => {
        body.appendChild(lock(4, (code) => {
          if (code === '2338') {
            S.have.D = true;
            save();
            TV.sfx.click();
            body.innerHTML = '<p>Tách. Nắp vali bật lên.</p><p>Nằm giữa vali là một cuộn băng, nhãn viết tay: “Băng số 1 · 100 ngày”.</p>';
            return;
          }
          if (code === '0608') { msg(body, 'Đó là ngày. Anh hỏi cái phút cơ.'); return; }
          if (code === '2310') { msg(body, 'Ngày xách vali ra cửa. Nhưng mật mã không phải ngày.'); return; }
          msg(body, 'Tách. Vẫn khoá.');
        }));
      });
    },
    pillow() {
      if (!S.seen.D) { say('Gối êm lắm. Nhưng giờ chưa phải lúc ngủ.'); return; }
      if (S.have.E) { say('Gối vẫn còn mùi tóc em.'); return; }
      S.have.E = true;
      save();
      look('Cái gối', '<p>Em nhấc gối lên. Gối vẫn còn mùi tóc em.</p><p>Bên dưới là một cuộn băng, nhãn viết tay, có vẽ một trái tim nhỏ: “Băng số 1”.</p><p class="say">Lần này là thật rồi.</p>');
    },
    cal() { say(S.lamp ? 'Lịch tháng 8. Có một ngày được khoanh đỏ.' : 'Tối quá, chưa thấy gì.'); },
    phone() { say(S.lamp ? 'Pin đầy. Lần này anh không để sập nguồn nữa.' : 'Tối quá, chưa thấy gì.'); },
    vcr() {
      if (S.inVcr === 'E') { say('Băng thật đang trong máy. Bấm công tắc TV đi.'); return; }
      const have = ['A', 'B', 'C', 'D', 'E'].filter((id) => S.have[id]);
      say(have.length ? 'Chạm vào cuộn băng ở góc dưới để cho vào máy.' : 'Đầu băng trống. Chưa có cuộn nào cả.');
    },
  };
  for (const b of document.querySelectorAll('#scene [data-obj]')) {
    b.addEventListener('click', () => {
      if (TV.busy()) return;
      const name = b.dataset.obj;
      if (!S.lamp && name !== 'lamp') { say('Tối quá, chưa thấy gì. Tìm cái đèn trước đã.'); return; }
      OBJ[name]();
    });
  }

  window.HoiUcRoom = { say };
  render();
})();
