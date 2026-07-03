# GCP Service Account Impersonation for Google Play Store

Upload Android builds to Google Play Store without storing service account private key files,
using GCP service account impersonation via Application Default Credentials (ADC).

## Overview

Instead of storing a `key.json` per client, each developer machine authenticates once with their
Google account. Fastlane then impersonates a service account via IAM — no private keys on disk.

```
Developer machine
  └── gcloud user credentials (~/.config/gcloud/application_default_credentials.json)
        └── impersonates → fastlane@edular-19fe4.iam.gserviceaccount.com  (SA1, ≤10 apps)
        └── impersonates → fastlane2@edular-19fe4.iam.gserviceaccount.com (SA2, next 10 apps)
```

Google Play Console limits one service account to **10 developer accounts**. Use multiple SAs to
cover more clients.

---

## Prerequisites

- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud` CLI)
- `python3` on PATH
- GCP project: `edular-19fe4`
- Your Google account: `klassapp2013@gmail.com`

---

## First-time Setup (new machine)

Run once per developer machine:

```bash
rnbuilder setup-gcp
```

Prompts with defaults — just press Enter:

```
Enter Google Cloud project ID [edular-19fe4]:
Enter your Google account email [klassapp2013@gmail.com]:
Enter service account email [fastlane@edular-19fe4.iam.gserviceaccount.com]:
Add another service account? (y/N):
```

This will:
1. Authenticate your Google account with gcloud
2. Create base ADC user credentials
3. Grant `roles/iam.serviceAccountTokenCreator` on the SA to your account
4. Generate `~/.config/gcloud/adc_fastlane.json` (impersonation ADC for SA1)

---

## Adding a New Service Account (when SA hits 10-app limit)

### 1. Create the SA in GCP Console

Go to: `https://console.cloud.google.com/iam-admin/serviceaccounts?project=edular-19fe4`

- Click **Create Service Account**
- Name: `fastlane2` → email: `fastlane2@edular-19fe4.iam.gserviceaccount.com`
- Skip role grants, click **Done**

### 2. Generate its ADC file

```bash
rnbuilder setup-gcp
# Press Enter for project + user email defaults
# SA prompt: fastlane2@edular-19fe4.iam.gserviceaccount.com
# "Add another service account?" → N
```

Output: `~/.config/gcloud/adc_fastlane2.json`

### 3. Add SA to Google Play Console

- Play Console → **Setup → API access**
- Find the new SA → **Manage Play Console permissions**
- Grant **Release Manager** for the relevant apps

### 4. Add to client `.env`

```env
GOOGLE_APPLICATION_CREDENTIALS=~/.config/gcloud/adc_fastlane2.json
```

---

## ADC File Naming Convention

The script derives the filename from the SA email prefix (part before `@`):

| Service Account Email                          | ADC File                          |
|------------------------------------------------|-----------------------------------|
| `fastlane@edular-19fe4.iam.gserviceaccount.com`  | `~/.config/gcloud/adc_fastlane.json`  |
| `fastlane2@edular-19fe4.iam.gserviceaccount.com` | `~/.config/gcloud/adc_fastlane2.json` |

---

## Client `.env` Configuration

Each client needs `GOOGLE_APPLICATION_CREDENTIALS` pointing to their SA's ADC file.
`JSON_KEY_FILE` must remain commented out.

```env
# Android specific
APP_IDENTIFIER_ANDROID=com.example.app
FLAVOR=MyApp
BUILD_TYPE=Release
# JSON_KEY_FILE=./key.json   ← keep commented out
GOOGLE_APPLICATION_CREDENTIALS=~/.config/gcloud/adc_fastlane.json
```

> `~` is expanded by the Fastfile's `before_all` hook — safe across machines regardless of username.

### Current SA → Client Mapping

| SA                                              | ADC File           | Clients                    |
|-------------------------------------------------|--------------------|----------------------------|
| `fastlane@edular-19fe4.iam.gserviceaccount.com`  | `adc_fastlane.json`  | tspa, aht, ...             |
| `fastlane2@edular-19fe4.iam.gserviceaccount.com` | `adc_fastlane2.json` | bellus, ...                |

---

## Fastlane Lanes

### Upload AAB without building

```bash
bundle exec fastlane android upload_store \
  aab:'/path/to/app-release.aab' \
  track:production
```

### Full build + upload

```bash
bundle exec fastlane android build \
  install:false env:prod branch: distribute:store firebase:false \
  version:patch json_file:/path/to/app.json client:tspa --env prod
```

---

## How It Works (technical)

1. `GOOGLE_APPLICATION_CREDENTIALS` → `~/.config/gcloud/adc_{sa}.json` (type: `impersonated_service_account`)
2. `googleauth` gem loads the ADC file → creates `ImpersonatedServiceAccountCredentials`
3. Fastlane's `supply` calls `fetch_access_token!` to get a Play Store API token
4. `ImpersonatedServiceAccountCredentials` calls IAM Credentials API using user OAuth2 token → returns short-lived SA token
5. SA token used to authenticate Play Store API calls

### Known Workaround (googleauth 1.16.2 bug)

Two bugs in `googleauth 1.16.2` are patched in `fastlane/Fastfile`:

```ruby
Google::Auth::ImpersonatedServiceAccountCredentials.class_eval do
  # Bug 1: fetch_access_token! declared private but called directly by google-api-ruby-client
  public :fetch_access_token!

  private

  # Bug 2: prepare_auth_header calls updater_proc.call(hash) but BaseClient#apply (called by
  # updater_proc) returns a new cloned hash instead of mutating in-place, leaving auth_header
  # empty and causing 401 CREDENTIALS_MISSING on IAM GenerateAccessToken.
  def prepare_auth_header
    @source_credentials.updater_proc.call({})
  end
end
```

Remove this patch once `googleauth` ships a fix.

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `private method 'fetch_access_token!'` | Monkey-patch not loaded | Check Fastfile patch is at top of file |
| `401 CREDENTIALS_MISSING` | `prepare_auth_header` bug | Monkey-patch must include `prepare_auth_header` override |
| `403 PERMISSION_DENIED - The caller does not have permission` | SA not added to Play Console for this app | Add SA in Play Console → API access → Manage permissions |
| `This service account already has access to 10 other developer accounts` | SA at Play Console limit | Create new SA (fastlane2), add to Play Console, set `GOOGLE_APPLICATION_CREDENTIALS` to `adc_fastlane2.json` |
| `Google Play Android Developer API not enabled` | API disabled in GCP project | Enable at: `https://console.developers.google.com/apis/api/androidpublisher.googleapis.com/overview?project=edular-19fe4` |
| `Some of the Android App Bundle uploads are not completed yet` | Google Play processing lag | Retry the command — transient error |
| `PERMISSION_DENIED: iam.serviceAccounts.getIamPolicy` when running `gcloud iam` | `gcloud config auth/impersonate_service_account` still set from old setup — gcloud runs as SA, not user | Run `gcloud config unset auth/impersonate_service_account` then retry |
| `PERMISSION_DENIED: Request had insufficient authentication scopes` | `GOOGLE_APPLICATION_CREDENTIALS` path not resolving — dotenv does not expand `~` or `$HOME`, so wrong/missing ADC file used | Fastfile `before_all` calls `File.expand_path` — ensure you are on latest Fastfile |

---

## Revoking Access

To remove a developer's impersonation access without touching the SA:

```bash
gcloud iam service-accounts remove-iam-policy-binding \
  fastlane@edular-19fe4.iam.gserviceaccount.com \
  --role="roles/iam.serviceAccountTokenCreator" \
  --member="user:someone@gmail.com" \
  --project=edular-19fe4
```
