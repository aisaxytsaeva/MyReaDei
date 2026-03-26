import io
import json
import uuid
import logging
from datetime import datetime, timedelta
from typing import Dict, Any
from fastapi import UploadFile, HTTPException, status
from minio import Minio
from minio.error import S3Error
from app.core.config import settings

logger = logging.getLogger(__name__)

class MinioService:
    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
        self.bucket = settings.MINIO_BUCKET
        self.public_url = settings.MINIO_PUBLIC_URL
        self.max_file_size = settings.MAX_FILE_SIZE
        self.allowed_extensions = set(settings.ALLOWED_EXTENSIONS.split(','))
        
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
                logger.info(f"Created bucket: {self.bucket}")
                
                policy = {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"AWS": ["*"]},
                            "Action": ["s3:GetObject"],
                            "Resource": [f"arn:aws:s3:::{self.bucket}/*"]
                        }
                    ]
                }
                policy_str = json.dumps(policy)
                self.client.set_bucket_policy(self.bucket, policy_str)
                logger.info(f"Set public policy for bucket: {self.bucket}")
            else:
                logger.info(f"Bucket already exists: {self.bucket}")
        except S3Error as e:
            logger.error(f"Error creating bucket: {e}")
            raise
    
    def _validate_file(self, filename: str, content_type: str, file_size: int):
        ext = filename.split('.')[-1].lower() if '.' in filename else ''
        if ext not in self.allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File extension not allowed. Allowed: {', '.join(self.allowed_extensions)}"
            )
        
        if not content_type or not content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )
        
        if file_size > self.max_file_size:
            max_size_mb = self.max_file_size / (1024 * 1024)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Max size: {max_size_mb:.1f}MB"
            )
    
    def _generate_filename(self, original_filename: str) -> str:
        ext = original_filename.split('.')[-1].lower() if '.' in original_filename else 'jpg'
        return f"covers/{uuid.uuid4()}.{ext}"
    
    async def upload_file(
        self, 
        file: UploadFile,
        folder: str = "covers"
    ) -> Dict[str, Any]:
        contents = await file.read()
        file_size = len(contents)
        
        self._validate_file(file.filename, file.content_type, file_size)
        
        filename = self._generate_filename(file.filename)
        
        try:
            self.client.put_object(
                bucket_name=self.bucket,
                object_name=filename,
                data=io.BytesIO(contents),
                length=file_size,
                content_type=file.content_type or 'image/jpeg'
            )
            
            logger.info(f"File uploaded successfully: {filename}")
            
            return {
                "filename": filename,
                "url": self.get_file_url(filename),
                "size": file_size,
                "content_type": file.content_type
            }
            
        except S3Error as e:
            logger.error(f"MinIO error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error uploading file to storage: {str(e)}"
            )
    
    def get_file_url(self, filename: str, expires: int = 3600) -> str:
        return f"{settings.MINIO_PUBLIC_URL}/{self.bucket}/{filename}"
    
    def delete_file(self, filename: str):
        try:
            self.client.remove_object(self.bucket, filename)
            logger.info(f"File deleted: {filename}")
            return True
        except S3Error as e:
            logger.error(f"Error deleting file: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error deleting file: {str(e)}"
            )
    
    def get_file_info(self, filename: str) -> Dict[str, Any]:
        try:
            info = self.client.stat_object(self.bucket, filename)
            return {
                "filename": filename,
                "size": info.size,
                "content_type": info.content_type,
                "last_modified": info.last_modified,
                "etag": info.etag
            }
        except S3Error as e:
            logger.error(f"Error getting file info: {e}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )

minio_service = MinioService()