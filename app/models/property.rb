class Property < ApplicationRecord
  include Storext.model
  has_many_attached :photos

  FEATURES = %w(fridge conditioning tv dishwasher boiler).map(&:to_sym)
  RULES = %w(family smoking animals events).map(&:to_sym)

  FEATURES.each do |f|
    store_attribute :features, f, Boolean, default: false
  end

  RULES.each do |r|
    store_attribute :rules, r, Boolean, default: false
  end

end
