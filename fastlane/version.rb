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
  puts "Write to json #{client} #{platform} #{version}"
  file = File.read(json_file)
  data_hash = JSON.parse(file)
  platform_version = data_hash[platform]
  if client != nil 
    platform_version = data_hash[client][platform]
  end
  # Default value for version
  if !platform_version 
    platform_version = {
      "version" => "1.0.0",
      "build" => 0,
      "buildDate" => ""
    }
  end

  if !version.nil? && !version.empty?
    puts "Set version #{version} #{version.blank?}"
    platform_version['version'] = version
  end
  platform_version['build'] = platform_version['build'] + 1
  platform_version['buildDate'] = Time.now.strftime("%d/%m/%Y %H:%M")
  # Set default version in case of empty
  if !platform_version['version']
    platform_version['version'] = '1.0.0'
  end

  puts "Platform version #{platform_version}"
  if client
    data_hash[client][platform] = platform_version
  else
    data_hash[platform] = platform_version
  end
  File.write(json_file, JSON.pretty_generate(data_hash))
end


