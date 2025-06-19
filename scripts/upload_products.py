import csv
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import re
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

load_dotenv()

# Supabase connection
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_ANON_KEY")

if not url or not key:
    logging.error("Supabase URL or Key not found. Make sure .env file is present and correct.")
    exit()

supabase: Client = create_client(url, key)

def to_numeric(value, default=0):
    if value is None or value == '':
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

def to_integer(value, default=0):
    if value is None or value == '':
        return default
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return default

def create_slug(name):
    if not name:
        return None
    # Remove special characters, replace spaces with hyphens, and convert to lowercase
    slug = re.sub(r'[^a-zA-Z0-9\s-]', '', name)
    slug = re.sub(r'\s+', '-', slug)
    return slug.lower()


def upload_products(csv_file_path):
    # Pre-fetch existing data to local maps for efficiency
    print("Fetching existing brands, suppliers, and categories to create a local map...")
    brands_data = supabase.table('brands').select('id, name').execute().data or []
    suppliers_data = supabase.table('suppliers').select('id, name').execute().data or []
    categories_data = supabase.table('categories').select('id, name').execute().data or []

    brands = {b['name']: b['id'] for b in brands_data}
    suppliers = {s['name']: s['id'] for s in suppliers_data}
    categories = {c['name']: c['id'] for c in categories_data}
    print("Done fetching.")

    with open(csv_file_path, mode='r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            try:
                # Create or get Brand
                brand_name = row.get('Attribute 1 value(s)')
                if not brand_name:
                    continue # Skip products without a brand

                brand_id = brands.get(brand_name)
                if not brand_id:
                    new_brand_response = supabase.table('brands').insert({'name': brand_name}).execute()
                    if new_brand_response.data:
                        brand_id = new_brand_response.data[0]['id']
                        brands[brand_name] = brand_id # Update local map
                    else:
                        print(f"Failed to create brand: {brand_name}. Error: {new_brand_response.error}")
                        continue

                # Create or get Supplier (assuming brand is also the supplier)
                supplier_id = suppliers.get(brand_name)
                if not supplier_id:
                    new_supplier_response = supabase.table('suppliers').insert({'name': brand_name}).execute()
                    if new_supplier_response.data:
                        supplier_id = new_supplier_response.data[0]['id']
                        suppliers[brand_name] = supplier_id # Update local map
                    else:
                        print(f"Failed to create supplier: {brand_name}. Error: {new_supplier_response.error}")
                        continue

                # Create or get Category
                category_id = None
                category_name = row.get('Categories')
                if category_name:
                    # Can be "Cat > Subcat", so we take the first one for now.
                    main_category_name = category_name.split(' > ')[0]
                    category_id = categories.get(main_category_name)
                    if not category_id:
                        new_category_response = supabase.table('categories').insert({'name': main_category_name, 'description': main_category_name}).execute()
                        if new_category_response.data:
                            category_id = new_category_response.data[0]['id']
                            categories[main_category_name] = category_id # Update local map
                        else:
                            print(f"Failed to create category: {main_category_name}. Error: {new_category_response.error}")

                # Prepare product data
                regular_price = to_numeric(row.get('Regular price'))
                sale_price = to_numeric(row.get('Sale price'))
                selling_price = sale_price if sale_price > 0 else regular_price

                product_data = {
                    'sku': row.get('SKU'),
                    'name': row.get('Name'),
                    'description': row.get('Description'),
                    'short_description': row.get('Short description'),
                    'slug': create_slug(row.get('Name')),
                    'cost_price': to_numeric(row.get('Meta: _wc_cog_cost')),
                    'selling_price': selling_price,
                    'regular_price': regular_price,
                    'quantity_on_hand': to_integer(row.get('Stock')),
                    'category_id': category_id,
                    'brand_id': brand_id,
                    'model_name': row.get('Name'), # Assuming model_name is the same as product name
                    'supplier_id': supplier_id,
                    'status': 'active' if row.get('Published') == '1' else 'draft',
                    'tags': [tag.strip() for tag in row.get('Tags', '').split(',') if tag.strip()],
                    'stock_status': 'in_stock' if row.get('In stock?') == '1' else 'out_of_stock',
                    'featured': row.get('Is featured?') == '1',
                    'catalog_visibility': row.get('Visibility in catalog') == 'visible',
                }

                # Insert product
                product_response = supabase.table('products').insert(product_data).execute()

                if product_response.data:
                    product_id = product_response.data[0]['id']

                    # Insert product images
                    image_urls = [url.strip() for url in row.get('Images', '').split(',') if url.strip()]
                    if image_urls:
                        image_records = [
                            {'product_id': product_id, 'image_url': url} for url in image_urls
                        ]
                        supabase.table('product_images').insert(image_records).execute()
                else:
                    print(f"Failed to insert product: {row.get('SKU')}. Error: {product_response.error}")


            except Exception as e:
                print(f"Error processing row with SKU {row.get('SKU')}: {e}")

if __name__ == '__main__':
    # Assuming the CSV file is in a 'data' directory at the root of the project.
    csv_file_path = 'data/wc-product-export-18-6-2025-1750220421093.csv'
    upload_products(csv_file_path)

