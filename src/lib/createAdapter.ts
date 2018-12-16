import { isArray } from "alcalzone-shared/typeguards";
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import * as templateFiles from "../templates";
import { Answers, AnswerValue, Condition } from "./questions";
import { indentWithSpaces, indentWithTabs, jsFixQuotes } from "./tools";

type TemplateFunctionReturnType = string | Buffer | undefined;
export interface TemplateFunction {
	(answers: Answers): TemplateFunctionReturnType | Promise<TemplateFunctionReturnType>;
	customPath?: string | ((answers: Answers) => string);
	noReformat?: boolean;
}
export interface File {
	name: string;
	content: string | Buffer;
	noReformat: boolean;
}

export function testCondition(condition: Condition | Condition[] | undefined, answers: Record<string, any>): boolean {
	if (condition == undefined) return true;

	function testSingleCondition(cond: Condition) {
		if ("value" in cond) {
			return answers[cond.name] === cond.value;
		} else if ("contains" in cond) {
			return (answers[cond.name] as AnswerValue[]).indexOf(cond.contains) > -1;
		}
		return false;
	}

	if (isArray(condition)) {
		return condition.every(cond => testSingleCondition(cond));
	} else {
		return testSingleCondition(condition);
	}
}

export async function createFiles(answers: Answers): Promise<File[]> {
	const files = await Promise.all(
		templateFiles.map(async ({name, templateFunction}) => {
			const customPath = typeof templateFunction.customPath === "function" ? templateFunction.customPath(answers)
				: typeof templateFunction.customPath === "string" ? templateFunction.customPath
				: name.replace(/\.ts$/i, "")
			;
			const templateResult = templateFunction(answers);
			return {
				name: customPath,
				content: templateResult instanceof Promise ? await templateResult : templateResult,
				noReformat: templateFunction.noReformat === true,
			};
		}),
	);
	const necessaryFiles = files.filter(f => f.content != undefined) as File[];
	return formatFiles(answers, necessaryFiles);
}

/** Formats files that are not explicitly forbidden to be formatted */
function formatFiles(answers: Answers, files: File[]): File[] {
	// Normalize indentation considering user preference
	const indentation = answers.indentation === "Tab" ? indentWithTabs : indentWithSpaces;
	// Remove multiple subsequent empty lines (can happen during template creation).
	const removeEmptyLines = (text: string) => {
		return text && text
			.replace(/\r\n/g, "\n")
			.replace(/^(\s*\n){2,}/gm, "\n")
			.replace(/\n/g, os.EOL)
		;
	};
	const trimWhitespaceLines = (text: string) => text && text.replace(/^[ \t]+$/gm, "");
	const formatter = (text: string) => trimWhitespaceLines(removeEmptyLines(indentation(text)));
	return files.map(f => {
		if (f.noReformat || typeof f.content !== "string") return f;
		// 1st step: Apply formatters that are valid for all files
		f.content = formatter(f.content);
		// 2nd step: Apply more specialized formatters
		if (f.name.endsWith(".js") && answers.quotes != undefined) {
			f.content = jsFixQuotes(f.content, answers.quotes);
		}
		return f;
	});
}

export async function writeFiles(targetDir: string, files: File[]) {
	// write the files and make sure the target dirs exist
	for (const file of files) {
		await fs.outputFile(path.join(targetDir, file.name), file.content, typeof file.content === "string" ? "utf8" : undefined);
	}
}