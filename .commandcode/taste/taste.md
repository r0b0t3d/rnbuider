# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# fastlane
- Prefer wiring into existing fastlane lanes/actions over implementing parallel bespoke solutions (e.g., use `sync_onesignal` lane instead of direct REST calls to OneSignal). Confidence: 0.70
- APNs `.p8` key file naming format should be `<slug>-<apns-key-id>.p8` (not just `<slug>.p8`). Confidence: 0.65

# workflow
- Flag security-sensitive findings (leaked keys, credentials) to the user with explicit confirmation prompts before modifying; do not silently fix. Confidence: 0.75

