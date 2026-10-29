// 공통 코드: 모든 페이지에서 먼저 불러옵니다.
// (anon 키와 토스 클라이언트 키는 공개되어도 안전한 키입니다)
const SUPABASE_URL = 'https://zlzolpvwxhjrbkuixfmr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsem9scHZ3eGhqcmJrdWl4Zm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMjU2MjEsImV4cCI6MjEwODcwMTYyMX0.Nh_TJ9PaKyuQ9lzG7dW9vpj7UFSUqOpLqcbz4m3crys';
const TOSS_CLIENT_KEY = 'test_ck_DnyRpQWGrNzZzn1M90Q0rKwv1M9E';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const won = (n) => Number(n).toLocaleString('ko-KR') + '원';

// 로그인 안 했으면 login.html로 보냅니다. 로그인한 user를 돌려줍니다.
async function requireLogin() {
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    location.href = 'login.html';
    return null;
  }
  return data.session.user;
}

// 상단 메뉴를 <header id="header"></header> 안에 그립니다.
async function renderHeader() {
  const { data } = await sb.auth.getSession();
  const user = data.session && data.session.user;
  let isAdmin = false;
  if (user) {
    const r = await sb.from('admins').select('user_id').eq('user_id', user.id);
    isAdmin = !!(r.data && r.data.length);
  }
  const links = ['<a href="index.html">상품</a>'];
  if (user) links.push('<a href="orders.html">내 결제</a>');
  if (isAdmin) links.push('<a href="admin.html">관리자</a>');
  links.push(user ? '<button id="logout">로그아웃</button>' : '<a class="cta" href="login.html">로그인</a>');
  document.getElementById('header').innerHTML = '<a class="logo" href="index.html">굿즈샵</a><nav>' + links.join('') + '</nav>';
  const out = document.getElementById('logout');
  if (out) out.onclick = async () => { await sb.auth.signOut(); location.href = 'index.html'; };
  return { user, isAdmin };
}

// 서비스워커 등록: 방문한 페이지를 저장해 두었다가 오프라인에서도 보여줍니다.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

// 안드로이드 크롬이 보내주는 "설치 가능" 신호를 잡아 둡니다.
let installEvent = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvent = e; });

// 모바일에서 처음 방문했을 때 "홈 화면에 추가" 안내를 딱 한 번 보여줍니다.
function showInstallTip() {
  const installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (installed || !matchMedia('(pointer: coarse)').matches) return;
  try { if (localStorage.getItem('installTipShown')) return; } catch (e) {}
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  setTimeout(() => {
    if (!ios && !installEvent) return; // 설치 방법을 안내할 수 없는 브라우저
    try { localStorage.setItem('installTipShown', '1'); } catch (e) {}
    const tip = document.createElement('div');
    tip.className = 'install-tip';
    const text = document.createElement('p');
    text.textContent = ios ? '아래 공유 버튼을 누르고 "홈 화면에 추가"를 선택하면 앱처럼 쓸 수 있어요' : '홈 화면에 추가하면 앱처럼 빠르게 열 수 있어요';
    tip.appendChild(text);
    if (installEvent) {
      const go = document.createElement('button');
      go.className = 'go';
      go.textContent = '설치';
      go.onclick = () => { installEvent.prompt(); installEvent = null; tip.remove(); };
      tip.appendChild(go);
    }
    const close = document.createElement('button');
    close.textContent = '닫기';
    close.onclick = () => tip.remove();
    tip.appendChild(close);
    document.body.appendChild(tip);
  }, 2500);
}
