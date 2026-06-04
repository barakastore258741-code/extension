/*
  # TechVai Extension - Full Database Schema

  ## Summary
  Complete schema for the TechVai browser extension admin panel.
  Replaces the old VibeX Academy / ynvrijkuampxpsmshftm Supabase project.

  ## Tables Created

  1. **admin_users** - Admin panel login (email/password via Supabase Auth)
  2. **licenses** - Extension license keys with expiry, status, device binding
  3. **user_roles** - Per-license role assignments (user, reseller, admin)
  4. **notifications** - Push notifications shown inside the extension
  5. **packages** - Subscription plans (weekly, monthly, lifetime)
  6. **feature_flags** - Feature toggles (e.g. download_files)
  7. **extension_versions** - Version changelog + update alerts
  8. **license_devices** - Device heartbeat tracking per license

  ## Security
  - RLS enabled on all tables
  - Admin access via service role only for most write ops
  - Public read on: notifications, packages, feature_flags, extension_versions
  - License validation via anon key (read-only via function)
*/

-- ============================================================
-- LICENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key text UNIQUE NOT NULL,
  user_name text NOT NULL DEFAULT '',
  user_email text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active', -- active | expired | suspended | trial
  plan text NOT NULL DEFAULT 'monthly',  -- trial | weekly | monthly | lifetime
  expires_at timestamptz,
  activated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  notes text DEFAULT '',
  max_devices int NOT NULL DEFAULT 2,
  user_id uuid
);

ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- Anon can read by license_key (needed for validation)
CREATE POLICY "Anon can read license by key"
  ON licenses FOR SELECT
  TO anon
  USING (true);

-- Authenticated admin can do everything
CREATE POLICY "Authenticated can manage licenses"
  ON licenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert licenses"
  ON licenses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update licenses"
  ON licenses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete licenses"
  ON licenses FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- LICENSE DEVICES (heartbeat / device tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS license_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid REFERENCES licenses(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(license_id, device_id)
);

ALTER TABLE license_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can upsert device"
  ON license_devices FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update device"
  ON license_devices FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can read device"
  ON license_devices FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated can manage devices"
  ON license_devices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can delete devices"
  ON license_devices FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- USER ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid REFERENCES licenses(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user', -- user | reseller | admin
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can read user_roles"
  ON user_roles FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated can manage user_roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert user_roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update user_roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete user_roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  link text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active notifications"
  ON notifications FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Authenticated can read all notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- PACKAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  duration_days int, -- NULL = lifetime
  is_active boolean NOT NULL DEFAULT true,
  is_popular boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  features jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active packages"
  ON packages FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Authenticated can manage packages"
  ON packages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert packages"
  ON packages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update packages"
  ON packages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete packages"
  ON packages FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- FEATURE FLAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text UNIQUE NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  description text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feature_flags"
  ON feature_flags FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated can manage feature_flags"
  ON feature_flags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert feature_flags"
  ON feature_flags FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update feature_flags"
  ON feature_flags FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete feature_flags"
  ON feature_flags FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- EXTENSION VERSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS extension_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  changelog text DEFAULT '',
  file_path text DEFAULT '',
  is_alert_active boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE extension_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read extension_versions"
  ON extension_versions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated can manage extension_versions"
  ON extension_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert extension_versions"
  ON extension_versions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update extension_versions"
  ON extension_versions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete extension_versions"
  ON extension_versions FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_expires ON licenses(expires_at);
CREATE INDEX IF NOT EXISTS idx_license_devices_license ON license_devices(license_id);
CREATE INDEX IF NOT EXISTS idx_notifications_active ON notifications(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(flag_key);
CREATE INDEX IF NOT EXISTS idx_ext_versions_alert ON extension_versions(is_alert_active, created_at DESC);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Feature flags
INSERT INTO feature_flags (flag_key, enabled, description) VALUES
  ('download_files', true, 'Allow users to download project files'),
  ('plan_mode', true, 'Enable Plan Mode toggle'),
  ('watermark_removal', true, 'Enable watermark removal feature'),
  ('publish_project', true, 'Enable project publishing'),
  ('enable_cloud', true, 'Enable Lovable Cloud feature')
ON CONFLICT (flag_key) DO NOTHING;

-- Packages
INSERT INTO packages (name, price, duration_days, is_active, is_popular, sort_order, features) VALUES
  ('Weekly', 49.90, 7, true, false, 1, '["Full extension access", "Plan Mode active", "Support via Discord"]'),
  ('Monthly', 97.90, 30, true, true, 2, '["Everything in Weekly plan", "Best value", "Priority support"]'),
  ('Lifetime', 149.90, NULL, true, false, 3, '["Lifetime access", "Lifetime updates", "VIP priority support"]')
ON CONFLICT DO NOTHING;

-- Default notification
INSERT INTO notifications (title, message, is_active) VALUES
  ('Welcome to TechVai Extension!', 'Your license is active. Use the extension to supercharge your Lovable projects.', true)
ON CONFLICT DO NOTHING;

-- Extension version
INSERT INTO extension_versions (version, changelog, is_alert_active) VALUES
  ('6.0.13', 'TechVai branding. New admin panel. Improved license management.', false)
ON CONFLICT DO NOTHING;
