import { TemplateFunction } from "../src/lib/createAdapter";

const templateFunction: TemplateFunction = answers => {

	const useNyc = answers.tools && answers.tools.indexOf("code coverage") > -1;
	const useTypeScript = answers.language === "TypeScript";

	const template = `
.git
.idea
node_modules
nbproject

${useTypeScript ? (`
# Sourcemaps
maps/
`) : ""}

# npm package files
iobroker.*.tgz

Thumbs.db
${useNyc ? `
# NYC coverage files
coverage
.nyc*

` : ""}
# i18n intermediate files
admin/i18n/flat.txt
admin/i18n/*/flat.txt
`;
	return template.trim();
};

templateFunction.customPath = ".gitignore";
export = templateFunction;
