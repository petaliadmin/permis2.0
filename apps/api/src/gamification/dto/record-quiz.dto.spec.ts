import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RecordQuizDto } from './record-quiz.dto';

async function validateDto(payload: Record<string, unknown>) {
  return validate(plainToInstance(RecordQuizDto, payload));
}

describe('RecordQuizDto', () => {
  it('accepts the payload sent by the web quiz page', async () => {
    const errors = await validateDto({ correct: 20, total: 25, mode: 'series' });
    expect(errors).toHaveLength(0);
  });

  it('accepts a payload without mode', async () => {
    const errors = await validateDto({ correct: 0, total: 25 });
    expect(errors).toHaveLength(0);
  });

  it('rejects negative counts', async () => {
    const errors = await validateDto({ correct: -1, total: 25 });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects counts above the ceiling', async () => {
    const errors = await validateDto({ correct: 500, total: 500 });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects an unknown mode', async () => {
    const errors = await validateDto({ correct: 1, total: 2, mode: 'hacker' });
    expect(errors.length).toBeGreaterThan(0);
  });
});
