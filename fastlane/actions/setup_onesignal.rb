module Fastlane
  module Actions
    module SharedValues
      T_ONE_SIGNAL_APP_ID = :T_ONE_SIGNAL_APP_ID
      T_ONE_SIGNAL_APP_AUTH_KEY = :T_ONE_SIGNAL_APP_AUTH_KEY
    end

    class SetupOnesignalAction < Action
      def self.run(params)
        require 'net/http'
        require 'uri'
        require 'base64'
        require 'json'

        app_id = params[:app_id].to_s.strip
        auth_token = params[:auth_token]
        app_name = params[:app_name].to_s
        apns_p12_password = params[:apns_p12_password]
        android_token = params[:android_token]
        android_gcm_sender_id = params[:android_gcm_sender_id]
        fcm_json = params[:fcm_json]
        organization_id = params[:organization_id]
        apns_p8 = params[:apns_p8]
        apns_team_id = params[:apns_team_id]
        apns_bundle_id = params[:apns_bundle_id]
        apns_p8 = params[:apns_p8]

        has_app_id = !app_id.empty?
        has_app_name = !app_name.empty?

        is_update = has_app_id

        UI.user_error!('Please specify the `app_id` or the `app_name` parameters!') if !has_app_id && !has_app_name

        UI.message("Parameter App ID: #{app_id}") if has_app_id
        UI.message("Parameter App name: #{app_name}") if has_app_name

        payload = {}

        payload['name'] = app_name if has_app_name

        unless params[:apns_p12].nil?
          data = File.read(params[:apns_p12])
          apns_p12 = Base64.encode64(data)
          payload["apns_env"] = params[:apns_env]
          payload["apns_p12"] = apns_p12
          # we need to have something for the p12 password, even if it's an empty string
          payload["apns_p12_password"] = apns_p12_password || ""
        end

        # NOTE: the field is `fcm_v1_service_account_json`, not `fcm_json` —
        # OneSignal's current Apps API (api.onesignal.com) renamed it when it
        # dropped the legacy FCM server-key-only flow.
        payload["fcm_v1_service_account_json"] = JSON.parse(fcm_json) unless fcm_json.nil?
        payload["gcm_key"] = android_token unless android_token.nil?
        payload["android_gcm_sender_id"] = android_gcm_sender_id unless android_gcm_sender_id.nil?
        payload["organization_id"] = organization_id unless organization_id.nil?
        payload["apns_p8"] = apns_p8 unless apns_p8.nil?
        payload["apns_key_id"] = params[:apns_key_id] unless params[:apns_key_id].nil?
        payload["apns_team_id"] = apns_team_id unless apns_team_id.nil?
        payload["apns_bundle_id"] = apns_bundle_id unless apns_bundle_id.nil?

        # here's the actual lifting - POST or PUT to OneSignal's current API
        # (https://api.onesignal.com — the old https://onesignal.com/api/v1
        # host still answers but is deprecated and uses a different auth
        # scheme; do not revert to it)

        json_headers = { 'Content-Type' => 'application/json', 'Authorization' => "Key #{auth_token}" }
        url = +'https://api.onesignal.com/apps'
        url << '/' + app_id if is_update

        uri = URI.parse(url)
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true

        if is_update
          response = http.put(uri.path, payload.to_json, json_headers)
        else
          response = http.post(uri.path, payload.to_json, json_headers)
        end

        response_body = self.parse_response_body(response)

        check_response_code(response, response_body, is_update)

        Actions.lane_context[SharedValues::T_ONE_SIGNAL_APP_ID] = response_body["id"]

        # BREAKING CHANGE: the current Apps API no longer returns a
        # per-app auth key in the create/update response (the legacy
        # `basic_auth_key` field was removed). A REST API key now has to be
        # minted explicitly via the Create API Key endpoint, and its
        # `formatted_token` is only ever readable once, at creation — so we
        # only do this the first time the app is created, not on update.
        unless is_update
          rest_api_key = self.create_rest_api_key(auth_token, response_body["id"])
          Actions.lane_context[SharedValues::T_ONE_SIGNAL_APP_AUTH_KEY] = rest_api_key
        end
      end

      def self.create_rest_api_key(auth_token, app_id)
        json_headers = { 'Content-Type' => 'application/json', 'Authorization' => "Bearer #{auth_token}" }
        uri = URI.parse("https://api.onesignal.com/apps/#{app_id}/auth/tokens")
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true
        response = http.post(uri.path, { name: 'fastlane' }.to_json, json_headers)
        body = self.parse_response_body(response)
        if response.code.to_i == 200
          return body["formatted_token"]
        end
        UI.important("Could not create a OneSignal REST API key automatically (HTTP #{response.code}): #{body['errors'] || body}")
        nil
      end

      def self.parse_response_body(response)
        JSON.parse(response.body)
      rescue JSON::ParserError
        {}
      end

      def self.check_response_code(response, response_body, is_update)
        case response.code.to_i
        when 200, 204
          UI.success("Successfully #{is_update ? 'updated' : 'created new'} OneSignal app")
        else
          errors = response_body['errors'] || response_body
          UI.user_error!("OneSignal API error (HTTP #{response.code}) while #{is_update ? 'updating' : 'creating'} app: #{errors}")
        end
      end

      def self.description
        "Create or update a new [OneSignal](https://onesignal.com/) application"
      end

      def self.details
        "You can use this action to automatically create or update a OneSignal application. You can also upload a `.p12` with password, a GCM key, or both."
      end

      def self.available_options
        [
          FastlaneCore::ConfigItem.new(key: :app_id,
                                       env_name: "T_ONE_SIGNAL_APP_ID",
                                       sensitive: true,
                                       description: "OneSignal App ID. Setting this updates an existing app",
                                       optional: true),

          FastlaneCore::ConfigItem.new(key: :auth_token,
                                       env_name: "ONE_SIGNAL_AUTH_KEY",
                                       sensitive: true,
                                       description: "OneSignal Organization API Key (Account & API Keys → Organization API Key), sent as a Bearer token. Not the legacy User Auth Key.",
                                       verify_block: proc do |value|
                                         if value.to_s.empty?
                                           UI.error("Please add 'ENV[\"ONE_SIGNAL_AUTH_KEY\"] = \"your token\"' to your Fastfile's `before_all` section.")
                                           UI.user_error!("No ONE_SIGNAL_AUTH_KEY given.")
                                         end
                                       end),

          FastlaneCore::ConfigItem.new(key: :app_name,
                                       env_name: "ONE_SIGNAL_APP_NAME",
                                       description: "OneSignal App Name. This is required when creating an app (in other words, when `:app_id` is not set, and optional when updating an app",
                                       optional: true),

          FastlaneCore::ConfigItem.new(key: :fcm_json,
                                       env_name: "FCM_JSON",
                                       description: "Firebase Service Account JSON content (FCM v1) — replaces the deprecated legacy GCM key",
                                       sensitive: true,
                                       optional: true),

          FastlaneCore::ConfigItem.new(key: :android_token,
                                       env_name: "ANDROID_TOKEN",
                                       description: "ANDROID GCM KEY",
                                       sensitive: true,
                                       optional: true),

          FastlaneCore::ConfigItem.new(key: :android_gcm_sender_id,
                                       env_name: "ANDROID_GCM_SENDER_ID",
                                       description: "GCM SENDER ID",
                                       sensitive: true,
                                       optional: true),

          FastlaneCore::ConfigItem.new(key: :apns_p8,
                                       env_name: "APNS_P8",
                                       description: "APNS P8 string",
                                       optional: true),

          FastlaneCore::ConfigItem.new(key: :apns_key_id,
                                       env_name: "APNS_KEY_ID",
                                       description: "APNS KEY ID",
                                       optional: true),

          FastlaneCore::ConfigItem.new(key: :apns_team_id,
                                       env_name: "APNS_TEAM_ID",
                                       description: "APNS Team ID",
                                       optional: true),

          FastlaneCore::ConfigItem.new(key: :apns_bundle_id,
                                       env_name: "APNS_BUNDLE_ID",
                                       description: "APNS Bundle ID",
                                       optional: true),

          FastlaneCore::ConfigItem.new(key: :apns_p12,
                                       env_name: "APNS_P12",
                                       description: "APNS P12 File (in .p12 format)",
                                       optional: true),

          FastlaneCore::ConfigItem.new(key: :apns_p12_password,
                                       env_name: "APNS_P12_PASSWORD",
                                       sensitive: true,
                                       description: "APNS P12 password",
                                       optional: true),

          FastlaneCore::ConfigItem.new(key: :apns_env,
                                       env_name: "APNS_ENV",
                                       description: "APNS environment",
                                       optional: true,
                                       default_value: 'production'),

          FastlaneCore::ConfigItem.new(key: :organization_id,
                                       env_name: "ONE_SIGNAL_ORGANIZATION_ID",
                                       sensitive: true,
                                       description: "OneSignal Organization ID",
                                       optional: true)
        ]
      end

      def self.output
        [
          ['T_ONE_SIGNAL_APP_ID', 'The app ID of the newly created or updated app'],
          ['T_ONE_SIGNAL_APP_AUTH_KEY', 'The auth token for the newly created or updated app']
        ]
      end

      def self.authors
        ["timothybarraclough", "smartshowltd"]
      end

      def self.is_supported?(platform)
        [:ios, :android].include?(platform)
      end

      def self.example_code
        [
          'onesignal(
            auth_token: "Your OneSignal Auth Token",
            app_name: "Name for OneSignal App",
            android_token: "Your Android GCM key (optional)",
            android_gcm_sender_id: "Your Android GCM Sender ID (optional)",
            apns_p12: "Path to Apple .p12 file (optional)",
            apns_p12_password: "Password for .p12 file (optional)",
            apns_env: "production/sandbox (defaults to production)",
            organization_id: "Onesignal organization id (optional)"
          )',
          'onesignal(
            app_id: "Your OneSignal App ID",
            auth_token: "Your OneSignal Auth Token",
            app_name: "New Name for OneSignal App",
            android_token: "Your Android GCM key (optional)",
            android_gcm_sender_id: "Your Android GCM Sender ID (optional)",
            apns_p12: "Path to Apple .p12 file (optional)",
            apns_p12_password: "Password for .p12 file (optional)",
            apns_env: "production/sandbox (defaults to production)",
            organization_id: "Onesignal organization id (optional)"
          )'
        ]
      end

      def self.category
        :push
      end
    end
  end
end
