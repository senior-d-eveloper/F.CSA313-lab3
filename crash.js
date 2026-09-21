// 3-р сценарийн хэмжилт: ачаалал явж байх үед процессыг унагааж бэлэн байдлыг хэмжинэ.
// ЭНЭ СКРИПТ ДАНГААРАА СЕРВЕРИЙГ УНАГААХГҮЙ — уналтыг зэрэгцээ өдөөх ёстой.
// README-гийн "Хэмжилтийг давтах" хэсгийн бүрэн тушаалыг ашиглана уу.

import http from 'k6/http';
import { Rate } from 'k6/metrics';
export const up = new Rate('availability');
export const options = {
  scenarios: { probe: { executor: 'constant-arrival-rate', rate: 200, timeUnit: '1s',
    duration: '30s', preAllocatedVUs: 30, maxVUs: 200 } },
  thresholds: { availability: ['rate>0'] },
};
export default function () {
  const r = http.post('http://localhost:3000/cart/add', null, { timeout: '2s' });
  up.add(r.status === 200);
}
