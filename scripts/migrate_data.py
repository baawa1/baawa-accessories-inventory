import os
import psycopg2
from psycopg2.extras import DictCursor
from supabase import create_client, Client
from dotenv import load_dotenv, find_dotenv
import logging
import decimal
from datetime import datetime, date
import uuid

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load environment variables for remote Supabase
load_dotenv(find_dotenv('.env.local'))

# --- Remote Supabase Connection ---
remote_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
remote_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
if not remote_url or not remote_key:
    logging.error("Remote Supabase URL or Service Role Key not found in .env.local file.")
    logging.error("Please ensure .env.local exists with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")
    exit()
supabase: Client = create_client(remote_url, remote_key)

# --- Local Database Connection ---
# Default connection string for Supabase local dev environment
local_db_url = os.environ.get("LOCAL_DATABASE_URL", "postgresql://postgres:postgres@localhost:54322/postgres")
local_conn = None
try:
    local_conn = psycopg2.connect(local_db_url)
    logging.info("Successfully connected to the local database.")
except psycopg2.OperationalError as e:
    logging.error(f"Could not connect to the local database using: {local_db_url}")
    logging.error(f"Error: {e}")
    logging.error("Please ensure your local Supabase stack is running (`supabase start`).")
    logging.error("You can also specify the connection string via the LOCAL_DATABASE_URL environment variable.")
    exit()

# Tables to migrate in order of dependency
TABLES_TO_MIGRATE = [
    'roles',
    'brands',
    'categories',
    'suppliers',
    'customers',
    'products',
    'product_variants',
    'product_images',
    'orders',
    'order_items',
    'purchase_orders',
    'purchase_order_items',
    'stock_adjustments',
    'user_profiles',
    'user_roles',
]

# --- Remote Table Schemas (manually defined for alignment) ---
REMOTE_SCHEMAS = {
    'brands': ['id', 'name', 'description', 'slug'],
    'categories': ['id', 'name', 'description', 'slug'],
    'suppliers': ['id', 'name', 'email', 'phone', 'address'],
    'products': ['id', 'sku', 'name', 'description', 'short_description', 'slug', 'cost_price', 'selling_price', 'regular_price', 'category_id', 'brand_id', 'supplier_id', 'status', 'tags', 'reorder_level', 'stock_status'],
    'product_images': ['id', 'product_id', 'variant_id', 'image_url', 'alt_text', 'display_order'],
    # Add more as needed
}

# --- UUID mapping for tables with UUID PKs ---
UUID_TABLES = ['brands', 'categories', 'suppliers', 'products']
UUID_FK_FIELDS = {
    'products': {'brand_id': 'brands', 'category_id': 'categories', 'supplier_id': 'suppliers'},
    'product_images': {'product_id': 'products'},
    # Add more as needed
}

def serialize_record(record):
    """
    Convert all datetime/date/Decimal objects in a record to serializable types.
    """
    for k, v in record.items():
        if isinstance(v, (datetime, date)):
            record[k] = v.isoformat()
        elif isinstance(v, decimal.Decimal):
            record[k] = float(v)
    return record

def create_slug(name):
    if not name:
        return None
    import re
    slug = re.sub(r'[^a-zA-Z0-9\s-]', '', name)
    slug = re.sub(r'\s+', '-', slug)
    return slug.lower()

def migrate_data():
    """
    Migrates data from a local PostgreSQL database to a remote Supabase project.
    Handles UUID mapping and column filtering for schema alignment.
    """
    uuid_maps = {tbl: {} for tbl in UUID_TABLES}
    with local_conn.cursor(cursor_factory=DictCursor) as cursor:
        for table_name in TABLES_TO_MIGRATE:
            logging.info(f"--- Migrating table: {table_name} ---")

            # 1. Fetch data from local table
            try:
                cursor.execute(f'SELECT * FROM public."{table_name}";')
                records = cursor.fetchall()
                logging.info(f"Found {len(records)} records in local table '{table_name}'.")
            except psycopg2.Error as e:
                logging.error(f"Error fetching from local table {table_name}: {e}")
                continue

            if not records:
                logging.info(f"No records to migrate for table '{table_name}'.")
                continue

            # 2. Prepare data for remote
            data_to_insert = []
            for rec in records:
                rec = dict(rec)
                rec = serialize_record(rec)
                # UUID mapping for PKs
                if table_name in UUID_TABLES:
                    old_id = rec['id']
                    new_id = str(uuid.uuid4())
                    uuid_maps[table_name][old_id] = new_id
                    rec['id'] = new_id
                # UUID mapping for FKs
                if table_name in UUID_FK_FIELDS:
                    for fk_field, ref_table in UUID_FK_FIELDS[table_name].items():
                        if rec.get(fk_field) in uuid_maps[ref_table]:
                            rec[fk_field] = uuid_maps[ref_table][rec[fk_field]]
                        else:
                            # If the referenced FK does not exist in the mapping, skip this record
                            rec[fk_field] = None
                # Generate slug if required
                if table_name in ['brands', 'categories']:
                    if not rec.get('slug'):
                        rec['slug'] = create_slug(rec.get('name'))
                # Only keep columns that exist in remote schema
                if table_name in REMOTE_SCHEMAS:
                    rec = {k: v for k, v in rec.items() if k in REMOTE_SCHEMAS[table_name]}
                # For product_images, skip if product_id is None or not a valid UUID
                if table_name == 'product_images':
                    import re
                    uuid_regex = re.compile(r'^[0-9a-fA-F-]{36}$')
                    if not rec.get('product_id') or not uuid_regex.match(str(rec['product_id'])):
                        continue
                data_to_insert.append(rec)

            # 3. Insert data into remote Supabase table
            try:
                batch_size = 100
                for i in range(0, len(data_to_insert), batch_size):
                    batch = data_to_insert[i:i + batch_size]
                    # Use upsert for brands only
                    if table_name == 'brands':
                        response = supabase.table(table_name).upsert(batch, on_conflict=['name']).execute()
                    else:
                        response = supabase.table(table_name).insert(batch).execute()
                    # Fix error handling for APIResponse
                    if hasattr(response, 'error') and response.error:
                        logging.error(f"Failed to insert data into {table_name}. Error: {response.error}")
                        break
                    elif hasattr(response, 'data') and response.data is None:
                        logging.error(f"Failed to insert data into {table_name}. No data returned.")
                        break
                if hasattr(response, 'data') and response.data:
                    logging.info(f"Successfully inserted records into remote table '{table_name}'.")
            except Exception as e:
                logging.error(f"An exception occurred while inserting data into {table_name}: {e}")
    local_conn.close()
    logging.info("Data migration process completed.")

if __name__ == "__main__":
    migrate_data()
