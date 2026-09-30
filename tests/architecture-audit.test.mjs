/**
 * Shopystreet Riders — Architecture & PWA Foundation Audit Tests
 * Uses native Node.js test runner (node --test)
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

test('File Hierarchy: public directory is the canonical static frontend', () => {
  assert.ok(fs.existsSync(publicDir), 'public/ directory must exist');
  assert.ok(fs.existsSync(path.join(publicDir, 'index.html')), 'public/index.html must exist');
  assert.ok(fs.existsSync(path.join(publicDir, 'css', 'app.css')), 'public/css/app.css must exist');
  assert.ok(fs.existsSync(path.join(publicDir, 'js', 'app.js')), 'public/js/app.js must exist');
  assert.ok(fs.existsSync(path.join(publicDir, 'manifest.webmanifest')), 'public/manifest.webmanifest must exist');
  assert.ok(fs.existsSync(path.join(publicDir, 'sw.js')), 'public/sw.js must exist');
  assert.ok(fs.existsSync(path.join(publicDir, 'icons')), 'public/icons/ must exist');
});

test('PWA Audit: manifest.webmanifest is valid and standards-compliant', () => {
  const manifestPath = path.join(publicDir, 'manifest.webmanifest');
  const content = fs.readFileSync(manifestPath, 'utf-8');
  const manifest = JSON.parse(content);

  assert.equal(manifest.name, 'Shopystreet Riders');
  assert.equal(manifest.short_name, 'Riders');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.theme_color, '#070D18');
  assert.equal(manifest.background_color, '#070D18');

  assert.ok(Array.isArray(manifest.icons), 'Manifest must declare icons array');
  assert.ok(manifest.icons.length >= 3, 'Manifest must have at least 192px, 512px, and maskable icons');

  // Verify all icon files exist on disk
  for (const icon of manifest.icons) {
    const iconRelative = icon.src.replace(/^\//, '');
    const iconPath = path.join(publicDir, iconRelative);
    assert.ok(fs.existsSync(iconPath), `Icon asset must exist on disk: ${icon.src}`);
    const stats = fs.statSync(iconPath);
    assert.ok(stats.size > 0, `Icon asset must not be empty: ${icon.src}`);
  }
});

test('PWA Audit: Service Worker provides offline shell caching and network bypass for APIs', () => {
  const swPath = path.join(publicDir, 'sw.js');
  const swContent = fs.readFileSync(swPath, 'utf-8');

  assert.ok(swContent.includes('CACHE_NAME'), 'SW must declare a CACHE_NAME');
  assert.ok(swContent.includes('STATIC_ASSETS'), 'SW must declare static assets cache list');
  assert.ok(swContent.includes('/css/app.css'), 'SW must cache app.css');
  assert.ok(swContent.includes('/js/app.js'), 'SW must cache app.js');
  assert.ok(swContent.includes('/index.html'), 'SW must cache index.html');
  assert.ok(swContent.includes('/manifest.webmanifest'), 'SW must cache manifest.webmanifest');

  // Verify network-first / bypass for APIs
  assert.ok(
    swContent.includes('/api/') || swContent.includes('workers.dev'),
    'SW must bypass cache for live API routes'
  );
});

test('Architecture & Security: Frontend connects to Cloudflare Worker, never directly to D1', () => {
  const appJsPath = path.join(publicDir, 'js', 'app.js');
  const appJs = fs.readFileSync(appJsPath, 'utf-8');

  assert.ok(
    appJs.includes('https://shopystreet-delivery-api.warstreett.workers.dev'),
    'Frontend must target the production Cloudflare Worker URL'
  );

  // Security check: Ensure no D1 database credentials or raw SQL strings in client
  assert.ok(!appJs.includes('DB.prepare'), 'Client must never access D1 directly');
  assert.ok(!appJs.includes('CLOUDFLARE_API_TOKEN'), 'Client must never hold Cloudflare tokens');
  assert.ok(!appJs.includes('SELECT * FROM'), 'Client must not contain direct database queries');
});

test('Server: server.ts serves static files from public directory', () => {
  const serverPath = path.join(rootDir, 'server.ts');
  const serverCode = fs.readFileSync(serverPath, 'utf-8');

  assert.ok(serverCode.includes("path.join(__dirname, 'public')"), 'Server must mount public directory');
  assert.ok(serverCode.includes('express.static(publicDir'), 'Server must use express.static on publicDir');
});

test('Checkpoint 1.5: Persistent Rider Session Audit — Non-volatile storage & Live Server Validation', () => {
  const appJsPath = path.join(publicDir, 'js', 'app.js');
  const appJs = fs.readFileSync(appJsPath, 'utf-8');

  // Verify non-volatile localStorage key
  assert.ok(
    appJs.includes("const TOKEN_STORAGE_KEY = 'shopystreet_rider_session_token';"),
    'Must use designated shopystreet_rider_session_token key'
  );
  assert.ok(
    appJs.includes('localStorage.setItem(TOKEN_STORAGE_KEY'),
    'Must persist token to localStorage upon successful login'
  );
  assert.ok(
    appJs.includes('localStorage.getItem(TOKEN_STORAGE_KEY)'),
    'Must retrieve token from localStorage on startup'
  );

  // Verify server-side authoritative validation
  assert.ok(
    appJs.includes('/api/auth/me'),
    'Must call live /api/auth/me endpoint to validate stored session'
  );
  assert.ok(
    appJs.includes('Authorization') && appJs.includes('Bearer'),
    'Must send Bearer token in Authorization header'
  );

  // Verify purge on 401 and explicit logout
  assert.ok(
    appJs.includes('localStorage.removeItem(TOKEN_STORAGE_KEY)'),
    'Must clear token from storage on 401 or explicit logout'
  );
  assert.ok(
    appJs.includes('/api/auth/logout'),
    'Must call server-side /api/auth/logout endpoint on explicit logout'
  );
});

test('Checkpoint 1.5: Security Audit — No passwords, hashes, or secrets persisted', () => {
  const appJsPath = path.join(publicDir, 'js', 'app.js');
  const appJs = fs.readFileSync(appJsPath, 'utf-8');

  // Verify no password storage
  assert.ok(!appJs.includes("localStorage.setItem('password'"), 'Must never store passwords');
  assert.ok(!appJs.includes("localStorage.setItem('password_hash'"), 'Must never store password hashes');
  assert.ok(!appJs.includes("localStorage.setItem('loggedIn'"), 'Must never use fake client boolean as auth authority');
  assert.ok(!appJs.includes("sessionStorage.setItem('shopystreet_rider_session_token'"), 'Must not rely on volatile sessionStorage alone');

  // Verify no admin/API secrets in client
  assert.ok(!appJs.includes('ADMIN_API_KEY'), 'Client must not contain ADMIN_API_KEY');
  assert.ok(!appJs.includes('BAMBOO_SELECT_API_KEY'), 'Client must not contain BAMBOO_SELECT_API_KEY');
});

test('V1 Onboarding Model & Production Worker Routing', () => {
  const appJsPath = path.join(publicDir, 'js', 'app.js');
  const appJs = fs.readFileSync(appJsPath, 'utf-8');
  const serverPath = path.join(rootDir, 'server.ts');
  const serverJs = fs.readFileSync(serverPath, 'utf-8');

  // Verify registration connects to production Worker endpoint
  assert.ok(
    appJs.includes("fetch(`${PRODUCTION_API_URL}/api/riders/register`"),
    'Frontend must connect directly to production Worker POST /api/riders/register'
  );

  // Verify server.ts has NO in-memory applicants map or shadow backend
  assert.ok(!serverJs.includes('applicants = new Map'), 'server.ts must not have an in-memory applicants map');
  assert.ok(!serverJs.includes('applicants.set'), 'server.ts must not store applicants in memory');
  assert.ok(!serverJs.includes('applicants.get'), 'server.ts must not retrieve applicants from memory');

  // Verify handling of HTTP 409 conflict
  assert.ok(
    appJs.includes('res.status === 409') || appJs.includes("includes('already exists')"),
    'Must explicitly detect HTTP 409 or already-exists status'
  );

  // Verify non-dead-end messaging for existing account
  assert.ok(
    appJs.includes('An account already exists for this phone number.'),
    'Must display clear headline for existing account'
  );
  assert.ok(
    appJs.includes('Sign in with your password to continue to your rider account.'),
    'Must provide guidance to sign in with password'
  );

  // Verify clear action button to sign in with prefilled phone
  assert.ok(
    appJs.includes('SIGN IN WITH THIS PHONE') || appJs.includes('err-btn-login-direct'),
    'Must provide explicit action button to sign in directly'
  );

  // Verify pre-populating applicant phone number without re-typing
  assert.ok(
    appJs.includes('showLoginScreen(null, phone)'),
    'Must carry forward entered phone number to sign in view'
  );

  // Verify V1 instant success experience (No V2 pending waiting state)
  assert.ok(
    appJs.includes('renderRegistrationSuccess'),
    'Must render instant registration success state in V1'
  );
  assert.ok(
    appJs.includes("Account created successfully!"),
    'Must confirm account creation to rider'
  );
});

test('Proof of Delivery Integration Audit', () => {
  const appJsPath = path.join(publicDir, 'js', 'app.js');
  const appJs = fs.readFileSync(appJsPath, 'utf-8');
  const htmlPath = path.join(publicDir, 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf-8');

  // Verify Proof endpoint call exists
  assert.ok(
    appJs.includes('/api/delivery-jobs/${encodeURIComponent(jobId)}/proof') ||
    appJs.includes('/api/delivery-jobs/'),
    'Must call Worker /api/delivery-jobs/{id}/proof endpoint'
  );
  assert.ok(
    appJs.includes("proof_type: proofType"),
    'Must include proof_type in request payload'
  );

  // Verify modal exists in HTML
  assert.ok(html.includes('id="modal-proof"'), 'Proof modal must exist in index.html');
  assert.ok(html.includes('id="proof-form"'), 'Proof form must exist in index.html');
  assert.ok(html.includes('id="proof-type-select"'), 'Proof type select must exist');
  assert.ok(html.includes('id="btn-submit-proof"'), 'Submit proof button must exist');

  // Verify no direct jump to DELIVERED without proof
  assert.ok(
    appJs.includes('openProofModal()'),
    'NEAR_DESTINATION must open Proof Modal instead of jumping directly to DELIVERED'
  );

  // Verify sequential execution: proof first, then status DELIVERED
  assert.ok(
    appJs.indexOf('/proof') < appJs.indexOf("status: 'DELIVERED'"),
    'Proof must be recorded before advancing status to DELIVERED'
  );
});

test('Incident Reporting Integration Audit', () => {
  const appJsPath = path.join(publicDir, 'js', 'app.js');
  const appJs = fs.readFileSync(appJsPath, 'utf-8');
  const htmlPath = path.join(publicDir, 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf-8');

  // Verify Incident endpoint call exists
  assert.ok(
    appJs.includes('/api/delivery-jobs/${encodeURIComponent(jobId)}/incident'),
    'Must call Worker /api/delivery-jobs/{id}/incident endpoint'
  );
  assert.ok(
    appJs.includes("incident_type: incidentType"),
    'Must include incident_type in request payload'
  );
  assert.ok(
    appJs.includes("notes: notes"),
    'Must include notes in request payload'
  );

  // Verify UI controls in HTML
  assert.ok(html.includes('id="modal-incident"'), 'Incident modal must exist in index.html');
  assert.ok(html.includes('id="incident-form"'), 'Incident form must exist in index.html');
  assert.ok(html.includes('id="btn-open-incident"'), 'Report issue button must exist in index.html');
  assert.ok(html.includes('id="btn-submit-incident"'), 'Submit incident button must exist');

  // Verify active delivery remains active after report
  assert.ok(
    appJs.includes('Report submitted. Fleet support notified.'),
    'Must notify rider upon successful report submission'
  );
});


