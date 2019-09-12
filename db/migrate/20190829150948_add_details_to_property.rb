class AddDetailsToProperty < ActiveRecord::Migration[5.2]
  def change
    add_column :properties, :address, :string
    add_column :properties, :latitude, :float
    add_column :properties, :longitude, :float
    add_column :properties, :rooms, :integer
    add_column :properties, :total_area, :integer
    add_column :properties, :floor_number, :integer
    add_column :properties, :total_floors, :integer
    add_column :properties, :email, :string
    add_column :properties, :phone, :string
    add_column :properties, :notes, :string
  end
end
