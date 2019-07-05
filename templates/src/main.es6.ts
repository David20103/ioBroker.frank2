import { TemplateFunction } from "../../src/lib/createAdapter";
import { AdapterSettings, getDefaultAnswer } from "../../src/lib/questions";
import { kebabCaseToUpperCamelCase } from "../../src/lib/tools";

const templateFunction: TemplateFunction = async answers => {

	const useTypeScript = answers.language === "TypeScript";
	const useES6Class = answers.es6class === "yes";
	if (!useTypeScript || !useES6Class) return;

	const className = kebabCaseToUpperCamelCase(answers.adapterName);
	const adapterSettings: AdapterSettings[] = answers.adapterSettings || getDefaultAnswer("adapterSettings")!;
	const quote = answers.quotes === "double" ? '"' : "'";

	const template = `
/*
 * Created with @iobroker/create-adapter v${answers.creatorVersion}
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from "@iobroker/adapter-core";

// Load your modules here, e.g.:
// import * as fs from "fs";

// Augment the adapter.config object with the actual types
// TODO: delete this in the next version
declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace ioBroker {
		interface AdapterConfig {
			// Define the shape of your options here (recommended)
${adapterSettings.map(s => `\t\t\t${s.key}: ${typeof s.defaultValue};`).join("\n")}
			// Or use a catch-all approach
			[key: string]: any;
		}
	}
}

class ${className} extends utils.Adapter {

	public constructor(options: Partial<ioBroker.AdapterOptions> = {}) {
		super({
			...options,
			name: "${answers.adapterName}",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("objectChange", this.onObjectChange.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on(${quote}message${quote}, this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	private async onReady(): Promise<void> {
		// Initialize your adapter here


${answers.connectionIndicator === "yes" ? `
		// Reset the connection indicator during startup
		this.setState("info.connection", false, true);
` : ""}

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
${adapterSettings.map(s => `\t\tthis.log.info("config ${s.key}: " + this.config.${s.key});`).join("\n")}

		/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*/
		await this.setObjectAsync("testVariable", {
			type: "state",
			common: {
				name: "testVariable",
				type: "boolean",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		// in this template all states changes inside the adapters namespace are subscribed
		this.subscribeStates("*");

		/*
		setState examples
		you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		*/
		// the variable testVariable is set to true as command (ack=false)
		await this.setStateAsync("testVariable", true);

		// same thing, but the value is flagged "ack"
		// ack should be always set to true if the value is received from or acknowledged from the target system
		await this.setStateAsync("testVariable", { val: true, ack: true });

		// same thing, but the state is deleted after 30s (getState will return null afterwards)
		await this.setStateAsync("testVariable", { val: true, ack: true, expire: 30 });

		// examples for the checkPassword/checkGroup functions
		let result = await this.checkPasswordAsync("admin", "iobroker");
		this.log.info("check user admin pw ioboker: " + result);

		result = await this.checkGroupAsync("admin", "admin");
		this.log.info("check group user admin group admin: " + result);
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 */
	private onUnload(callback: () => void): void {
		try {
			this.log.info("cleaned everything up...");
			callback();
		} catch (e) {
			callback();
		}
	}

	/**
	 * Is called if a subscribed object changes
	 */
	private onObjectChange(id: string, obj: ioBroker.Object | null | undefined): void {
		if (obj) {
			// The object was changed
			this.log.info(\`object \${id} changed: \${JSON.stringify(obj)}\`);
		} else {
			// The object was deleted
			this.log.info(\`object \${id} deleted\`);
		}
	}

	/**
	 * Is called if a subscribed state changes
	 */
	private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
		if (state) {
			// The state was changed
			this.log.info(\`state \${id} changed: \${state.val} (ack = \${state.ack})\`);
		} else {
			// The state was deleted
			this.log.info(\`state \${id} deleted\`);
		}
	}

	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.message" property to be set to true in io-package.json
	//  */
	// private onMessage(obj: ioBroker.Message): void {
	// 	if (typeof obj === ${quote}object${quote} && obj.message) {
	// 		if (obj.command === ${quote}send${quote}) {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info(${quote}send command${quote});

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, ${quote}Message received${quote}, obj.callback);
	// 		}
	// 	}
	// }

}

if (module.parent) {
	// Export the constructor in compact mode
	module.exports = (options: Partial<ioBroker.AdapterOptions> | undefined) => new ${className}(options);
} else {
	// otherwise start the instance directly
	(() => new ${className}())();
}
`;
	return template.trim();
};
templateFunction.customPath = "src/main.ts";
export = templateFunction;
