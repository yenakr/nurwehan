// 진행 중인 화면(퀴즈 풀이 등)에서 하단 메뉴로 나갈 때 확인을 받기 위한 표시.
let msg: string | null = null;

export function setLeaveGuard(m: string | null) {
  msg = m;
}

export function getLeaveGuard() {
  return msg;
}
