#!/usr/bin/env bash
set -euo pipefail

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud is not installed. Install Google Cloud SDK first."
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required but not found."
  exit 1
fi

echo "Available projects:"
gcloud projects list --format="table(projectId,name)" 2>/dev/null || echo "  (could not list projects)"
echo ""

DEFAULT_PROJECT_ID="${GCP_PROJECT_ID:-edular-19fe4}"
read -rp "Enter Google Cloud project ID [$DEFAULT_PROJECT_ID]: " PROJECT_ID
PROJECT_ID="${PROJECT_ID:-$DEFAULT_PROJECT_ID}"

DEFAULT_USER_EMAIL="${GCP_USER_EMAIL:-klassapp2013@gmail.com}"
read -rp "Enter your Google account email [$DEFAULT_USER_EMAIL]: " USER_EMAIL
USER_EMAIL="${USER_EMAIL:-$DEFAULT_USER_EMAIL}"

gcloud config set project "$PROJECT_ID"

echo ""
echo "Logging into gcloud as $USER_EMAIL..."
gcloud auth login "$USER_EMAIL"

echo ""
echo "Creating base ADC (user credentials, no impersonation)..."
gcloud auth application-default login

BASE_ADC="$HOME/.config/gcloud/application_default_credentials.json"
ADC_DIR="$HOME/.config/gcloud"

# Generate an impersonated ADC file for a service account.
# Reuses the base user credentials — no extra gcloud login needed.
generate_sa_adc() {
  local sa_email="$1"
  local sa_slug
  sa_slug=$(printf '%s' "$sa_email" | cut -d'@' -f1 | tr -cs '[:alnum:]' '_' | sed 's/_*$//')
  local output="$ADC_DIR/adc_${sa_slug}.json"

  echo ""
  echo "Granting roles/iam.serviceAccountTokenCreator to $USER_EMAIL for $sa_email..."
  # Unset gcloud impersonation so the grant runs as the user, not as an SA
  gcloud config unset auth/impersonate_service_account 2>/dev/null || true
  gcloud iam service-accounts add-iam-policy-binding \
    "$sa_email" \
    --role="roles/iam.serviceAccountTokenCreator" \
    --member="user:$USER_EMAIL" \
    --project="$PROJECT_ID"

  python3 - "$BASE_ADC" "$sa_email" "$output" <<'PYEOF'
import json, sys

base_path, sa_email, output_path = sys.argv[1], sys.argv[2], sys.argv[3]

with open(base_path) as f:
    base = json.load(f)

# If base is already an impersonated ADC, extract its source_credentials.
# Otherwise use base directly as the source (authorized_user).
src = base.get("source_credentials", base)

adc = {
    "delegates": [],
    "service_account_impersonation_url": (
        "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/"
        f"{sa_email}:generateAccessToken"
    ),
    "source_credentials": src,
    "type": "impersonated_service_account",
}

with open(output_path, "w") as f:
    json.dump(adc, f, indent=2)

print(f"Created: {output_path}")
print(f"Add to client .env:")
print(f"  GOOGLE_APPLICATION_CREDENTIALS={output_path}")
PYEOF
}

# Service accounts from repo's fastlane/configs.json (gcp.serviceAccounts), if provided.
if [ -n "${GCP_SERVICE_ACCOUNTS:-}" ]; then
  echo ""
  echo "Service accounts from fastlane/configs.json:"
  IFS=',' read -ra CONFIG_SAS <<< "$GCP_SERVICE_ACCOUNTS"
  for sa in "${CONFIG_SAS[@]}"; do
    echo "  - $sa"
  done
  for sa in "${CONFIG_SAS[@]}"; do
    generate_sa_adc "$sa"
  done
else
  read -rp "Enter service account email [fastlane@edular-19fe4.iam.gserviceaccount.com]: " SERVICE_ACCOUNT_EMAIL
  SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_EMAIL:-fastlane@edular-19fe4.iam.gserviceaccount.com}"
  generate_sa_adc "$SERVICE_ACCOUNT_EMAIL"
fi

# Additional service accounts
while true; do
  echo ""
  read -rp "Add another service account? (y/N): " ADD_MORE
  case "${ADD_MORE:-N}" in
    [Yy]*)
      read -rp "Enter service account email: " EXTRA_SA
      if [ -n "${EXTRA_SA:-}" ]; then
        generate_sa_adc "$EXTRA_SA"
      fi
      ;;
    *) break ;;
  esac
done

echo ""
echo "Done."
echo ""
echo "To test a service account token:"
echo "  gcloud auth print-access-token --impersonate-service-account=<SA_EMAIL>"
echo ""
echo "ADC files are in: $ADC_DIR/adc_*.json"
echo "Each client .env needs:"
echo "  GOOGLE_APPLICATION_CREDENTIALS=<path to their SA's adc file>"
