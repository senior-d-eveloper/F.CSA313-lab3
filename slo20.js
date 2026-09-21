import http from 'k6/http';
import { Rate } from 'k6/metrics';
export const pofod = new Rate('pay_pofod');
export const options = {
  scenarios: {
    cart: { executor: 'constant-vus', vus: 20, duration: '60s', exec: 'cart' },
    pay:  { executor: 'constant-vus', vus: 20, duration: '60s', exec: 'pay' },
  },
  thresholds: {
    'http_req_duration{name:cart}': ['p(95)<200'],
    'http_req_duration{name:pay}':  ['p(95)<200'],
    'pay_pofod': ['rate<0.08'],
  },
};
export function cart() {
  http.post('http://localhost:3000/cart/add', null, { tags: { name: 'cart' } });
}
export function pay() {
  const r = http.post('http://localhost:3000/pay', null, { tags: { name: 'pay' } });
  pofod.add(r.status !== 200);
}
