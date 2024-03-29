class CreateProperties < ActiveRecord::Migration[5.2]
  def change
    create_table :properties do |t|
      t.string :title
      t.text :description
      t.decimal :price
      t.jsonb :features, null: false, default: {}
      t.jsonb :rules, null: false, default: {}

      t.timestamps
    end
    add_index  :properties, :features, using: :gin
    add_index  :properties, :rules, using: :gin
  end
end
