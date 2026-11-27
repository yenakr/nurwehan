import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { listSkillScns, studentSkillScns } from '@/lib/ehr-class';
import { SKILLS, cleanCfg, defaultCfg, vary, type Cfg } from '@/app/ehr/skills/scn';

export type Resolved = { skill: string; cfg: Cfg; exam: boolean; scnId: string; title: string };

// 기본 시나리오(key = 술기 이름) 또는 교수가 출제한 시나리오(key = id). 랜덤 배정이면 학생마다 같은 값으로 고정해 변형한다.
export async function resolveScn(key: string, userId: string, admin = false): Promise<Resolved | null> {
  const def = SKILLS.find(s => s.key === key);
  if (def) return { skill: key, cfg: defaultCfg(key), exam: false, scnId: '', title: def.title };
  const rows = admin ? await listSkillScns() : await studentSkillScns(userId);
  const r = rows.find(x => x.id === key);
  if (!r) return null;
  let cfg = cleanCfg(r.data.cfg, r.data.skill);
  if (r.data.assign === 'random') cfg = vary(cfg, r.data.skill, `${userId}:${r.id}`);
  return { skill: r.data.skill, cfg, exam: !!r.data.exam, scnId: r.id, title: r.data.title };
}
export async function skillUser() {
  const user = await getCurrentUser();
  return user ? { user, admin: isAdminRole(user.role) } : null;
}
