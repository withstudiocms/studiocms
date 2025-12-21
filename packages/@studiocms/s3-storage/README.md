# @studiocms/s3-storage Plugin

## Setup

### Required Environment variables

```env
# ============================================
# CONFIGURATION FOR DIFFERENT PROVIDERS
# ============================================

# -------------------- AWS S3 --------------------
CMS_S3_PROVIDER=AWS
CMS_S3_REGION=us-east-1
CMS_S3_ENDPOINT=  # Leave empty for AWS
CMS_S3_ACCESS_KEY_ID=your_access_key
CMS_S3_SECRET_ACCESS_KEY=your_secret_key
CMS_S3_BUCKET_NAME=your_bucket_name
CMS_S3_FORCE_PATH_STYLE=false
CMS_S3_PUBLIC_ENDPOINT=  # Optional: Custom public endpoint for accessing files

# ------------ Cloudflare R2 --------------------
# CMS_S3_PROVIDER=Cloudflare R2
# CMS_S3_REGION=auto
# CMS_S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
# CMS_S3_ACCESS_KEY_ID=your_r2_access_key
# CMS_S3_SECRET_ACCESS_KEY=your_r2_secret_key
# CMS_S3_BUCKET_NAME=your_bucket_name
# CMS_S3_FORCE_PATH_STYLE=false
# CMS_S3_PUBLIC_ENDPOINT=  # Optional: Custom public endpoint for accessing files

# ---------- DigitalOcean Spaces ----------------
# CMS_S3_PROVIDER=DigitalOcean Spaces
# CMS_S3_REGION=nyc3
# CMS_S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
# CMS_S3_ACCESS_KEY_ID=your_spaces_key
# CMS_S3_SECRET_ACCESS_KEY=your_spaces_secret
# CMS_S3_BUCKET_NAME=your_space_name
# CMS_S3_FORCE_PATH_STYLE=false
# CMS_S3_PUBLIC_ENDPOINT=  # Optional: Custom public endpoint for accessing files

# ------------- Backblaze B2 --------------------
# CMS_S3_PROVIDER=Backblaze B2
# CMS_S3_REGION=us-west-004
# CMS_S3_ENDPOINT=https://s3.us-west-004.backblazeb2.com
# CMS_S3_ACCESS_KEY_ID=your_b2_key_id
# CMS_S3_SECRET_ACCESS_KEY=your_b2_application_key
# CMS_S3_BUCKET_NAME=your_bucket_name
# CMS_S3_FORCE_PATH_STYLE=false
# CMS_S3_PUBLIC_ENDPOINT=  # Optional: Custom public endpoint for accessing files

# --------------- MinIO -------------------------
# CMS_S3_PROVIDER=MinIO
# CMS_S3_REGION=us-east-1
# CMS_S3_ENDPOINT=http://localhost:9000
# CMS_S3_ACCESS_KEY_ID=minioadmin
# CMS_S3_SECRET_ACCESS_KEY=minioadmin
# CMS_S3_BUCKET_NAME=your_bucket_name
# CMS_S3_FORCE_PATH_STYLE=true  # Required for MinIO
# CMS_S3_PUBLIC_ENDPOINT=  # Optional: Custom public endpoint for accessing files

# ------------- Wasabi --------------------------
# CMS_S3_PROVIDER=Wasabi
# CMS_S3_REGION=us-east-1
# CMS_S3_ENDPOINT=https://s3.us-east-1.wasabisys.com
# CMS_S3_ACCESS_KEY_ID=your_wasabi_key
# CMS_S3_SECRET_ACCESS_KEY=your_wasabi_secret
# CMS_S3_BUCKET_NAME=your_bucket_name
# CMS_S3_FORCE_PATH_STYLE=false
# CMS_S3_PUBLIC_ENDPOINT=  # Optional: Custom public endpoint for accessing files

# ---------- Linode Object Storage --------------
# CMS_S3_PROVIDER=Linode
# CMS_S3_REGION=us-east-1
# CMS_S3_ENDPOINT=https://us-east-1.linodeobjects.com
# CMS_S3_ACCESS_KEY_ID=your_linode_key
# CMS_S3_SECRET_ACCESS_KEY=your_linode_secret
# CMS_S3_BUCKET_NAME=your_bucket_name
# CMS_S3_FORCE_PATH_STYLE=false
# CMS_S3_PUBLIC_ENDPOINT=  # Optional: Custom public endpoint for accessing files
```

## License

[MIT Licensed](./LICENSE).