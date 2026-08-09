import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  title: z.string().min(1, 'العنوان مطلوب'),
});

let thrownErr = null;
try {
  schema.parse({ title: '' });
} catch (e) {
  thrownErr = e;
  console.log('ZodError is instance of z.ZodError:', e instanceof z.ZodError);
  console.log('error has _zod:', '_zod' in e);
  console.log('error._zod:', e._zod);
  console.log('error has issues:', Array.isArray(e.issues), 'issues[0]:', JSON.stringify(e.issues?.[0]));
}

const result = zodResolver(schema)({ title: '' }, undefined, {});
console.log('resolver returned promise:', result instanceof Promise);
try {
  const r = await result;
  console.log('resolved:', JSON.stringify(r));
} catch (e) {
  console.log('REJECTED with:', e.constructor.name, '| is ZodError:', e instanceof z.ZodError);
}
