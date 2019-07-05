"use strict";

/*
 * Created with @iobroker/create-adapter v1.15.1
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
onst utils = require("@iobroker/adapter-core");

// Load your modules here, e.g.:
// const fs = require("fs");
const UsbScanner = require('usb-barcode-scanner').UsbScanner;

class Frank1 extends utils.Adapter {

	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "frank1",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("objectChange", this.onObjectChange.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize your adapter here

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		this.log.info("config option1: " + this.config.option1);
		this.log.info("config option2: " + this.config.option2);
		
		
 
		let scanner = new UsbScanner({
        		vendorId: 5050,
    		productId: 24
		});
 
		scanner.on('data', (data) => {
    		this.log.info(decimalToHex(data));
		await this.setStateAsync("RFID", { val: decimalToHex(data) , ack: true });
		});
 
		scanner.startScanning();



		function decimalToHex(d, padding) {
    			var hex = Number(d).toString(16);

    			padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

    			while (hex.length < padding) {
    	    			hex = "0" + hex;
    			}

    			var s = "";
    			var i = hex.length;
    			while (i>0) {
        			s += hex.substring(i-2,i);
        			i=i-2;
    			}
    			return s;


}



		/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*/
		await this.setObjectAsync("RFID", {
			type: "state",
			common: {
				name: "RFID",
				type: "number",
				role: "Zugang",
				read: true,
				write: true,
			},
			native: {},
		});

		// in this template all states changes inside the adapters namespace are subscribed
		this.subscribeStates("*");

		//await this.setStateAsync("RFID", { val: true, ack: true });

		}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			this.log.info("cleaned everything up...");
			callback();
		} catch (e) {
			callback();
		}
	}


	onObjectChange(id, obj) {
		if (obj) {
			// The object was changed
			this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
		} else {
			// The object was deleted
			this.log.info(`object ${id} deleted`);
		}
	}


	onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}


}

// @ts-ignore parent is a valid property on module
if (module.parent) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new Frank1(options);
} else {
	// otherwise start the instance directly
	new frank1();
}
