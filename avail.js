import http from 'k6/http';
import { Rate, Counter } from 'k6/metrics';
export const availability = new Rate('availability');
export const reqDuringOutage = new Counter('reqs_failed');
export const options = {
  scenarios: { probe: { executor: 'constant-vus', vus: 20, duration: '120s' } },
  thresholds: { availability: ['rate>0.90'] },
};
export default function () {
  const r = http.post('http://localhost:3000/cart/add', null, { timeout: '2s' });
  const ok = r.status === 200;
  availability.add(ok);
  if (!ok) reqDuringOutage.add(1);
}
