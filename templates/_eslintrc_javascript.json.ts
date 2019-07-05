import * as JSON5 from "json5";
import { TemplateFunction } from "../src/lib/createAdapter";

const templateFunction: TemplateFunction = answers => {

	// This version is intended for use in JS projects
	if (answers.language !== "JavaScript") return;

	const useESLint = answers.tools && answers.tools.indexOf("ESLint") > -1;
	if (!useESLint) return;

	let ecmaVersion = answers.ecmaVersion || 2017;
	const useES6Class = answers.es6class === "yes";
	if (useES6Class) ecmaVersion = Math.max(ecmaVersion, 2018) as any;

	const template = `
{
    "env": {
        "es6": true,
        "node": true,
        "mocha": true
    },
    "extends": "eslint:recommended",
    "rules": {
        "indent": [
            "error",
            ${answers.indentation === "Tab" ? `"tab"` : "4"},
            {
                "SwitchCase": 1
            }
        ],
        "no-console": "off",
        "no-var": "error",
        "prefer-const": "error",
        "quotes": [
            "error",
            "${typeof answers.quotes === "string" ? answers.quotes : "double"}",
            {
                "avoidEscape": true,
                "allowTemplateLiterals": true
            }
        ],
        "semi": [
            "error",
            "always"
        ]
    },
    ${ecmaVersion > 2015 ? (`
        "parserOptions": {
            "ecmaVersion": ${ecmaVersion}
        }
    `) : ""}
}
`;
	return JSON.stringify(JSON5.parse(template), null, 4);
};

templateFunction.customPath = ".eslintrc.json";
export = templateFunction;
