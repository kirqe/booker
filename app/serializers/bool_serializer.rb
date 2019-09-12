class BoolSerializer
  def self.dump(hash)
    # if you see this and know a better way of saving and retriving bools from jsonb, let me know
    hash.transform_values { |val| ActiveModel::Type::Boolean.new.cast(val) }
  end

  def self.load(hash)
    (hash || {}).with_indifferent_access
  end
end
