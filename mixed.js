import http from 'k6/http';
import { check } from 'k6';
import { Rate } from 'k6/metrics';
export const payFail = new Rate('pay_pofod');
export const options = {
  thresholds: {
    'http_req_duration{name:cart}':   ['p(95)<5000'],
    'http_req_duration{name:report}': ['p(95)<5000'],
    'http_req_duration{name:pay}':    ['p(95)<5000'],
    'pay_pofod': ['rate<1'],
  },
  scenarios: {
    cart:   { executor: 'constant-arrival-rate', rate: 500, timeUnit: '1s', duration: '60s',
              preAllocatedVUs: 50, maxVUs: 400, exec: 'cart' },
    report: { executor: 'constant-arrival-rate', rate: 50, timeUnit: '1s', duration: '60s',
              preAllocatedVUs: 50, maxVUs: 200, exec: 'report' },
    pay:    { executor: 'constant-arrival-rate', rate: 100, timeUnit: '1s', duration: '60s',
              preAllocatedVUs: 20, maxVUs: 200, exec: 'pay' },
  },
};
export function cart() {
  const r = http.post('http://localhost:3000/cart/add', null, { tags: { name: 'cart' } });
  check(r, { 'cart 200': (x) => x.status === 200 });
}
export function report() {
  http.get('http://localhost:3000/report', { tags: { name: 'report' } });
}
export function pay() {
  const r = http.post('http://localhost:3000/pay', null, { tags: { name: 'pay' } });
  payFail.add(r.status !== 200);
}
