def next_version(current, increment)
    current, prerelease = current.split('-')
    major, minor, patch, *other = current.split('.')
    case increment
    when "major"
      major = major.succ
      minor = 0
      patch = 0
      prerelease = nil
    when "minor"
      minor = minor.succ
      patch = 0
      prerelease = nil
    when "patch"
      patch = patch != nil ? patch.succ : 1
    when "pre"
      prerelease.strip! if prerelease.respond_to? :strip
      prerelease = PRERELEASE[PRERELEASE.index(prerelease).succ % PRERELEASE.length]
    else
      raise InvalidIncrementError
    end
    version = [major, minor, patch, *other].compact.join('.')
    return [version, prerelease].compact.join('-')
end

def write_json_version(json_file, client, platform, version)
    file = File.read(json_file)
    data_hash = JSON.parse(file)
    platform_version = data_hash[platform]
    if client != nil 
      platform_version = data_hash[client][platform]
    end
    if version 
      platform_version['version'] = version
    end
    platform_version['build'] = platform_version['build'] + 1
    platform_version['buildDate'] = Time.now.strftime("%d/%m/%Y %H:%M")

    if client
      data_hash[client][platform] = platform_version
    else
      data_hash[platform] = platform_version
    end
    File.write(json_file, JSON.pretty_generate(data_hash))
end

desc "Get android version"
def get_android_version(increment = "patch")
    prod_version = google_play_track_release_names(
        json_key: ENV["JSON_KEY_FILE"],
        package_name: ENV["APP_IDENTIFIER_ANDROID"] || ENV["APP_IDENTIFIER"],
        track: 'production'
    )
    internal_version = google_play_track_release_names(
        json_key: ENV["JSON_KEY_FILE"],
        package_name: ENV["APP_IDENTIFIER_ANDROID"] || ENV["APP_IDENTIFIER"],
        track: 'internal'
    )
    new_version = next_version(prod_version.first, increment)
    if Gem::Version.new(internal_version.first.to_s) > Gem::Version.new(new_version.to_s)
        new_version = internal_version.first
    end
    return new_version
end

desc "Get ios version"
def get_ios_version(increment = "patch")
    latest_testflight_build_number(
        username: ENV['APPLE_ID'],
        team_id: ENV['ITC_TEAM_ID'],
        app_identifier: ENV['APP_IDENTIFIER'],
    )
    app_store_build_number(
        username: ENV['APPLE_ID'],
        team_id: ENV['ITC_TEAM_ID'],
        app_identifier: ENV['APP_IDENTIFIER'],
    )
    tf_version = Actions.lane_context[SharedValues::LATEST_TESTFLIGHT_VERSION]
    store_version = Actions.lane_context[SharedValues::LATEST_VERSION]
    next_v = next_version(store_version, increment)
    if Gem::Version.new(tf_version) > Gem::Version.new(next_v)
        tf_build_number = Actions.lane_context[SharedValues::LATEST_TESTFLIGHT_BUILD_NUMBER]
        store_build_number = Actions.lane_context[SharedValues::LATEST_BUILD_NUMBER]
        if tf_build_number == store_build_number 
        next_v = next_version(tf_version, 'patch')
        else
        next_v = tf_version
        end
    end
end