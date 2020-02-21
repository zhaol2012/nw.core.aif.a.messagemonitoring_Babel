sap.ui.define([
	"sap/ui/test/Opa5",
	"nw/core/aif/a/messagemonitoring/test/integration/arrangements/Startup",
	"nw/core/aif/a/messagemonitoring/test/integration/SearchJourney",
	"./CancelMessageJourney"
], function (Opa5, Startup) {
	

	Opa5.extendConfig({
		arrangements: new Startup(),
		autoWait: true,
		pollingInterval: 1
	});

});