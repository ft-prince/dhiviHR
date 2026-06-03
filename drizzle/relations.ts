import { relations } from "drizzle-orm/relations";
import { accessCodeBatches, accessCodes, colleges, users, sessions, streams, auditLogs, formTemplates, payments, assessments, scores, responses, questions, templateQuestions, sections, competencies, accounts } from "./schema";

export const accessCodesRelations = relations(accessCodes, ({one}) => ({
	accessCodeBatch: one(accessCodeBatches, {
		fields: [accessCodes.batchId],
		references: [accessCodeBatches.id]
	}),
	college: one(colleges, {
		fields: [accessCodes.collegeId],
		references: [colleges.id]
	}),
	user: one(users, {
		fields: [accessCodes.redeemedBy],
		references: [users.id]
	}),
}));

export const accessCodeBatchesRelations = relations(accessCodeBatches, ({one, many}) => ({
	accessCodes: many(accessCodes),
	college: one(colleges, {
		fields: [accessCodeBatches.collegeId],
		references: [colleges.id]
	}),
	user: one(users, {
		fields: [accessCodeBatches.createdBy],
		references: [users.id]
	}),
}));

export const collegesRelations = relations(colleges, ({many}) => ({
	accessCodes: many(accessCodes),
	accessCodeBatches: many(accessCodeBatches),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	accessCodes: many(accessCodes),
	sessions: many(sessions),
	accessCodeBatches: many(accessCodeBatches),
	stream: one(streams, {
		fields: [users.streamId],
		references: [streams.id]
	}),
	auditLogs: many(auditLogs),
	formTemplates: many(formTemplates),
	payments: many(payments),
	assessments: many(assessments),
	questions: many(questions),
	accounts: many(accounts),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const streamsRelations = relations(streams, ({many}) => ({
	users: many(users),
	assessments: many(assessments),
	questions: many(questions),
}));

export const auditLogsRelations = relations(auditLogs, ({one}) => ({
	user: one(users, {
		fields: [auditLogs.actorId],
		references: [users.id]
	}),
}));

export const formTemplatesRelations = relations(formTemplates, ({one, many}) => ({
	user: one(users, {
		fields: [formTemplates.createdBy],
		references: [users.id]
	}),
	templateQuestions: many(templateQuestions),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	user: one(users, {
		fields: [payments.userId],
		references: [users.id]
	}),
	assessment: one(assessments, {
		fields: [payments.assessmentId],
		references: [assessments.id]
	}),
}));

export const assessmentsRelations = relations(assessments, ({one, many}) => ({
	payments: many(payments),
	scores: many(scores),
	user: one(users, {
		fields: [assessments.userId],
		references: [users.id]
	}),
	stream: one(streams, {
		fields: [assessments.streamId],
		references: [streams.id]
	}),
	responses: many(responses),
}));

export const scoresRelations = relations(scores, ({one}) => ({
	assessment: one(assessments, {
		fields: [scores.assessmentId],
		references: [assessments.id]
	}),
}));

export const responsesRelations = relations(responses, ({one}) => ({
	assessment: one(assessments, {
		fields: [responses.assessmentId],
		references: [assessments.id]
	}),
	question: one(questions, {
		fields: [responses.questionId],
		references: [questions.id]
	}),
}));

export const questionsRelations = relations(questions, ({one, many}) => ({
	responses: many(responses),
	templateQuestions: many(templateQuestions),
	user: one(users, {
		fields: [questions.createdBy],
		references: [users.id]
	}),
	stream: one(streams, {
		fields: [questions.streamId],
		references: [streams.id]
	}),
	section: one(sections, {
		fields: [questions.sectionId],
		references: [sections.id]
	}),
	competency: one(competencies, {
		fields: [questions.competencyId],
		references: [competencies.id]
	}),
}));

export const templateQuestionsRelations = relations(templateQuestions, ({one}) => ({
	formTemplate: one(formTemplates, {
		fields: [templateQuestions.templateId],
		references: [formTemplates.id]
	}),
	question: one(questions, {
		fields: [templateQuestions.questionId],
		references: [questions.id]
	}),
}));

export const sectionsRelations = relations(sections, ({many}) => ({
	questions: many(questions),
}));

export const competenciesRelations = relations(competencies, ({many}) => ({
	questions: many(questions),
}));

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));