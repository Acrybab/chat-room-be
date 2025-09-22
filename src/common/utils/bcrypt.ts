/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as bcrypt from 'bcrypt';
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10; // Adjust the number of rounds as needed
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}
export async function isTheSamePassword(
  plainText: string,
  hashed: string,
): Promise<boolean> {
  return await bcrypt.compare(plainText, hashed);
}
