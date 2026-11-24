import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from './app.js';
import { resetSecurityState } from './security.js';

function extractCookie(headers: Record<string, unknown>): string {
  const raw = headers['set-cookie'];
  const first = Array.isArray(raw) ? raw[0] : raw;
  assert.ok(typeof first === 'string' && first.includes('kc_session='), 'Expected kc_session cookie');
  return first.split(';')[0];
}

async function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kingscare-sec-'));
  const dbPath = path.join(tmpDir, 'test-kingscare.db');
  const uploadsDir = path.join(tmpDir, 'uploads');

  resetSecurityState();
  const prevDisableDemo = process.env.DISABLE_DEMO_ENDPOINTS;
  delete process.env.DISABLE_DEMO_ENDPOINTS;

  const { app, db } = createApp({ dbPath, uploadsDir });

  async function loginAs(email: string, password: string): Promise<string> {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password },
    });
    assert.equal(res.statusCode, 200, `Login failed for ${email}: ${res.body}`);
    return extractCookie(res.headers);
  }

  try {
    // Seed initial clinic sample data
    const seedRes = await app.inject({ method: 'POST', url: '/api/system/seed' });
    assert.equal(seedRes.statusCode, 200);

    const adminCookie = await loginAs('admin@kingscarehospital.ng', 'Kingscare@2026');
    const fdCookie = await loginAs('reception@kingscarehospital.ng', 'Kingscare@2026');
    const docCookie = await loginAs('b.fashola@kingscarehospital.ng', 'Kingscare@2026');
    const nimasaCookie = await loginAs('medical.liaison@nimasa.gov.ng', 'Kingscare@2026');

    // Provision Eye Clinic & ENT & Audiology accounts + ENT equipment
    const createEye = await app.inject({
      method: 'POST',
      url: '/api/users',
      headers: { cookie: adminCookie },
      payload: {
        fullName: 'OD. Tunde Bakare',
        email: 'eye@kingscarehospital.ng',
        password: 'EyeClinic#2026',
        portalRole: 'EYE',
        roleTitle: 'Clinical Optometrist / Vision Technician',
        department: 'Ophthalmology & Colour Vision Clinic',
        licenseNo: 'ODORBN-55210',
      },
    });
    assert.equal(createEye.statusCode, 200);

    const createEnt = await app.inject({
      method: 'POST',
      url: '/api/users',
      headers: { cookie: adminCookie },
      payload: {
        fullName: 'RN. Amina Mohammed',
        email: 'ent@kingscarehospital.ng',
        password: 'EntClinic#2026',
        portalRole: 'ENT',
        roleTitle: 'Audiology Technician / ENT Officer',
        department: 'ENT & Audiology Unit',
        licenseNo: 'NMCN-AUD-18409',
      },
    });
    assert.equal(createEnt.statusCode, 200);

    const eyeCookie = await loginAs('eye@kingscarehospital.ng', 'EyeClinic#2026');
    const entCookie = await loginAs('ent@kingscarehospital.ng', 'EntClinic#2026');

    const createEntEq = await app.inject({
      method: 'POST',
      url: '/api/departments/ent/equipment',
      headers: { cookie: entCookie },
      payload: {
        name: 'Pure-Tone Audiometer',
        manufacturer: 'Interacoustics',
        model: 'AD226',
        yearOfMake: 2024,
        serialNo: 'AUD-SEC-001',
        status: 'Operational',
      },
    });
    assert.equal(createEntEq.statusCode, 200);
    const entEqId = (createEntEq.json() as { id: string }).id;

    // Create isolated test patients via API
    const pEyeRes = await app.inject({
      method: 'POST',
      url: '/api/patients',
      headers: { cookie: fdCookie },
      payload: {
        fullName: 'Eye Target Seafarer',
        dob: '1990-05-14',
        gender: 'Male',
        phone: '+2348011112222',
        nimasaMember: true,
        consentToShareWithNimasa: true,
        category: 'Deck (Master / Officer / Lookout)',
      },
    });
    assert.equal(pEyeRes.statusCode, 200);
    const pEyeId = (pEyeRes.json() as { patient: { id: string } }).patient.id;

    const pEntOnlyRes = await app.inject({
      method: 'POST',
      url: '/api/patients',
      headers: { cookie: fdCookie },
      payload: {
        fullName: 'ENT Only NonConsented Seafarer',
        dob: '1992-07-20',
        gender: 'Female',
        phone: '+2348033334444',
        nimasaMember: true,
        consentToShareWithNimasa: false,
        category: 'Engine / Electro-Technical',
      },
    });
    assert.equal(pEntOnlyRes.statusCode, 200);
    const pEntId = (pEntOnlyRes.json() as { patient: { id: string } }).patient.id;

    // Doctor adds confidential notes, medication, determination, and orders Eye vs ENT tests
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: `/api/patients/${pEyeId}/first-assessment`,
          headers: { cookie: docCookie },
          payload: {
            shortSummary: 'Initial review logged',
            fullClinicalNote: 'CONFIDENTIAL_DOCTOR_DIAGNOSIS_EYEPATIENT',
          },
        })
      ).statusCode,
      200
    );

    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: `/api/patients/${pEyeId}/medications`,
          headers: { cookie: docCookie },
          payload: {
            name: 'Confidential Rx',
            dosage: '10 mg',
            frequency: 'OD',
            duration: '5 days',
          },
        })
      ).statusCode,
      200
    );

    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: `/api/patients/${pEyeId}/determination`,
          headers: { cookie: docCookie },
          payload: {
            determination: 'Fit with limitation',
            basis: 'CONFIDENTIAL_RMP_DETERMINATION_BASIS',
            limitationText: 'Corrective lenses required on watch',
          },
        })
      ).statusCode,
      200
    );

    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: `/api/patients/${pEyeId}/orders`,
          headers: { cookie: docCookie },
          payload: {
            tests: [
              {
                category: 'Vision',
                testName: 'Snellen Visual Acuity & Ishihara',
                department: 'Eye Clinic',
                clinicalInstruction: 'Verify unaided and aided decimal acuity.',
              },
            ],
          },
        })
      ).statusCode,
      200
    );

    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: `/api/patients/${pEntId}/orders`,
          headers: { cookie: docCookie },
          payload: {
            tests: [
              {
                category: 'Audiology',
                testName: 'Pure-Tone Unaided Audiometry',
                department: 'ENT & Audiology',
                clinicalInstruction: 'Measure 500-3000 Hz thresholds.',
              },
            ],
          },
        })
      ).statusCode,
      200
    );

    const docBoot = (
      await app.inject({ method: 'GET', url: '/api/bootstrap', headers: { cookie: docCookie } })
    ).json() as {
      patients: Array<{ id: string; orders: Array<{ id: string; department: string }> }>;
    };
    const eyeOrderId = docBoot.patients
      .find((p) => p.id === pEyeId)!
      .orders.find((o) => o.department === 'Eye Clinic')!.id;
    const entOrderId = docBoot.patients
      .find((p) => p.id === pEntId)!
      .orders.find((o) => o.department === 'ENT & Audiology')!.id;

    // -----------------------------------------------------------------------
    // 1. Unauthenticated requests blocked (401)
    // -----------------------------------------------------------------------
    for (const [method, url] of [
      ['GET', '/api/bootstrap'],
      ['POST', '/api/patients'],
      ['POST', '/api/users'],
      ['GET', `/api/orders/${eyeOrderId}/attachment`],
    ] as const) {
      const r = await app.inject({ method, url });
      assert.equal(r.statusCode, 401, `Expected 401 on unauthenticated ${method} ${url}`);
    }
    console.log('1. Unauthenticated access blocked (401) -> PASS');

    // -----------------------------------------------------------------------
    // 2. SQL injection payloads safely rejected / no bypass
    // -----------------------------------------------------------------------
    const sqliLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: "' OR 1=1 --", password: 'x' },
    });
    assert.ok(sqliLogin.statusCode === 400 || sqliLogin.statusCode === 401);
    assert.equal(sqliLogin.headers['set-cookie'], undefined);

    const sqliVerify = await app.inject({
      method: 'POST',
      url: '/api/verifications',
      headers: { cookie: nimasaCookie },
      payload: { certificateNo: "' OR 1=1 --", enquirer: 'PSC' },
    });
    assert.equal(sqliVerify.statusCode, 200);
    assert.equal((sqliVerify.json() as { enquiry: { result: string } }).enquiry.result, 'No record');
    console.log('2. SQL injection payloads rejected/neutralized -> PASS');

    // -----------------------------------------------------------------------
    // 3. Role-scoped /api/bootstrap redaction
    // -----------------------------------------------------------------------
    const fdBoot = (
      await app.inject({ method: 'GET', url: '/api/bootstrap', headers: { cookie: fdCookie } })
    ).json() as Record<string, any>;
    assert.deepEqual(fdBoot.users, []);
    assert.deepEqual(fdBoot.certificateStock, []);
    const fdEyePatient = fdBoot.patients.find((p: any) => p.id === pEyeId);
    assert.ok(fdEyePatient);
    assert.deepEqual(fdEyePatient.orders, []);
    assert.equal(fdEyePatient.firstAssessmentFullNote, undefined);
    assert.deepEqual(fdEyePatient.medications, []);
    assert.equal(fdEyePatient.rmp.determinationBasis, undefined);
    assert.equal(fdEyePatient.rmp.visionHearing.distanceAided.right, '—');

    const eyeBoot = (
      await app.inject({ method: 'GET', url: '/api/bootstrap', headers: { cookie: eyeCookie } })
    ).json() as Record<string, any>;
    assert.deepEqual(eyeBoot.users, []);
    assert.deepEqual(eyeBoot.certificateStock, []);
    assert.equal(eyeBoot.departments.length, 1);
    assert.equal(eyeBoot.departments[0].id, 'eye');
    assert.ok(eyeBoot.patients.some((p: any) => p.id === pEyeId));
    assert.ok(!eyeBoot.patients.some((p: any) => p.id === pEntId));
    const eyeScopedPatient = eyeBoot.patients.find((p: any) => p.id === pEyeId);
    assert.ok(eyeScopedPatient.orders.every((o: any) => o.department === 'Eye Clinic'));
    assert.equal(eyeScopedPatient.rmp.visionHearing.audiometryRight.hz500, 0);
    assert.equal(eyeScopedPatient.firstAssessmentFullNote, undefined);

    const nimasaBoot = (
      await app.inject({ method: 'GET', url: '/api/bootstrap', headers: { cookie: nimasaCookie } })
    ).json() as Record<string, any>;
    assert.deepEqual(nimasaBoot.users, []);
    assert.ok(!nimasaBoot.patients.some((p: any) => p.id === pEntId));
    const nimasaPatient = nimasaBoot.patients.find((p: any) => p.id === pEyeId);
    assert.ok(nimasaPatient);
    assert.equal(nimasaPatient.firstAssessmentFullNote, undefined);
    assert.equal(nimasaPatient.rmp.visionHearing.audiometryRight.hz500, 0);
    assert.equal(nimasaPatient.rmp.visionHearing.distanceAided.right, '—');

    const nimasaAttachRes = await app.inject({
      method: 'GET',
      url: `/api/orders/${eyeOrderId}/attachment`,
      headers: { cookie: nimasaCookie },
    });
    assert.equal(nimasaAttachRes.statusCode, 403);
    console.log('3. Role-scoped /api/bootstrap & QA-P-808 redaction -> PASS');

    // -----------------------------------------------------------------------
    // 4. Cross-department & cross-role IDOR blocked (403)
    // -----------------------------------------------------------------------
    assert.equal(
      (
        await app.inject({
          method: 'PATCH',
          url: `/api/orders/${entOrderId}/draft`,
          headers: { cookie: eyeCookie },
          payload: { draftFindings: 'Cross-dept test' },
        })
      ).statusCode,
      403
    );
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: `/api/orders/${entOrderId}/publish`,
          headers: { cookie: eyeCookie },
          payload: { publishedResult: 'Cross-dept publish' },
        })
      ).statusCode,
      403
    );
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: `/api/orders/${entOrderId}/attachment`,
          headers: { cookie: eyeCookie },
          payload: {
            fileName: 'report.pdf',
            mimeType: 'application/pdf',
            dataBase64: Buffer.from('%PDF-1.4\n%test').toString('base64'),
          },
        })
      ).statusCode,
      403
    );
    assert.equal(
      (
        await app.inject({
          method: 'GET',
          url: `/api/orders/${entOrderId}/attachment`,
          headers: { cookie: eyeCookie },
        })
      ).statusCode,
      403
    );
    assert.equal(
      (
        await app.inject({
          method: 'PATCH',
          url: `/api/equipment/${entEqId}/daily-check`,
          headers: { cookie: eyeCookie },
        })
      ).statusCode,
      403
    );
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: '/api/verifications',
          headers: { cookie: eyeCookie },
          payload: { certificateNo: 'NIM-MC-2026-0401' },
        })
      ).statusCode,
      403
    );
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: '/api/users',
          headers: { cookie: docCookie },
          payload: {
            fullName: 'Unauthorized User',
            email: 'unauth@kingscarehospital.ng',
            password: 'StrongPass#2026',
            portalRole: 'ADMIN',
            roleTitle: 'Fake',
            department: 'None',
          },
        })
      ).statusCode,
      403
    );
    console.log('4. Cross-department & cross-role IDOR blocked (403) -> PASS');

    // -----------------------------------------------------------------------
    // 5. File upload spoofing blocked (400) & safe download headers verified
    // -----------------------------------------------------------------------
    const spoofedImg = Buffer.from('<script>alert(1)</script>', 'utf8').toString('base64');
    const spoofPngRes = await app.inject({
      method: 'POST',
      url: `/api/orders/${eyeOrderId}/attachment`,
      headers: { cookie: eyeCookie },
      payload: {
        fileName: 'evil.png',
        mimeType: 'image/png',
        dataBase64: spoofedImg,
      },
    });
    assert.equal(spoofPngRes.statusCode, 400);

    const spoofPdfRes = await app.inject({
      method: 'POST',
      url: `/api/orders/${eyeOrderId}/attachment`,
      headers: { cookie: eyeCookie },
      payload: {
        fileName: 'evil.pdf',
        mimeType: 'application/pdf',
        dataBase64: spoofedImg,
      },
    });
    assert.equal(spoofPdfRes.statusCode, 400);

    const validPdfRes = await app.inject({
      method: 'POST',
      url: `/api/orders/${eyeOrderId}/attachment`,
      headers: { cookie: eyeCookie },
      payload: {
        fileName: 'snellen-scan.pdf',
        mimeType: 'application/pdf',
        dataBase64: Buffer.from('%PDF-1.4\n%test', 'utf8').toString('base64'),
      },
    });
    assert.equal(validPdfRes.statusCode, 200);

    const dlRes = await app.inject({
      method: 'GET',
      url: `/api/orders/${eyeOrderId}/attachment`,
      headers: { cookie: eyeCookie },
    });
    assert.equal(dlRes.statusCode, 200);
    assert.equal(dlRes.headers['x-content-type-options'], 'nosniff');
    assert.ok(String(dlRes.headers['cache-control'] || '').includes('no-store'));
    console.log('5. Upload magic-byte verification & secure download headers -> PASS');

    // -----------------------------------------------------------------------
    // 6. Strict Zod validation rejects malformed bodies (400)
    // -----------------------------------------------------------------------
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: `/api/patients/${pEyeId}/determination`,
          headers: { cookie: docCookie },
          payload: { determination: 'NotARealStatus', basis: '' },
        })
      ).statusCode,
      400
    );
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: `/api/orders/${eyeOrderId}/publish`,
          headers: { cookie: eyeCookie },
          payload: {
            audiometry: {
              audiometryRight: { hz500: 999, hz1000: 15, hz2000: 20, hz3000: 20 },
              audiometryLeft: { hz500: 15, hz1000: 15, hz2000: 20, hz3000: 20 },
              speechClear: true,
            },
          },
        })
      ).statusCode,
      400
    );
    assert.equal(
      (
        await app.inject({
          method: 'PUT',
          url: `/api/patients/${pEyeId}/vision-hearing`,
          headers: { cookie: docCookie },
          payload: { distanceUnaided: 'bad' },
        })
      ).statusCode,
      400
    );
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: `/api/patients/${pEyeId}/medications`,
          headers: { cookie: docCookie },
          payload: { name: '', dosage: '', frequency: '', duration: '' },
        })
      ).statusCode,
      400
    );
    console.log('6. Strict Zod payload validation -> PASS');

    // -----------------------------------------------------------------------
    // 7. Cross-origin CSRF blocked (403)
    // -----------------------------------------------------------------------
    const badOriginRes = await app.inject({
      method: 'POST',
      url: `/api/patients/${pEyeId}/medications`,
      headers: {
        cookie: docCookie,
        host: 'portal.kingscarehospitals.com',
        origin: 'https://evil.example.com',
      },
      payload: { name: 'A', dosage: '1', frequency: 'OD', duration: '1d' },
    });
    assert.equal(badOriginRes.statusCode, 403);

    const crossSiteRes = await app.inject({
      method: 'POST',
      url: `/api/patients/${pEyeId}/medications`,
      headers: {
        cookie: docCookie,
        'sec-fetch-site': 'cross-site',
      },
      payload: { name: 'A', dosage: '1', frequency: 'OD', duration: '1d' },
    });
    assert.equal(crossSiteRes.statusCode, 403);
    console.log('7. Cross-origin & cross-site CSRF blocked (403) -> PASS');

    // -----------------------------------------------------------------------
    // 8. Security headers present & /api/health hides dbPath
    // -----------------------------------------------------------------------
    const healthRes = await app.inject({ method: 'GET', url: '/api/health' });
    assert.equal(healthRes.statusCode, 200);
    assert.deepEqual(healthRes.json(), { status: 'ok' });
    assert.equal(healthRes.headers['x-content-type-options'], 'nosniff');
    assert.equal(healthRes.headers['x-frame-options'], 'DENY');
    assert.equal(healthRes.headers['referrer-policy'], 'strict-origin-when-cross-origin');
    console.log('8. Security headers & /api/health non-disclosure -> PASS');

    // -----------------------------------------------------------------------
    // 9. Brute-force login lockout (5 failures -> 6th returns 429)
    // -----------------------------------------------------------------------
    resetSecurityState();
    for (let i = 1; i <= 4; i++) {
      const failRes = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: 'ent@kingscarehospital.ng', password: `WrongPass#${i}` },
      });
      assert.equal(failRes.statusCode, 401, `Expected 401 on attempt ${i}`);
    }
    const lockTriggerRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'ent@kingscarehospital.ng', password: 'WrongPass#5' },
    });
    assert.equal(lockTriggerRes.statusCode, 429);
    assert.ok(lockTriggerRes.headers['retry-after']);

    const lockedAttemptRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'ent@kingscarehospital.ng', password: 'EntClinic#2026' },
    });
    assert.equal(lockedAttemptRes.statusCode, 429);
    assert.ok(lockedAttemptRes.headers['retry-after']);
    console.log('9. Brute-force login lockout (429 + Retry-After) -> PASS');

    // -----------------------------------------------------------------------
    // 10. Self-service password change invalidates parallel session
    // -----------------------------------------------------------------------
    resetSecurityState();
    const eyeParallelCookie = await loginAs('eye@kingscarehospital.ng', 'EyeClinic#2026');
    const eyeSessionTwoCookie = await loginAs('eye@kingscarehospital.ng', 'EyeClinic#2026');

    const chPwRes = await app.inject({
      method: 'POST',
      url: '/api/auth/change-password',
      headers: { cookie: eyeSessionTwoCookie },
      payload: {
        currentPassword: 'EyeClinic#2026',
        newPassword: 'EyeClinic#2027',
      },
    });
    assert.equal(chPwRes.statusCode, 200);
    const updatedEyeCookie = extractCookie(chPwRes.headers);

    const staleMe = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: eyeParallelCookie },
    });
    assert.equal(staleMe.statusCode, 401);

    const activeMe = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: updatedEyeCookie },
    });
    assert.equal(activeMe.statusCode, 200);

    await loginAs('eye@kingscarehospital.ng', 'EyeClinic#2027');
    console.log('10. Self-service password change & session invalidation -> PASS');

    // -----------------------------------------------------------------------
    // 11. Demo endpoint production lock
    // -----------------------------------------------------------------------
    process.env.DISABLE_DEMO_ENDPOINTS = 'true';
    const prodResetRes = await app.inject({
      method: 'POST',
      url: '/api/system/reset',
      headers: { cookie: adminCookie },
    });
    assert.equal(prodResetRes.statusCode, 403);

    const prodSeedRes = await app.inject({
      method: 'POST',
      url: '/api/system/seed',
      headers: { cookie: adminCookie },
    });
    assert.equal(prodSeedRes.statusCode, 403);
    console.log('11. Production demo endpoint lock (/system/reset & /system/seed) -> PASS');

    console.log('\nAll 11 security regression checks passed.');
  } finally {
    if (prevDisableDemo === undefined) {
      delete process.env.DISABLE_DEMO_ENDPOINTS;
    } else {
      process.env.DISABLE_DEMO_ENDPOINTS = prevDisableDemo;
    }
    await app.close();
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error('[Security Test Failed]', err);
  process.exit(1);
});
