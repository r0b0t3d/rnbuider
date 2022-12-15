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
