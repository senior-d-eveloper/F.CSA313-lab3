// Алхам 6 — ЗОРИУД FAIL болгосон хувилбар (CI-г зогсоох exit code үзүүлэх).
// Зөвхөн /report-ын босго өөр: 450мс → 100мс. Бусад нь slo-test.js-тэй ижил.

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 20,
    duration: '1m',
    thresholds: {
        // Performance SLO — localhost дээр хэмжсэн p95 = 2.56мс тул
        // 200мс бус 10мс. Сул босго юу ч хэмжихгүй.
        'http_req_duration{name:cart}': ['p(95)<10'],

        // Reliability SLO — серверт суулгасан 5% алдаан дээр нөөц.
        // 1 минутын цонхонд ~900 дээж тул хэлбэлзэл ±1.4%: 6% нь
        // 8% магадлалаар хуурамч унах тул 7% сонгов.
        'http_req_failed{name:pay}': ['rate<0.07'],

        // Availability SLO — бүх шалгалтын амжилтын хувь (ХҮСЭЛТЭЭР).
        'checks': ['rate>0.90'],

        // 4 дэх нэмэлт сценарио — удаан тайлангийн endpoint.
        // АЛХАМ 6 — ЗОРИУД ЭВДСЭН: сервер 200мс-ээс хурдан хэзээ ч хариулдаггүй
        // тул 100мс босго ямар ч машин дээр найдвартай FAIL болно.
        'http_req_duration{name:report}': ['p(95)<100'],
    },
};

export default function () {
    const base = 'http://localhost:3000';

    const c = http.post(`${base}/cart/add`, null, { tags: { name: 'cart' } });
    const r = http.get(`${base}/report`, { tags: { name: 'report' } });
    const p = http.post(`${base}/pay`, null, { tags: { name: 'pay' } });

    check(c, { 'cart 200': (x) => x.status === 200 });
    check(r, { 'report 200': (x) => x.status === 200 });
    check(p, { 'pay 200': (x) => x.status === 200 });

    sleep(1);
}
