import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSequenceNumberToQuestionAndOption1721914984068
  implements MigrationInterface
{
  name = 'AddSequenceNumberToQuestionAndOption1721914984068';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "survey_question_option" ADD "sequenceNumber" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_question" ADD "sequenceNumber" integer NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "survey_question" DROP COLUMN "sequenceNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_question_option" DROP COLUMN "sequenceNumber"`,
    );
  }
}
