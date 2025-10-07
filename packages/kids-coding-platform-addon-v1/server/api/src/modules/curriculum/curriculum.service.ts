import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CurriculumService {
  basePath = path.join(process.cwd(), 'src', 'data', 'curriculum');

  async readGame(language: string, game: string): Promise<any | null> {
    const p = path.join(this.basePath, language, `${game}.json`);
    if (!fs.existsSync(p)) return null;
    const raw = fs.readFileSync(p, 'utf-8');
    return JSON.parse(raw);
  }
}
