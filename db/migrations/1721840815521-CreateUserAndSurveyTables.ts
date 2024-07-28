import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserAndSurveyTables1721840815521
  implements MigrationInterface
{
  name = 'CreateUserAndSurveyTables1721840815521';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "survey" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" character varying, CONSTRAINT "PK_f0da32b9181e9c02ecf0be11ed3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "survey_question_option" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "text" character varying NOT NULL, "questionId" uuid, CONSTRAINT "PK_4582a5069802624101619af4b91" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "isAdmin" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "survey_response" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid, "surveyVersionId" uuid NOT NULL, CONSTRAINT "PK_d9326eb52bf8b23d56a39ce419a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "survey_response_detail" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "responseId" uuid NOT NULL, "questionId" uuid NOT NULL, "freeFormAnswer" character varying, "selectedOptionId" uuid, CONSTRAINT "PK_8daf2f1252eccfbbe6b4afe8872" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "survey_question" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying NOT NULL, "text" character varying NOT NULL, "surveyVersionId" uuid, CONSTRAINT "PK_ec6d65e83fd7217202178b79907" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "survey_version" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "surveyId" uuid, CONSTRAINT "PK_01a36673c91befacaecc85f4654" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_question_option" ADD CONSTRAINT "FK_5fde92b5e7ffdc9a30fb875d8cb" FOREIGN KEY ("questionId") REFERENCES "survey_question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_response" ADD CONSTRAINT "FK_6f270d46c6b0e0b68373a417c5a" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_response" ADD CONSTRAINT "FK_8f9ef628bc2ff59a3c8340a8472" FOREIGN KEY ("surveyVersionId") REFERENCES "survey_version"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_response_detail" ADD CONSTRAINT "FK_89315178e5dbdb6d99a6f5179c4" FOREIGN KEY ("responseId") REFERENCES "survey_response"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_response_detail" ADD CONSTRAINT "FK_1371bc0e1b902d643ae8296bb3d" FOREIGN KEY ("questionId") REFERENCES "survey_question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_response_detail" ADD CONSTRAINT "FK_e82b59452bfc68622550af72f23" FOREIGN KEY ("selectedOptionId") REFERENCES "survey_question_option"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_question" ADD CONSTRAINT "FK_87aebf76b23b1b25b724cb059b7" FOREIGN KEY ("surveyVersionId") REFERENCES "survey_version"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_version" ADD CONSTRAINT "FK_6862dbbab27a77ec2788c12a246" FOREIGN KEY ("surveyId") REFERENCES "survey"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "survey_version" DROP CONSTRAINT "FK_6862dbbab27a77ec2788c12a246"`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_question" DROP CONSTRAINT "FK_87aebf76b23b1b25b724cb059b7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_response_detail" DROP CONSTRAINT "FK_e82b59452bfc68622550af72f23"`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_response_detail" DROP CONSTRAINT "FK_1371bc0e1b902d643ae8296bb3d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_response_detail" DROP CONSTRAINT "FK_89315178e5dbdb6d99a6f5179c4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_response" DROP CONSTRAINT "FK_8f9ef628bc2ff59a3c8340a8472"`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_response" DROP CONSTRAINT "FK_6f270d46c6b0e0b68373a417c5a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "survey_question_option" DROP CONSTRAINT "FK_5fde92b5e7ffdc9a30fb875d8cb"`,
    );
    await queryRunner.query(`DROP TABLE "survey_version"`);
    await queryRunner.query(`DROP TABLE "survey_question"`);
    await queryRunner.query(`DROP TABLE "survey_response_detail"`);
    await queryRunner.query(`DROP TABLE "survey_response"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "survey_question_option"`);
    await queryRunner.query(`DROP TABLE "survey"`);
  }
}
