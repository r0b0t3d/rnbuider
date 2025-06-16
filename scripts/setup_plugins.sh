#!/bin/bash

# Default versions
DEFAULT_RUBY="3.2.2"
DEFAULT_NODE="20.11.1"

# Use args or defaults
RUBY_VERSION="${1:-$DEFAULT_RUBY}"
NODE_VERSION="${2:-$DEFAULT_NODE}"

# Add plugins
echo "🔌 Adding asdf plugins..."
asdf plugin add ruby https://github.com/asdf-vm/asdf-ruby.git
asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git
asdf plugin add yarn

# Install Ruby
echo "💎 Installing Ruby $RUBY_VERSION..."
asdf install ruby "$RUBY_VERSION"
asdf set -u ruby "$RUBY_VERSION"

# Install Node.js
echo "🟩 Installing Node.js $NODE_VERSION..."
asdf install nodejs "$NODE_VERSION"
asdf set -u nodejs "$NODE_VERSION"

# Install Yarn
echo "🟩 Installing Yarn..."
asdf install yarn latest
asdf set -u yarn latest

# Install RubyGems tools
echo "📦 Installing bundler and fastlane..."
gem install bundler
gem install fastlane

# Done
echo "✅ Setup complete!"
ruby -v
node -v
yarn -v
fastlane -v
