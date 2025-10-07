import { Injectable } from '@nestjs/common';

@Injectable()
export class ExecuteService {
  async mockRun(body: any) {
    const { language, code, stdin } = body || {};
    // Echo-only mock
    return {
      ok: true,
      language,
      stdout: '',
      stderr: '',
      hint: 'This is a mock executor. Replace with your sandbox.',
    };
  }
}
