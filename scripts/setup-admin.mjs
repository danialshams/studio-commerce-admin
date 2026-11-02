import { PrismaClient } from '@prisma/client';
import { createHash,randomBytes,scryptSync } from 'node:crypto';
const db=new PrismaClient();
const email=process.env.ADMIN_EMAIL?.toLowerCase().trim();
const password=process.env.ADMIN_PASSWORD;
if(!email||!password||password.length<14) {
  console.error('Set ADMIN_EMAIL and a strong ADMIN_PASSWORD (at least 14 characters) in environment.');
  process.exit(1);
}
const salt=randomBytes(16).toString('hex');
const hash=`scrypt:${salt}:${scryptSync(password,salt,64).toString('hex')}`;
try{
  await db.admin.upsert({where:{email},create:{email,passwordHash:hash},update:{passwordHash:hash}});
  await db.storeSettings.upsert({where:{id:'main'},create:{id:'main'},update:{}});
  await db.session.deleteMany({where:{admin:{email}}});
  console.log('Admin account created/updated; prior sessions revoked.');
}finally{await db.$disconnect();}
