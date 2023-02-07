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

        content = content + "\n" + params[:content]
        
        client = Discordrb::Webhooks::Client.new(url: params[:webhook_url])
        client.execute do |builder|
          builder.content = content
          builder.add_embed do |embed|
            embed.title = params[:title]
            embed.description = params[:description]
            embed.thumbnail = Discordrb::Webhooks::EmbedThumbnail.new(
              url: params[:thumbnail_url]
            )
            embed.colour = color
            embed.timestamp = Time.now
          end
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
          FastlaneCore::ConfigItem.new(key: :title,
                                       description: "Embbed title",
                                       optional: true,),
          FastlaneCore::ConfigItem.new(key: :description,
                                       description: "Embbed description",
                                       optional: true,),
          FastlaneCore::ConfigItem.new(key: :thumbnail_url,
                                       description: "Embbed thumbnail",
                                       optional: true,),
          FastlaneCore::ConfigItem.new(key: :color,
                                       description: "Embbed color",
                                       optional: true,),
        ]
      end

      def self.authors
        # So no one will ever forget your contribution to fastlane :) You are awesome btw!
        ["Tuan Luong"]
      end
    end
  end
end
