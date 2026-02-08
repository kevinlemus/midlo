require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = 'midlo-apple-maps'
  s.version      = package['version']
  s.summary      = 'Native Apple Maps opener for Midlo'
  s.license      = { :type => 'MIT' }
  s.authors      = { 'Midlo' => 'dev@midlo.ai' }
  s.homepage     = 'https://midlo.ai'
  s.platforms    = { :ios => '13.0' }
  s.source       = { :path => '.' }

  s.source_files = 'ios/**/*.{h,m,mm}'
  s.frameworks   = 'MapKit'
  s.dependency 'React-Core'
end
