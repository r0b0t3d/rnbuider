#!/bin/bash

set -e

# Detect architecture
ARCH=$(uname -m)
echo "Detected architecture: $ARCH"

# Detect shell
CURRENT_SHELL=$(basename "$SHELL")
echo "Detected shell: $CURRENT_SHELL"

# Install Homebrew if needed
if ! command -v brew >/dev/null; then
  echo "🧪 Installing Homebrew..."
  NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Add Homebrew to path
if [[ "$ARCH" == "arm64" ]]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
else
  eval "$(/usr/local/bin/brew shellenv)"
fi

# Install asdf via Homebrew
if ! command -v asdf >/dev/null; then
  echo "📦 Installing asdf..."
  brew install asdf
fi

# Set appropriate shell rc file
if [[ "$CURRENT_SHELL" == "zsh" ]]; then
  SHELL_RC="$HOME/.zshrc"
  echo -e "\n🔧 Updating $SHELL_RC..."

  {
    echo ''
    echo '# 👉 asdf setup for zsh'
    echo 'export PATH="${ASDF_DATA_DIR:-$HOME/.asdf}/shims:$PATH"'
    echo 'fpath=(${ASDF_DATA_DIR:-$HOME/.asdf}/completions $fpath)'
    echo 'autoload -Uz compinit && compinit'
  } >> "$SHELL_RC"

  mkdir -p "${ASDF_DATA_DIR:-$HOME/.asdf}/completions"
  asdf completion zsh > "${ASDF_DATA_DIR:-$HOME/.asdf}/completions/_asdf"
elif [[ "$CURRENT_SHELL" == "bash" ]]; then
  SHELL_RC="$HOME/.bashrc"
  BASH_PROFILE="$HOME/.bash_profile"
  echo -e "\n🔧 Updating $BASH_PROFILE and $SHELL_RC..."

  {
    echo ''
    echo '# 👉 asdf setup for bash'
    echo 'export ASDF_DATA_DIR="$HOME/.asdf"'
    echo 'export PATH="${ASDF_DATA_DIR:-$HOME/.asdf}/shims:$PATH"'
  } >> "$BASH_PROFILE"

  {
    echo ''
    echo '# 👉 asdf bash completions'
    echo '. <(asdf completion bash)'
  } >> "$SHELL_RC"

else
  echo "❌ Unsupported shell: $CURRENT_SHELL"
  exit 1
fi

echo -e "\n🚨 Please run 'source $RC_FILE' or restart your terminal to apply changes to your shell environment."
echo -e "\n🚨 Please run 'curl -fsSL https://gist.githubusercontent.com/r0b0t3d/92d9da44fe22190135c71572858a5a69/raw/2f689a89de21c7f09d1a8346a8ba37bf9e9a6bee/setup_plugins.sh | zsh' to install plugins"
