// 공통 코드: 모든 페이지에서 먼저 불러옵니다.
// (anon 키와 토스 클라이언트 키는 공개되어도 안전한 키입니다)
const SUPABASE_URL = 'https://zlzolpvwxhjrbkuixfmr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsem9scHZ3eGhqcmJrdWl4Zm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMjU2MjEsImV4cCI6MjEwODcwMTYyMX0.Nh_TJ9PaKyuQ9lzG7dW9vpj7UFSUqOpLqcbz4m3crys';
const TOSS_CLIENT_KEY = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';

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
  links.push(user ? '<button id="logout">로그아웃</button>' : '<a href="login.html">로그인</a>');
  document.getElementById('header').innerHTML = '<a class="logo" href="index.html">굿즈샵</a><nav>' + links.join('') + '</nav>';
  const out = document.getElementById('logout');
  if (out) out.onclick = async () => { await sb.auth.signOut(); location.href = 'index.html'; };
  return { user, isAdmin };
}
