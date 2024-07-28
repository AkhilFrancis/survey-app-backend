import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export class CreateAdminUser1721840953773 implements MigrationInterface {
  name = 'CreateAdminUser1721840953773';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const id = uuidv4();
    const password = process.env.ADMIN_PASSWORD;
    const email = process.env.ADMIN_EMAIL;
    const hashedPassword = await bcrypt.hash(password, 10);

    await queryRunner.query(`
      INSERT INTO "user" (id, name, email, password, "isAdmin")
      VALUES ('${id}', 'Admin', '${email}', '${hashedPassword}', true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const email = process.env.ADMIN_EMAIL;
    await queryRunner.query(`
      DELETE FROM "user" WHERE email = '${email}'
    `);
  }
}
