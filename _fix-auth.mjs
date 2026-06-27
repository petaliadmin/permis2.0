import fs from 'fs';
import content from './apps/api/src/auth/auth.service.ts?raw';
const result = content.replace(
  /const hashedPassword = await bcrypt\.hash\(password, 10\);/,
  'const hashedPassword = await bcrypt.hash(password ?? \'default-password\', 10);'
).replace(
  /const user = await this\.userService\.create\(\{/,
  'const user = await this.userService.create({ select: { id: true, email: true, name: true, avatar: true, xp: true, level: true, role: true, passwordHash: true, createdAt: true, updatedAt: true }, data: {'
).replace(
  /email,\s*name,\s*passwordHash: hashedPassword,\s*}\);/,
  'email, name, passwordHash: hashedPassword });'
);
console.log(result);
