// Key-naming helpers for tenant-scoped storage.
//
// Centralized here so provision.js, tenant.js and state.js can't drift on the
// `tenant:<id>:...` key shape. Every piece of tenant data (operating profile, hub state)
// lives under one of these two prefixes; the owner_email -> tenant_id mapping itself is a
// separate flat key (`owner:<email>`) written by api/_lib/auth.js's
// get/setTenantForOwner helpers, not here, since it isn't tenant-prefixed.

'use strict';

function tenantProfileKey(tenantId) {
  return `tenant:${tenantId}:profile`;
}

function tenantStateKey(tenantId) {
  return `tenant:${tenantId}:state`;
}

module.exports = { tenantProfileKey, tenantStateKey };
