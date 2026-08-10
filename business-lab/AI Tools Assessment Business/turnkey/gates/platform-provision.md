# Gate — publish the platform

PROVISION_TOKEN is not in this environment, so the tenant was not registered. Run this yourself (you hold the token):

```bash
curl -X POST https://vom-client-hub.vercel.app/api/provision \
  -H 'Content-Type: application/json' \
  -H "x-provision-token: $PROVISION_TOKEN" \
  -d '{"tenant_id": "ai-tools-assessment-business", "owner_email": "kurtjjoseph@gmail.com", "operating_profile": {"business_name": "AI Tools Assessment Business", "org_type": "service_business", "org_label": "Service business / consultancy / agency", "platform_choice": "Custom app (Vercel)", "operator": "Vision Outreach Media", "generated": "2026-08-01T15:13:43Z", "platform_modules": ["crm", "content_publishing", "booking", "checkout_payments", "support_inbox", "email_marketing", "finance_admin", "documents_contracts", "lead_capture"]}}'
```
