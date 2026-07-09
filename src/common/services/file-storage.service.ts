import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileStorageService {
  private uploadDir: string;

  constructor(private config: ConfigService) {
    this.uploadDir = this.config.get<string>('UPLOAD_DIR') || './uploads';
    this.ensureUploadDirExists();
  }

  private ensureUploadDirExists(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(filename: string, buffer: Buffer): Promise<string> {
    const filepath = path.join(this.uploadDir, filename);
    fs.writeFileSync(filepath, buffer);
    return filepath;
  }

  async getFile(filepath: string): Promise<Buffer> {
    return fs.promises.readFile(filepath);
  }

  async deleteFile(filepath: string): Promise<void> {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }

  getUploadUrl(filename: string): string {
    return `/uploads/${filename}`;
  }
}
