import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsCompleteToResponse1721920053411
  implements MigrationInterface
{
  name = 'AddIsCompleteToResponse1721920053411';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "survey_response" ADD "isComplete" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "survey_response" DROP COLUMN "isComplete"`,
    );
  }
}
