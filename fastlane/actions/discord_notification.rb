require 'discordrb/webhooks'

module Fastlane
  module Actions
    module SharedValues
      DISCORD_NOTIFICATION_CUSTOM_VALUE = :DISCORD_NOTIFICATION_CUSTOM_VALUE
    end

    class DiscordNotificationAction < Action
      def self.run(params)
        content = ""
        # fastlane will take care of reading in the parameter and fetching the environment variable:
        params[:mention_users].split(/,/).each { |item|
          content = content + "<@#{item}> "
        } unless params[:mention_users].nil?

        if params[:content]
          content = content + "\n" + params[:content]
        end

        client = Discordrb::Webhooks::Client.new(url: params[:webhook_url])
        client.execute do |builder|
          builder.content = content
          params[:embeds].each { |item|
            builder.add_embed do |embed|
              embed.title = item["title"]
              embed.description = item["description"]
              embed.thumbnail = Discordrb::Webhooks::EmbedThumbnail.new(
                url: item["thumbnail_url"]
              )
              embed.colour = item["color"]
              embed.timestamp = Time.now

              item['fields'].each { |field|
                embed.add_field(name: field[:name], value: field[:value], inline: field[:inline])
              } unless item['fields'].nil?
            end
          } unless params[:embeds].nil?
          
        end
      end

      #####################################################
      # @!group Documentation
      #####################################################

      def self.description
        "A short description with <= 80 characters of what this action does"
      end

      def self.details
        # Optional:
        # this is your chance to provide a more detailed description of this action
        "You can use this action to do cool things..."
      end

      def self.available_options
        # Define all options your action supports.

        # Below a few examples
        [
          FastlaneCore::ConfigItem.new(key: :webhook_url,
                                       env_name: "DISCORD_NOTIFICATION_WEBHOOK_URL", # The name of the environment variable
                                       description: "Discord webhook url", # a short description of this parameter
                                       optional: false,
                                       verify_block: proc do |value|
                                          UI.user_error!("No webhook url for DiscordNotificationAction given, pass using `webhook_url: 'url'`") unless (value and not value.empty?)
                                          # UI.user_error!("Couldn't find file at path '#{value}'") unless File.exist?(value)
                                       end),
          FastlaneCore::ConfigItem.new(key: :content,
                                       description: "Message content",
                                       optional: true,),
          FastlaneCore::ConfigItem.new(key: :mention_users,
                                       description: "Mention users",
                                       optional: true,),
          FastlaneCore::ConfigItem.new(key: :mention_roles,
                                       description: "Mention roles",
                                       optional: true,),
          FastlaneCore::ConfigItem.new(key: :embeds,
                                       description: "Embbeds",
                                       type: Array,
                                       optional: true,),
        ]
      end

      def self.authors
        # So no one will ever forget your contribution to fastlane :) You are awesome btw!
        ["Tuan Luong"]
      end

      def self.is_supported?(platform)
        true
      end
    end
  end
end
