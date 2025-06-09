import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly supabase: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const supabaseKey = this.configService.get<string>('supabase.key');
    this.bucketName =
      this.configService.get<string>('supabase.bucketName') || 'cvs';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and key are required');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.logger.log('Supabase client initialized');
  }

  /**
   * Download file from Supabase storage and return as Buffer
   * Handles both public URLs and private file names
   */
  async downloadFile(fileNameOrUrl: string): Promise<Buffer | null> {
    try {
      // Check if it's a public URL
      if (this.isPublicSupabaseUrl(fileNameOrUrl)) {
        return await this.downloadPublicFile(fileNameOrUrl);
      } else {
        return await this.downloadPrivateFile(fileNameOrUrl);
      }
    } catch (error: any) {
      this.logger.error(
        `Failed to download file ${fileNameOrUrl}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Check if the provided string is a public Supabase storage URL
   */
  private isPublicSupabaseUrl(url: string): boolean {
    return url.includes('/storage/v1/object/public/') || url.startsWith('http');
  }

  /**
   * Download file from public URL
   */
  private async downloadPublicFile(url: string): Promise<Buffer | null> {
    try {
      this.logger.log(`Downloading public file from URL: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        this.logger.error(
          `HTTP error downloading public file: ${response.status} ${response.statusText} for URL: ${url}`,
        );
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      this.logger.log(
        `Successfully downloaded public file: ${url}, size: ${buffer.length} bytes`,
      );
      return buffer;
    } catch (error: any) {
      this.logger.error(`Error downloading public file from ${url}:`, {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause,
      });
      return null;
    }
  }

  /**
   * Download file from private storage using Supabase client
   */
  private async downloadPrivateFile(fileName: string): Promise<Buffer | null> {
    try {
      this.logger.log(
        `Downloading private file: ${fileName} from bucket: ${this.bucketName}`,
      );

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .download(fileName);

      if (error) {
        this.logger.error(
          `Error downloading private file ${fileName}: ${error.message}`,
        );
        return null;
      }

      if (!data) {
        this.logger.warn(`No data returned for private file: ${fileName}`);
        return null;
      }

      // Convert Blob to Buffer
      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      this.logger.log(
        `Successfully downloaded private file: ${fileName}, size: ${buffer.length} bytes`,
      );
      return buffer;
    } catch (error: any) {
      this.logger.error(
        `Failed to download private file ${fileName}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Get file metadata from Supabase storage
   */
  async getFileMetadata(
    fileNameOrUrl: string,
  ): Promise<{ size?: number; mimeType?: string } | null> {
    try {
      // For public URLs, we can try to get metadata from HTTP headers
      if (this.isPublicSupabaseUrl(fileNameOrUrl)) {
        return await this.getPublicFileMetadata(fileNameOrUrl);
      }

      // For private files, use Supabase client
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list('', {
          search: fileNameOrUrl,
        });

      if (error) {
        this.logger.error(
          `Error getting file metadata for ${fileNameOrUrl}: ${error.message}`,
        );
        return null;
      }

      const fileInfo = data?.find((file) => file.name === fileNameOrUrl);
      if (!fileInfo) {
        this.logger.warn(`File not found: ${fileNameOrUrl}`);
        return null;
      }

      return {
        size: fileInfo.metadata?.size,
        mimeType: fileInfo.metadata?.mimetype,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to get file metadata for ${fileNameOrUrl}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Get metadata for public file via HEAD request
   */
  private async getPublicFileMetadata(
    url: string,
  ): Promise<{ size?: number; mimeType?: string } | null> {
    try {
      const response = await fetch(url, { method: 'HEAD' });

      if (!response.ok) {
        return null;
      }

      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');

      return {
        size: contentLength ? parseInt(contentLength, 10) : undefined,
        mimeType: contentType || undefined,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to get metadata for public file ${url}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Check if file exists in Supabase storage
   */
  async fileExists(fileNameOrUrl: string): Promise<boolean> {
    try {
      // For public URLs, try a HEAD request
      if (this.isPublicSupabaseUrl(fileNameOrUrl)) {
        const response = await fetch(fileNameOrUrl, { method: 'HEAD' });
        return response.ok;
      }

      // For private files, use Supabase client
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list('', {
          search: fileNameOrUrl,
        });

      if (error) {
        this.logger.error(
          `Error checking file existence for ${fileNameOrUrl}: ${error.message}`,
        );
        return false;
      }

      return data?.some((file) => file.name === fileNameOrUrl) || false;
    } catch (error: any) {
      this.logger.error(
        `Failed to check file existence for ${fileNameOrUrl}: ${error.message}`,
      );
      return false;
    }
  }
}
