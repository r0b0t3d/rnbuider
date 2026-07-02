#!/usr/bin/env bash
set -euo pipefail

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud is not installed. Install Google Cloud SDK first."
  exit 1
fi

echo "Available projects:"
gcloud projects list --format="table(projectId,name)" 2>/dev/null || echo "  (could not list projects)"
echo ""
read -rp "Enter Google Cloud project ID [edular-19fe4]: " PROJECT_ID
PROJECT_ID="${PROJECT_ID:-edular-19fe4}"

read -rp "Enter service account email [fastlane@edular-19fe4.iam.gserviceaccount.com]: " SERVICE_ACCOUNT_EMAIL
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_EMAIL:-fastlane@edular-19fe4.iam.gserviceaccount.com}"

read -rp "Enter your Google account email [klassapp2013@gmail.com]: " USER_EMAIL
USER_EMAIL="${USER_EMAIL:-klassapp2013@gmail.com}"

echo ""
echo "Using:"
echo "  Project ID: $PROJECT_ID"
echo "  Service Account: $SERVICE_ACCOUNT_EMAIL"
echo "  User: $USER_EMAIL"
echo ""

gcloud config set project "$PROJECT_ID"

echo "Granting Service Account Token Creator to your user..."
gcloud iam service-accounts add-iam-policy-binding \
  "$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --member="user:$USER_EMAIL"

echo "Logging you into gcloud..."
gcloud auth login "$USER_EMAIL"

echo "Creating ADC with service account impersonation..."
gcloud auth application-default login \
  --impersonate-service-account="$SERVICE_ACCOUNT_EMAIL"

echo "Setting default gcloud impersonation (optional but convenient)..."
gcloud config set auth/impersonate_service_account "$SERVICE_ACCOUNT_EMAIL"

ADC_PATH="$HOME/.config/gcloud/application_default_credentials.json"
EXPORT_LINE="export GOOGLE_APPLICATION_CREDENTIALS=\"$ADC_PATH\""

append_if_missing() {
  local file="$1"
  if [ -f "$file" ]; then
    if grep -Fqx "$EXPORT_LINE" "$file"; then
      echo "Already exists in $file"
    else
      printf '\n%s\n' "$EXPORT_LINE" >> "$file"
      echo "Added GOOGLE_APPLICATION_CREDENTIALS to $file"
    fi
  else
    printf '%s\n' "$EXPORT_LINE" > "$file"
    echo "Created $file and added GOOGLE_APPLICATION_CREDENTIALS"
  fi
}

append_if_missing "$HOME/.bashrc"
append_if_missing "$HOME/.zshrc"

export GOOGLE_APPLICATION_CREDENTIALS="$ADC_PATH"
export GOOGLE_IMPERSONATE_SERVICE_ACCOUNT="$SERVICE_ACCOUNT_EMAIL"

echo ""
echo "Done."
echo "ADC file should be at:"
echo "  $ADC_PATH"
echo ""
echo "GOOGLE_APPLICATION_CREDENTIALS has been exported for this session and added to:"
echo "  $HOME/.bashrc"
echo "  $HOME/.zshrc"
echo ""
echo "Reload your shell config with one of these commands:"
echo "  source ~/.bashrc"
echo "  source ~/.zshrc"
echo ""
echo "To test access token generation:"
echo "  gcloud auth print-access-token --impersonate-service-account=$SERVICE_ACCOUNT_EMAIL"
